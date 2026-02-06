import { query, getClient } from '../config/database.js';

// UC-COR-01: Check Existing COR (mock SFS integration)
export async function checkExistingCOR(applicationId) {
  // Get application details
  const appRes = await query(
    `SELECT a.id, a.applicant_id, a.scholarship_id, a.cor_status,
            a.postsecondary_info->>'institution_name' as institution_name,
            a.postsecondary_info->>'program' as program,
            a.postsecondary_info->>'enrollment_status' as enrollment_status,
            u.first_name, u.last_name, u.email
     FROM ae_scholarships.applications a
     JOIN ae_scholarships.users u ON u.id = a.applicant_id
     WHERE a.id = $1`,
    [applicationId]
  );

  if (!appRes.rows[0]) {
    const err = new Error('Application not found');
    err.status = 404;
    throw err;
  }

  const app = appRes.rows[0];

  // Mock SFS check: simulate querying Student Finance System for existing COR
  // In production, this would call the SFS API
  const sfsResult = await mockSFSCheck(app);

  if (sfsResult.hasExistingCOR) {
    // COR already confirmed via SFS (loans/grants)
    await query(
      `UPDATE ae_scholarships.applications
       SET cor_status = 'Confirmed', cor_confirmed_date = now(), updated_at = now()
       WHERE id = $1`,
      [applicationId]
    );

    // Log audit
    await query(
      `INSERT INTO ae_scholarships.audit_logs (user_id, application_id, action, details)
       VALUES ($1, $2, 'COR_AUTO_CONFIRMED', $3)`,
      [app.applicant_id, applicationId, JSON.stringify({
        source: 'SFS', institution: app.institution_name, confirmed_date: new Date().toISOString()
      })]
    ).catch(() => {});

    return { status: 'Confirmed', source: 'SFS', message: 'COR confirmed via Student Finance System' };
  } else {
    // No existing COR - set to Pending
    await query(
      `UPDATE ae_scholarships.applications SET cor_status = 'Pending', updated_at = now() WHERE id = $1`,
      [applicationId]
    );

    // Log audit
    await query(
      `INSERT INTO ae_scholarships.audit_logs (user_id, application_id, action, details)
       VALUES ($1, $2, 'COR_CHECK_PENDING', $3)`,
      [app.applicant_id, applicationId, JSON.stringify({
        source: 'SFS', institution: app.institution_name, result: 'No existing COR found'
      })]
    ).catch(() => {});

    return { status: 'Pending', source: 'SFS', message: 'No existing COR found. Manual COR request needed.' };
  }
}

// Mock SFS integration - simulates checking Student Finance System
async function mockSFSCheck(app) {
  // In production: call SFS API with student info
  // For dev: randomly confirm ~30% based on enrollment status
  const hasLoan = app.enrollment_status === 'full_time' && Math.random() > 0.7;
  return { hasExistingCOR: hasLoan, sfsId: hasLoan ? `SFS-${Date.now()}` : null };
}

// UC-COR-02: Send COR Request to Institution
export async function sendCORRequest(applicationId, staffUserId, { institution_email, custom_message } = {}) {
  const appRes = await query(
    `SELECT a.id, a.reference_number, a.cor_status, a.applicant_id,
            a.postsecondary_info->>'institution_name' as institution_name,
            a.postsecondary_info->>'program' as program,
            a.postsecondary_info->>'enrollment_status' as enrollment_status,
            a.postsecondary_info->>'year_of_study' as year_of_study,
            a.personal_info->>'first_name' as first_name,
            a.personal_info->>'last_name' as last_name
     FROM ae_scholarships.applications a
     WHERE a.id = $1`,
    [applicationId]
  );

  if (!appRes.rows[0]) {
    const err = new Error('Application not found');
    err.status = 404;
    throw err;
  }

  const app = appRes.rows[0];

  if (app.cor_status === 'Confirmed') {
    const err = new Error('COR is already confirmed');
    err.status = 400;
    throw err;
  }

  // Generate a secure token for institution response
  const responseToken = generateToken();

  // Create COR request record
  await query(
    `INSERT INTO ae_scholarships.cor_requests (
       application_id, institution_name, institution_email,
       requested_by, response_token, status,
       applicant_name, program, enrollment_status, year_of_study,
       custom_message
     ) VALUES ($1, $2, $3, $4, $5, 'Sent', $6, $7, $8, $9, $10)`,
    [
      applicationId, app.institution_name,
      institution_email || `registrar@${app.institution_name?.toLowerCase().replace(/\s+/g, '')}.ca`,
      staffUserId, responseToken,
      `${app.first_name} ${app.last_name}`, app.program,
      app.enrollment_status, app.year_of_study,
      custom_message || null
    ]
  );

  // Update application COR status
  await query(
    `UPDATE ae_scholarships.applications SET cor_status = 'Requested', updated_at = now() WHERE id = $1`,
    [applicationId]
  );

  // Create notification for applicant
  await query(
    `INSERT INTO ae_scholarships.notifications (user_id, application_id, type, title, message)
     VALUES ($1, $2, 'cor_request', 'COR Request Sent', $3)`,
    [app.applicant_id, applicationId,
     `A Confirmation of Registration request has been sent to ${app.institution_name} for your application ${app.reference_number}.`]
  ).catch(() => {});

  // Log audit
  await query(
    `INSERT INTO ae_scholarships.audit_logs (user_id, application_id, action, details)
     VALUES ($1, $2, 'COR_REQUEST_SENT', $3)`,
    [staffUserId, applicationId, JSON.stringify({
      institution: app.institution_name, institution_email: institution_email,
      response_token: responseToken
    })]
  ).catch(() => {});

  return {
    message: 'COR request sent successfully',
    institution: app.institution_name,
    responseToken,
    status: 'Requested'
  };
}

// UC-COR-03: Process COR Response from Institution
export async function processCORResponse(responseToken, { status, confirmed_by, notes } = {}) {
  // Find the COR request by token
  const reqRes = await query(
    `SELECT cr.*, a.applicant_id, a.reference_number
     FROM ae_scholarships.cor_requests cr
     JOIN ae_scholarships.applications a ON a.id = cr.application_id
     WHERE cr.response_token = $1 AND cr.status = 'Sent'`,
    [responseToken]
  );

  if (!reqRes.rows[0]) {
    const err = new Error('COR request not found or already processed');
    err.status = 404;
    throw err;
  }

  const corReq = reqRes.rows[0];

  if (!['Confirmed', 'Not Confirmed', 'Unable to Confirm'].includes(status)) {
    const err = new Error('Invalid status. Must be: Confirmed, Not Confirmed, or Unable to Confirm');
    err.status = 400;
    throw err;
  }

  // Update COR request
  await query(
    `UPDATE ae_scholarships.cor_requests
     SET status = $2, responded_at = now(), confirmed_by = $3, response_notes = $4
     WHERE id = $1`,
    [corReq.id, status, confirmed_by || 'Institution', notes || null]
  );

  // Map COR response to application cor_status
  const appCorStatus = status === 'Confirmed' ? 'Confirmed' : 'Failed';
  const updateFields = status === 'Confirmed'
    ? `cor_status = 'Confirmed', cor_confirmed_date = now(), updated_at = now()`
    : `cor_status = 'Failed', updated_at = now()`;

  await query(
    `UPDATE ae_scholarships.applications SET ${updateFields} WHERE id = $1`,
    [corReq.application_id]
  );

  // Create notification for applicant
  const notifMessage = status === 'Confirmed'
    ? `Your enrollment at ${corReq.institution_name} has been confirmed for application ${corReq.reference_number}.`
    : `The institution was unable to confirm your enrollment for application ${corReq.reference_number}. Please contact the scholarship office.`;

  await query(
    `INSERT INTO ae_scholarships.notifications (user_id, application_id, type, title, message)
     VALUES ($1, $2, 'cor_request', $3, $4)`,
    [corReq.applicant_id, corReq.application_id,
     status === 'Confirmed' ? 'COR Confirmed' : 'COR Not Confirmed',
     notifMessage]
  ).catch(() => {});

  // Log audit
  await query(
    `INSERT INTO ae_scholarships.audit_logs (application_id, action, details)
     VALUES ($1, 'COR_RESPONSE_RECEIVED', $2)`,
    [corReq.application_id, JSON.stringify({
      institution: corReq.institution_name, status, confirmed_by, notes
    })]
  ).catch(() => {});

  return {
    message: `COR response recorded: ${status}`,
    applicationStatus: appCorStatus,
    applicationId: corReq.application_id,
    referenceNumber: corReq.reference_number
  };
}

// Get COR status for an application
export async function getCORStatus(applicationId) {
  const res = await query(
    `SELECT a.cor_status, a.cor_confirmed_date,
            a.postsecondary_info->>'institution_name' as institution_name,
            a.reference_number
     FROM ae_scholarships.applications a WHERE a.id = $1`,
    [applicationId]
  );
  if (!res.rows[0]) return null;

  // Get COR request history
  const requests = await query(
    `SELECT id, institution_name, institution_email, status, created_at, responded_at,
            confirmed_by, response_notes, applicant_name, program
     FROM ae_scholarships.cor_requests
     WHERE application_id = $1
     ORDER BY created_at DESC`,
    [applicationId]
  );

  return {
    ...res.rows[0],
    requests: requests.rows
  };
}

// Get all pending COR requests (for staff)
export async function getPendingCORRequests({ page = 1, limit = 25 } = {}) {
  const offset = (page - 1) * limit;

  const countRes = await query(
    `SELECT count(*) FROM ae_scholarships.cor_requests WHERE status = 'Sent'`
  );

  const res = await query(
    `SELECT cr.id, cr.application_id, cr.institution_name, cr.institution_email,
            cr.applicant_name, cr.program, cr.enrollment_status, cr.year_of_study,
            cr.status, cr.created_at,
            a.reference_number, a.cor_status as app_cor_status,
            EXTRACT(DAY FROM now() - cr.created_at)::int as days_pending,
            u.display_name as requested_by_name
     FROM ae_scholarships.cor_requests cr
     JOIN ae_scholarships.applications a ON a.id = cr.application_id
     LEFT JOIN ae_scholarships.users u ON u.id = cr.requested_by
     WHERE cr.status = 'Sent'
     ORDER BY cr.created_at ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return {
    data: res.rows,
    total: parseInt(countRes.rows[0].count),
    page,
    limit
  };
}

// Get all COR requests (for reporting)
export async function getAllCORRequests({ status, institution, page = 1, limit = 25 } = {}) {
  const offset = (page - 1) * limit;
  let sql = `
    SELECT cr.*, a.reference_number,
           u.display_name as requested_by_name,
           EXTRACT(DAY FROM COALESCE(cr.responded_at, now()) - cr.created_at)::int as turnaround_days
    FROM ae_scholarships.cor_requests cr
    JOIN ae_scholarships.applications a ON a.id = cr.application_id
    LEFT JOIN ae_scholarships.users u ON u.id = cr.requested_by
    WHERE 1=1`;

  const values = [];
  let paramCount = 0;

  if (status) {
    paramCount++;
    sql += ` AND cr.status = $${paramCount}`;
    values.push(status);
  }
  if (institution) {
    paramCount++;
    sql += ` AND cr.institution_name ILIKE $${paramCount}`;
    values.push(`%${institution}%`);
  }

  // Build count query from the same WHERE clause
  let countSql = `SELECT count(*) FROM ae_scholarships.cor_requests cr
    JOIN ae_scholarships.applications a ON a.id = cr.application_id
    LEFT JOIN ae_scholarships.users u ON u.id = cr.requested_by
    WHERE 1=1`;
  if (status) countSql += ` AND cr.status = $1`;
  if (institution) countSql += ` AND cr.institution_name ILIKE $${status ? 2 : 1}`;
  const countRes = await query(countSql, values);

  sql += ` ORDER BY cr.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  values.push(limit, offset);

  const res = await query(sql, values);

  return {
    data: res.rows,
    total: parseInt(countRes.rows[0].count),
    page,
    limit
  };
}

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 48; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
