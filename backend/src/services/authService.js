import { query } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

// Mock ACA (Alberta.ca Account) SSO - simulates OIDC callback
export async function authenticateWithACA(acaProfile) {
  const { email, displayName, acaId } = acaProfile;

  // Check if user exists by ACA ID or email
  let result = await query(
    `SELECT * FROM ae_scholarships.users WHERE aca_id = $1 OR email = $2`,
    [acaId, email]
  );

  let user;
  if (result.rows.length > 0) {
    user = result.rows[0];
    // Update last login and ACA ID if not set
    await query(
      `UPDATE ae_scholarships.users SET last_login = NOW(), aca_id = COALESCE(aca_id, $1) WHERE id = $2`,
      [acaId, user.id]
    );
  } else {
    // Create new applicant user
    result = await query(
      `INSERT INTO ae_scholarships.users (email, display_name, aca_id, role, oauth_provider)
       VALUES ($1, $2, $3, 'applicant', 'aca')
       RETURNING *`,
      [email, displayName, acaId]
    );
    user = result.rows[0];
  }

  const token = generateToken(user);

  // Log audit (non-blocking)
  logAudit(user.id, 'login', { provider: 'aca' }).catch(() => {});

  return {
    token,
    user: sanitizeUser(user)
  };
}

// Mock Microsoft Entra ID SSO - simulates staff login
export async function authenticateWithMicrosoft(msProfile) {
  const { email, displayName, msId } = msProfile;

  // Staff users must already exist in the system
  let result = await query(
    `SELECT * FROM ae_scholarships.users WHERE email = $1`,
    [email]
  );

  let user;
  if (result.rows.length > 0) {
    user = result.rows[0];
    // Verify user has a staff role
    const staffRoles = ['scholarship_staff', 'scholarship_manager', 'admin', 'superadmin', 'finance'];
    if (!staffRoles.includes(user.role)) {
      throw new Error('Account is not authorized for staff access');
    }
    await query(
      `UPDATE ae_scholarships.users SET last_login = NOW(), oauth_provider = 'microsoft' WHERE id = $1`,
      [user.id]
    );
  } else {
    // Auto-create staff user (in production, this would require pre-registration)
    result = await query(
      `INSERT INTO ae_scholarships.users (email, display_name, role, oauth_provider)
       VALUES ($1, $2, 'scholarship_staff', 'microsoft')
       RETURNING *`,
      [email, displayName]
    );
    user = result.rows[0];
  }

  const token = generateToken(user);

  logAudit(user.id, 'login', { provider: 'microsoft' }).catch(() => {});

  return {
    token,
    user: sanitizeUser(user)
  };
}

// Dev login - for development/testing only
export async function devLogin(email, role) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Dev login not available in production');
  }

  let result = await query(
    `SELECT * FROM ae_scholarships.users WHERE email = $1`,
    [email]
  );

  let user;
  if (result.rows.length > 0) {
    user = result.rows[0];
    await query(
      `UPDATE ae_scholarships.users SET last_login = NOW() WHERE id = $1`,
      [user.id]
    );
  } else {
    result = await query(
      `INSERT INTO ae_scholarships.users (email, display_name, role, oauth_provider)
       VALUES ($1, $2, $3, 'local')
       RETURNING *`,
      [email, email.split('@')[0], role || 'applicant']
    );
    user = result.rows[0];
  }

  const token = generateToken(user);
  return { token, user: sanitizeUser(user) };
}

// UC-AUTH-04: Session Refresh - issue new token
export async function refreshSession(userId) {
  const result = await query(
    'SELECT * FROM ae_scholarships.users WHERE id = $1',
    [userId]
  );
  if (!result.rows[0]) {
    throw Object.assign(new Error('User not found'), { status: 401 });
  }
  if (result.rows[0].is_blocked) {
    throw Object.assign(new Error('Account is blocked'), { status: 403 });
  }

  const user = result.rows[0];
  const token = generateToken(user);

  logAudit(userId, 'token_refresh', {}).catch(() => {});

  return { token, user: sanitizeUser(user) };
}

// Get current user profile
export async function getUserProfile(userId) {
  const result = await query(
    `SELECT id, email, display_name, aca_id, asn, role, oauth_provider, language_preference, created_at, last_login
     FROM ae_scholarships.users WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

// Audit logging helper
async function logAudit(userId, action, details = {}) {
  await query(
    `INSERT INTO ae_scholarships.audit_logs (user_id, action, details)
     VALUES ($1, $2, $3::jsonb)`,
    [userId, action, JSON.stringify(details)]
  );
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
    oauthProvider: user.oauth_provider,
    languagePreference: user.language_preference
  };
}
