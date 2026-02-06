import { query, getClient } from '../config/database.js';

// ============================
// UC-ADMIN-01: Configure Scholarship Program
// ============================

export async function getScholarships({ page = 1, limit = 25, search = '', status = '' } = {}) {
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (search) {
    conditions.push(`(s.name ILIKE $${paramIdx} OR s.code ILIKE $${paramIdx})`);
    params.push(`%${search}%`);
    paramIdx++;
  }
  if (status) {
    conditions.push(`s.status = $${paramIdx}`);
    params.push(status);
    paramIdx++;
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const countRes = await query(`SELECT count(*) FROM ae_scholarships.scholarships s ${where}`, params);

  const offset = (page - 1) * limit;
  const result = await query(`
    SELECT s.*,
           (SELECT count(*) FROM ae_scholarships.applications a WHERE a.scholarship_id = s.id) as application_count
    FROM ae_scholarships.scholarships s
    ${where}
    ORDER BY s.deadline_end DESC, s.name
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `, [...params, limit, offset]);

  return {
    data: result.rows,
    total: parseInt(countRes.rows[0].count),
    page, limit
  };
}

export async function getScholarshipById(id) {
  const result = await query(`
    SELECT s.*,
           (SELECT count(*) FROM ae_scholarships.applications a WHERE a.scholarship_id = s.id) as application_count,
           (SELECT count(*) FROM ae_scholarships.applications a WHERE a.scholarship_id = s.id AND a.status = 'Approved') as approved_count
    FROM ae_scholarships.scholarships s
    WHERE s.id = $1
  `, [id]);
  return result.rows[0] || null;
}

export async function createScholarship(data, userId) {
  const result = await query(`
    INSERT INTO ae_scholarships.scholarships (code, name, type, value, deadline_start, deadline_end,
      payment_date, eligibility_criteria, required_documents, selection_process, max_awards, category,
      source_url, status, academic_year)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `, [
    data.code, data.name, data.type || 'scholarship', data.value,
    data.deadline_start || null, data.deadline_end,
    data.payment_date || null, JSON.stringify(data.eligibility_criteria || {}),
    JSON.stringify(data.required_documents || []), data.selection_process || null,
    data.max_awards || null, data.category || null,
    data.source_url || null, data.status || 'Active', data.academic_year
  ]);

  // Audit log
  query(`
    INSERT INTO ae_scholarships.audit_logs (user_id, action, details)
    VALUES ($1, 'SCHOLARSHIP_CREATED', $2)
  `, [userId, JSON.stringify({ scholarship_id: result.rows[0].id, code: data.code, name: data.name })]).catch(() => {});

  return result.rows[0];
}

export async function updateScholarship(id, data, userId) {
  const existing = await getScholarshipById(id);
  if (!existing) {
    throw Object.assign(new Error('Scholarship not found'), { status: 404 });
  }

  const result = await query(`
    UPDATE ae_scholarships.scholarships SET
      code = COALESCE($2, code),
      name = COALESCE($3, name),
      type = COALESCE($4, type),
      value = COALESCE($5, value),
      deadline_start = COALESCE($6, deadline_start),
      deadline_end = COALESCE($7, deadline_end),
      payment_date = COALESCE($8, payment_date),
      eligibility_criteria = COALESCE($9, eligibility_criteria),
      required_documents = COALESCE($10, required_documents),
      selection_process = COALESCE($11, selection_process),
      max_awards = COALESCE($12, max_awards),
      category = COALESCE($13, category),
      source_url = COALESCE($14, source_url),
      status = COALESCE($15, status),
      academic_year = COALESCE($16, academic_year),
      updated_at = now()
    WHERE id = $1
    RETURNING *
  `, [
    id, data.code, data.name, data.type, data.value,
    data.deadline_start, data.deadline_end, data.payment_date,
    data.eligibility_criteria ? JSON.stringify(data.eligibility_criteria) : null,
    data.required_documents ? JSON.stringify(data.required_documents) : null,
    data.selection_process, data.max_awards, data.category,
    data.source_url, data.status, data.academic_year
  ]);

  // Audit log
  query(`
    INSERT INTO ae_scholarships.audit_logs (user_id, action, details)
    VALUES ($1, 'SCHOLARSHIP_UPDATED', $2)
  `, [userId, JSON.stringify({ scholarship_id: id, changes: Object.keys(data).filter(k => data[k] !== undefined) })]).catch(() => {});

  return result.rows[0];
}

// Get lookup data for scholarship forms
export async function getScholarshipLookups() {
  const [categories, types] = await Promise.all([
    query('SELECT code, label FROM ae_scholarships.scholarship_categories ORDER BY sort_order'),
    query('SELECT code, label FROM ae_scholarships.scholarship_types ORDER BY sort_order')
  ]);
  return {
    categories: categories.rows,
    types: types.rows
  };
}

// ============================
// UC-ADMIN-02: Manage Users & Roles
// ============================

export async function getUsers({ page = 1, limit = 25, search = '', role = '' } = {}) {
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (search) {
    conditions.push(`(u.display_name ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx})`);
    params.push(`%${search}%`);
    paramIdx++;
  }
  if (role) {
    conditions.push(`u.role = $${paramIdx}`);
    params.push(role);
    paramIdx++;
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const countRes = await query(`SELECT count(*) FROM ae_scholarships.users u ${where}`, params);

  const offset = (page - 1) * limit;
  const result = await query(`
    SELECT u.id, u.email, u.display_name, u.role, u.is_blocked, u.created_at, u.last_login,
           u.first_name, u.last_name, u.phone, u.profile_complete,
           (SELECT count(*) FROM ae_scholarships.applications a WHERE a.applicant_id = u.id) as application_count
    FROM ae_scholarships.users u
    ${where}
    ORDER BY u.created_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `, [...params, limit, offset]);

  return {
    data: result.rows,
    total: parseInt(countRes.rows[0].count),
    page, limit
  };
}

export async function getUserById(userId) {
  const result = await query(`
    SELECT u.id, u.email, u.display_name, u.role, u.is_blocked, u.created_at, u.last_login,
           u.first_name, u.last_name, u.phone, u.profile_complete,
           u.address_city, u.address_province, u.citizenship_status
    FROM ae_scholarships.users u
    WHERE u.id = $1
  `, [userId]);
  return result.rows[0] || null;
}

export async function updateUserRole(targetUserId, newRole, adminUserId) {
  // Prevent admin from removing their own admin role
  if (targetUserId === adminUserId && !['admin', 'superadmin'].includes(newRole)) {
    throw Object.assign(new Error('Cannot remove your own admin role'), { status: 400 });
  }

  // Validate role
  const validRoles = await query('SELECT code FROM ae_scholarships.user_roles');
  const validCodes = validRoles.rows.map(r => r.code);
  if (!validCodes.includes(newRole)) {
    throw Object.assign(new Error(`Invalid role: ${newRole}. Valid roles: ${validCodes.join(', ')}`), { status: 400 });
  }

  const userResult = await query('SELECT id, role, display_name FROM ae_scholarships.users WHERE id = $1', [targetUserId]);
  if (!userResult.rows[0]) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const oldRole = userResult.rows[0].role;
  await query('UPDATE ae_scholarships.users SET role = $1 WHERE id = $2', [newRole, targetUserId]);

  // Audit log
  query(`
    INSERT INTO ae_scholarships.audit_logs (user_id, action, details, old_values, new_values)
    VALUES ($1, 'USER_ROLE_CHANGED', $2, $3, $4)
  `, [
    adminUserId,
    JSON.stringify({ target_user_id: targetUserId, target_name: userResult.rows[0].display_name }),
    JSON.stringify({ role: oldRole }),
    JSON.stringify({ role: newRole })
  ]).catch(() => {});

  return { message: `Role updated from ${oldRole} to ${newRole}`, user_id: targetUserId, old_role: oldRole, new_role: newRole };
}

export async function toggleUserBlock(targetUserId, blocked, adminUserId) {
  // Prevent blocking self
  if (targetUserId === adminUserId) {
    throw Object.assign(new Error('Cannot block yourself'), { status: 400 });
  }

  const userResult = await query('SELECT id, display_name, is_blocked FROM ae_scholarships.users WHERE id = $1', [targetUserId]);
  if (!userResult.rows[0]) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  await query('UPDATE ae_scholarships.users SET is_blocked = $1 WHERE id = $2', [blocked, targetUserId]);

  query(`
    INSERT INTO ae_scholarships.audit_logs (user_id, action, details)
    VALUES ($1, $2, $3)
  `, [
    adminUserId,
    blocked ? 'USER_BLOCKED' : 'USER_UNBLOCKED',
    JSON.stringify({ target_user_id: targetUserId, target_name: userResult.rows[0].display_name })
  ]).catch(() => {});

  return { message: blocked ? 'User blocked' : 'User unblocked', user_id: targetUserId };
}

export async function getRoles() {
  const result = await query('SELECT code, label, permissions FROM ae_scholarships.user_roles ORDER BY sort_order');
  return result.rows;
}

// ============================
// UC-ADMIN-03: Handle Legacy Submissions
// ============================

export async function getLegacyImports({ page = 1, limit = 25 } = {}) {
  const countRes = await query('SELECT count(*) FROM ae_scholarships.import_history');
  const offset = (page - 1) * limit;
  const result = await query(`
    SELECT * FROM ae_scholarships.import_history
    ORDER BY import_date DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  return {
    data: result.rows,
    total: parseInt(countRes.rows[0].count),
    page, limit
  };
}

export async function importLegacySubmissions(submissions, userId) {
  if (!Array.isArray(submissions) || submissions.length === 0) {
    throw Object.assign(new Error('No submissions provided'), { status: 400 });
  }

  const client = await getClient();
  let imported = 0;
  let failed = 0;
  const errors = [];

  try {
    await client.query('BEGIN');

    for (const sub of submissions) {
      try {
        // Find or create user
        let userResult = await client.query(
          'SELECT id FROM ae_scholarships.users WHERE email = $1',
          [sub.email]
        );

        let applicantId;
        if (userResult.rows.length === 0) {
          const newUser = await client.query(`
            INSERT INTO ae_scholarships.users (email, display_name, role, first_name, last_name)
            VALUES ($1, $2, 'applicant', $3, $4)
            RETURNING id
          `, [sub.email, `${sub.first_name} ${sub.last_name}`, sub.first_name, sub.last_name]);
          applicantId = newUser.rows[0].id;
        } else {
          applicantId = userResult.rows[0].id;
        }

        // Find scholarship
        const schResult = await client.query(
          'SELECT id FROM ae_scholarships.scholarships WHERE code = $1 OR name ILIKE $2 LIMIT 1',
          [sub.scholarship_code || '', `%${sub.scholarship_name || ''}%`]
        );
        if (!schResult.rows[0]) {
          throw new Error(`Scholarship not found: ${sub.scholarship_code || sub.scholarship_name}`);
        }

        // Generate reference number
        const refNum = 'AES-LEG-' + Math.random().toString(16).slice(2, 8).toUpperCase();

        // Create application
        await client.query(`
          INSERT INTO ae_scholarships.applications
            (reference_number, scholarship_id, applicant_id, status, citizenship_status,
             personal_info, submitted_at, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          refNum, schResult.rows[0].id, applicantId,
          sub.status || 'Submitted',
          sub.citizenship_status || 'Canadian Citizen',
          JSON.stringify({ first_name: sub.first_name, last_name: sub.last_name, email: sub.email, legacy: true }),
          sub.submitted_at || new Date().toISOString(),
          sub.submitted_at || new Date().toISOString()
        ]);

        imported++;
      } catch (rowErr) {
        failed++;
        errors.push({ email: sub.email, error: rowErr.message });
      }
    }

    // Record import history
    await client.query(`
      INSERT INTO ae_scholarships.import_history (file_name, table_name, records_imported, records_failed, status, imported_by)
      VALUES ($1, 'applications', $2, $3, $4, $5)
    `, [
      `legacy_import_${new Date().toISOString().slice(0, 10)}`,
      imported, failed,
      failed === 0 ? 'completed' : 'completed_with_errors',
      'admin'
    ]);

    await client.query('COMMIT');

    // Audit log
    query(`
      INSERT INTO ae_scholarships.audit_logs (user_id, action, details)
      VALUES ($1, 'LEGACY_IMPORT', $2)
    `, [userId, JSON.stringify({ imported, failed, errors: errors.slice(0, 10) })]).catch(() => {});

    return { imported, failed, errors: errors.slice(0, 50), total: submissions.length };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ============================
// UC-AUDIT-01: View Audit Trail
// ============================

export async function getAuditLogs({ page = 1, limit = 50, search = '', action = '', userId: filterUserId = '' } = {}) {
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (search) {
    conditions.push(`(u.display_name ILIKE $${paramIdx} OR al.action ILIKE $${paramIdx} OR al.details::text ILIKE $${paramIdx})`);
    params.push(`%${search}%`);
    paramIdx++;
  }
  if (action) {
    conditions.push(`al.action = $${paramIdx}`);
    params.push(action);
    paramIdx++;
  }
  if (filterUserId) {
    conditions.push(`al.user_id = $${paramIdx}`);
    params.push(filterUserId);
    paramIdx++;
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const countRes = await query(
    `SELECT count(*) FROM ae_scholarships.audit_logs al LEFT JOIN ae_scholarships.users u ON u.id = al.user_id ${where}`,
    params
  );

  const offset = (page - 1) * limit;
  const result = await query(`
    SELECT al.*, u.display_name as user_name, u.email as user_email, u.role as user_role
    FROM ae_scholarships.audit_logs al
    LEFT JOIN ae_scholarships.users u ON u.id = al.user_id
    ${where}
    ORDER BY al.created_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `, [...params, limit, offset]);

  return {
    data: result.rows,
    total: parseInt(countRes.rows[0].count),
    page, limit
  };
}

export async function getAuditActions() {
  const result = await query(
    'SELECT DISTINCT action FROM ae_scholarships.audit_logs ORDER BY action'
  );
  return result.rows.map(r => r.action);
}

export async function exportAuditLogs({ action = '', userId: filterUserId = '' } = {}) {
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (action) {
    conditions.push(`al.action = $${paramIdx}`);
    params.push(action);
    paramIdx++;
  }
  if (filterUserId) {
    conditions.push(`al.user_id = $${paramIdx}`);
    params.push(filterUserId);
    paramIdx++;
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const result = await query(`
    SELECT al.created_at, u.display_name as user_name, u.email, u.role,
           al.action, al.details, al.old_values, al.new_values
    FROM ae_scholarships.audit_logs al
    LEFT JOIN ae_scholarships.users u ON u.id = al.user_id
    ${where}
    ORDER BY al.created_at DESC
    LIMIT 10000
  `, params);

  // Convert to CSV
  const headers = ['Timestamp', 'User', 'Email', 'Role', 'Action', 'Details', 'Old Values', 'New Values'];
  const rows = result.rows.map(r => [
    new Date(r.created_at).toISOString(),
    r.user_name || '',
    r.email || '',
    r.role || '',
    r.action,
    r.details ? JSON.stringify(r.details) : '',
    r.old_values ? JSON.stringify(r.old_values) : '',
    r.new_values ? JSON.stringify(r.new_values) : ''
  ]);

  return [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

// ============================
// UC-INT-01: Sync Data with SFS
// ============================

export async function syncWithSFS(userId) {
  // Mock SFS integration - in production this would connect to the Student Finance System
  const syncResults = {
    started_at: new Date().toISOString(),
    enrollment_checks: 0,
    enrollment_confirmed: 0,
    enrollment_failed: 0,
    data_synced: 0,
    errors: []
  };

  try {
    // Get all applications needing COR verification
    const pendingCOR = await query(`
      SELECT a.id, a.reference_number, a.applicant_id, a.cor_status,
             a.postsecondary_info->>'institution' as institution
      FROM ae_scholarships.applications a
      WHERE a.status IN ('Submitted', 'Under Review')
        AND (a.cor_status IS NULL OR a.cor_status = 'Pending')
    `);

    syncResults.enrollment_checks = pendingCOR.rows.length;

    // Simulate SFS enrollment verification for each
    for (const app of pendingCOR.rows) {
      // Mock: 70% confirm, 30% remain pending
      const confirmed = Math.random() < 0.7;
      if (confirmed) {
        await query(`
          UPDATE ae_scholarships.applications
          SET cor_status = 'Confirmed', cor_confirmed_date = NOW(), updated_at = NOW()
          WHERE id = $1
        `, [app.id]);
        syncResults.enrollment_confirmed++;
      } else {
        syncResults.enrollment_failed++;
      }
    }

    // Sync student data (mock - just count records)
    const studentCount = await query(`
      SELECT count(*) FROM ae_scholarships.users WHERE role = 'applicant'
    `);
    syncResults.data_synced = parseInt(studentCount.rows[0].count);

    syncResults.completed_at = new Date().toISOString();
    syncResults.status = 'completed';

    // Audit log
    query(`
      INSERT INTO ae_scholarships.audit_logs (user_id, action, details)
      VALUES ($1, 'SFS_SYNC', $2)
    `, [userId, JSON.stringify(syncResults)]).catch(() => {});

    return syncResults;
  } catch (err) {
    syncResults.status = 'failed';
    syncResults.errors.push(err.message);
    return syncResults;
  }
}
