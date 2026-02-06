import { query } from '../config/database.js';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'ae-scholarships-dev-key-32bytes!';

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'utf8').subarray(0, 32), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = parts.join(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'utf8').subarray(0, 32), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function getProfile(userId) {
  const result = await query(
    `SELECT id, email, display_name, first_name, last_name, date_of_birth,
            phone, address_street, address_city, address_province, address_postal_code,
            citizenship_status, residency_status, indigenous_status, gender,
            asn, sin_encrypted, profile_complete, role, created_at
     FROM ae_scholarships.users WHERE id = $1`,
    [userId]
  );

  if (!result.rows[0]) return null;

  const profile = result.rows[0];
  // Mask SIN for display (show last 3 digits only)
  if (profile.sin_encrypted) {
    try {
      const sin = decrypt(profile.sin_encrypted.toString('utf8'));
      profile.sin_masked = '***-***-' + sin.slice(-3);
    } catch {
      profile.sin_masked = '***-***-***';
    }
    delete profile.sin_encrypted;
  }

  return profile;
}

export async function createProfile(userId, data) {
  const { first_name, last_name, date_of_birth, phone,
          address_street, address_city, address_province, address_postal_code,
          citizenship_status, residency_status, indigenous_status, gender,
          sin, asn } = data;

  // Encrypt SIN
  let sinEncrypted = null;
  if (sin) {
    sinEncrypted = encrypt(sin.replace(/[-\s]/g, ''));
  }

  const displayName = `${first_name} ${last_name}`;

  const result = await query(
    `UPDATE ae_scholarships.users
     SET first_name = $2, last_name = $3, display_name = $4,
         date_of_birth = $5, phone = $6,
         address_street = $7, address_city = $8, address_province = $9, address_postal_code = $10,
         citizenship_status = $11, residency_status = $12, indigenous_status = $13, gender = $14,
         sin_encrypted = $15, asn = $16, profile_complete = true
     WHERE id = $1
     RETURNING id, email, display_name, first_name, last_name, date_of_birth,
               phone, address_street, address_city, address_province, address_postal_code,
               citizenship_status, residency_status, indigenous_status, gender,
               asn, profile_complete, role`,
    [userId, first_name, last_name, displayName, date_of_birth, phone,
     address_street, address_city, address_province, address_postal_code,
     citizenship_status, residency_status, indigenous_status || null, gender || null,
     sinEncrypted, asn || null]
  );

  return result.rows[0];
}

export async function updateProfile(userId, data) {
  const allowedFields = ['first_name', 'last_name', 'phone', 'address_street',
    'address_city', 'address_province', 'address_postal_code',
    'citizenship_status', 'residency_status', 'indigenous_status', 'gender', 'asn'];

  const updates = [];
  const values = [userId];
  let paramCount = 1;

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      paramCount++;
      updates.push(`${field} = $${paramCount}`);
      values.push(data[field]);
    }
  }

  if (data.first_name || data.last_name) {
    // Add a separate display_name parameter
    paramCount++;
    const dn = [data.first_name, data.last_name].filter(Boolean).join(' ');
    if (data.first_name && data.last_name) {
      updates.push(`display_name = $${paramCount}`);
      values.push(dn);
    } else {
      // Partial name update: recalculate from DB values
      updates.push(`display_name = COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')`);
    }
  }

  if (updates.length === 0) return getProfile(userId);

  const result = await query(
    `UPDATE ae_scholarships.users SET ${updates.join(', ')} WHERE id = $1
     RETURNING id, email, display_name, first_name, last_name, date_of_birth,
               phone, address_street, address_city, address_province, address_postal_code,
               citizenship_status, residency_status, indigenous_status, gender,
               asn, profile_complete, role`,
    values
  );

  return result.rows[0];
}

// Banking info
export async function getBankingInfo(userId) {
  const result = await query(
    `SELECT id, institution_number, transit_number, account_number,
            authorization_signed, created_at, updated_at
     FROM ae_scholarships.banking_info WHERE user_id = $1`,
    [userId]
  );

  if (!result.rows[0]) return null;

  const banking = result.rows[0];
  // Mask account number for display
  banking.account_number_masked = '****' + banking.account_number.slice(-4);
  delete banking.account_number;
  return banking;
}

export async function saveBankingInfo(userId, data) {
  const { institution_number, transit_number, account_number, authorization_signed } = data;

  // Check for duplicate bank accounts (fraud detection - UC-PAY-02)
  const duplicateCheck = await query(
    `SELECT u.id, u.display_name FROM ae_scholarships.banking_info b
     JOIN ae_scholarships.users u ON u.id = b.user_id
     WHERE b.institution_number = $1 AND b.transit_number = $2 AND b.account_number = $3
     AND b.user_id != $4`,
    [institution_number, transit_number, account_number, userId]
  );

  const isDuplicate = duplicateCheck.rows.length > 0;

  // Upsert banking info
  const result = await query(
    `INSERT INTO ae_scholarships.banking_info (user_id, institution_number, transit_number, account_number, authorization_signed)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       institution_number = $2, transit_number = $3, account_number = $4,
       authorization_signed = $5, updated_at = now()
     RETURNING id, institution_number, transit_number, authorization_signed, created_at`,
    [userId, institution_number, transit_number, account_number, authorization_signed]
  );

  // UC-PAY-02: Notify staff of duplicate bank account
  if (isDuplicate) {
    const staffUsers = await query(
      `SELECT id FROM ae_scholarships.users WHERE role IN ('scholarship_staff', 'scholarship_manager', 'admin', 'superadmin', 'finance')`
    );
    for (const staff of staffUsers.rows) {
      query(
        `INSERT INTO ae_scholarships.notifications (user_id, type, title, message)
         VALUES ($1, 'action_required', 'Duplicate Bank Account Detected', $2)`,
        [staff.id, `A potential duplicate bank account has been detected. User ${duplicateCheck.rows.map(d => d.display_name).join(', ')} share the same account details. Review required.`]
      ).catch(() => {});
    }
    // Audit log for duplicate detection
    query(
      `INSERT INTO ae_scholarships.audit_logs (user_id, action, details)
       VALUES ($1, 'DUPLICATE_BANK_ACCOUNT_DETECTED', $2)`,
      [userId, JSON.stringify({ duplicate_users: duplicateCheck.rows.map(d => ({ id: d.id, name: d.display_name })) })]
    ).catch(() => {});
  }

  return { ...result.rows[0], duplicate_flag: isDuplicate };
}

// Lookups
export async function getLookup(tableName) {
  const allowedTables = ['citizenship_types', 'provinces', 'scholarship_types',
    'scholarship_categories', 'application_statuses', 'document_types', 'user_roles'];

  if (!allowedTables.includes(tableName)) {
    throw new Error('Invalid lookup table');
  }

  const result = await query(
    `SELECT code, label FROM ae_scholarships.${tableName} ORDER BY sort_order`
  );
  return result.rows;
}
