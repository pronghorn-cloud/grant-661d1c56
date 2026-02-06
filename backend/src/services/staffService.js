import { query, getClient } from '../config/database.js';

// UC-STAFF-01: Work Queue
export async function getWorkQueue({ status, scholarshipId, reviewerId, search, sortBy = 'submitted_at', sortDir = 'ASC', page = 1, limit = 25 } = {}) {
  let sql = `
    SELECT a.id, a.reference_number, a.status, a.submitted_at, a.created_at, a.updated_at,
           a.reviewer_id, a.cor_status, a.decision,
           a.personal_info->>'first_name' as applicant_first_name,
           a.personal_info->>'last_name' as applicant_last_name,
           s.name as scholarship_name, s.type as scholarship_type, s.deadline_end,
           u.email as applicant_email,
           r.display_name as reviewer_name,
           EXTRACT(DAY FROM now() - a.submitted_at)::int as days_in_queue
    FROM ae_scholarships.applications a
    JOIN ae_scholarships.scholarships s ON s.id = a.scholarship_id
    JOIN ae_scholarships.users u ON u.id = a.applicant_id
    LEFT JOIN ae_scholarships.users r ON r.id = a.reviewer_id
    WHERE a.status != 'Draft'`;

  const values = [];
  let paramCount = 0;

  if (status) {
    paramCount++;
    sql += ` AND a.status = $${paramCount}`;
    values.push(status);
  }
  if (scholarshipId) {
    paramCount++;
    sql += ` AND a.scholarship_id = $${paramCount}`;
    values.push(scholarshipId);
  }
  if (reviewerId) {
    paramCount++;
    sql += ` AND a.reviewer_id = $${paramCount}`;
    values.push(reviewerId);
  }
  if (search) {
    paramCount++;
    sql += ` AND (a.reference_number ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR a.personal_info->>'first_name' ILIKE $${paramCount} OR a.personal_info->>'last_name' ILIKE $${paramCount})`;
    values.push(`%${search}%`);
  }

  // Count total
  const countResult = await query(`SELECT count(*) FROM (${sql}) sub`, values);
  const total = parseInt(countResult.rows[0].count, 10);

  // Sort
  const allowedSorts = ['submitted_at', 'status', 'scholarship_name', 'reference_number', 'days_in_queue', 'updated_at'];
  const sortColumn = allowedSorts.includes(sortBy) ? sortBy : 'submitted_at';
  const direction = sortDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  sql += ` ORDER BY ${sortColumn} ${direction}`;

  // Paginate
  const offset = (page - 1) * limit;
  paramCount++;
  sql += ` LIMIT $${paramCount}`;
  values.push(limit);
  paramCount++;
  sql += ` OFFSET $${paramCount}`;
  values.push(offset);

  const result = await query(sql, values);
  return { applications: result.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// UC-STAFF-02: Review Application (full detail)
export async function getApplicationForReview(applicationId) {
  const result = await query(
    `SELECT a.*,
            s.name as scholarship_name, s.type as scholarship_type,
            s.deadline_end, s.value as scholarship_value, s.academic_year,
            s.eligibility_criteria, s.selection_process,
            u.email as applicant_email, u.display_name as applicant_name, u.asn,
            r.display_name as reviewer_name
     FROM ae_scholarships.applications a
     JOIN ae_scholarships.scholarships s ON s.id = a.scholarship_id
     JOIN ae_scholarships.users u ON u.id = a.applicant_id
     LEFT JOIN ae_scholarships.users r ON r.id = a.reviewer_id
     WHERE a.id = $1`,
    [applicationId]
  );
  if (!result.rows[0]) return null;

  const app = result.rows[0];

  // Get documents
  const docs = await query(
    `SELECT id, file_name, file_type, file_size, document_type, uploaded_at, verified
     FROM ae_scholarships.documents WHERE application_id = $1 ORDER BY uploaded_at`,
    [applicationId]
  );
  app.documents = docs.rows;

  // Get correspondence history
  const corr = await query(
    `SELECT al.id, al.action, al.details, al.created_at, u.display_name as staff_name
     FROM ae_scholarships.audit_logs al
     LEFT JOIN ae_scholarships.users u ON u.id = al.user_id
     WHERE al.application_id = $1
     ORDER BY al.created_at DESC`,
    [applicationId]
  );
  app.history = corr.rows;

  // Eligibility check
  app.eligibility = {
    citizenship: !!app.citizenship_status && app.citizenship_status !== '',
    residency: app.residency_status === true,
    enrollment: !!(app.postsecondary_info?.institution_name),
    declaration: app.declaration_signed === true,
    privacy: app.privacy_consent === true
  };

  return app;
}

// UC-STAFF-02: Add review notes
export async function addReviewNotes(applicationId, staffId, notes) {
  const result = await query(
    `UPDATE ae_scholarships.applications
     SET review_notes = COALESCE(review_notes, '') || E'\n' || $2,
         reviewer_id = COALESCE(reviewer_id, $3),
         updated_at = now()
     WHERE id = $1
     RETURNING id, review_notes, reviewer_id`,
    [applicationId, `[${new Date().toISOString()}] ${notes}`, staffId]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Application not found'), { status: 404 });

  // Audit log
  await query(
    `INSERT INTO ae_scholarships.audit_logs (user_id, application_id, action, details)
     VALUES ($1, $2, 'REVIEW_NOTE_ADDED', $3)`,
    [staffId, applicationId, JSON.stringify({ notes })]
  );

  return result.rows[0];
}

// UC-STAFF-03: Generate MI Letter
export async function generateMILetter(applicationId, staffId, { reasons, customMessage }) {
  const app = await query('SELECT id, status, reference_number, applicant_id FROM ae_scholarships.applications WHERE id = $1', [applicationId]);
  if (!app.rows[0]) throw Object.assign(new Error('Application not found'), { status: 404 });

  const application = app.rows[0];
  if (!['Submitted', 'Under Review'].includes(application.status)) {
    throw Object.assign(new Error('Can only request MI for submitted/under review applications'), { status: 400 });
  }

  // Update status
  await query(
    `UPDATE ae_scholarships.applications
     SET status = 'Missing Info', reviewer_id = COALESCE(reviewer_id, $2), updated_at = now()
     WHERE id = $1`,
    [applicationId, staffId]
  );

  // Audit log
  await query(
    `INSERT INTO ae_scholarships.audit_logs (user_id, application_id, action, details)
     VALUES ($1, $2, 'MI_SENT', $3)`,
    [staffId, applicationId, JSON.stringify({ reasons, customMessage })]
  );

  // Create notification for applicant
  const message = `Missing information has been requested for your application ${application.reference_number}. Please review and provide the required documents.`;
  await query(
    `INSERT INTO ae_scholarships.notifications (user_id, application_id, type, title, message)
     VALUES ($1, $2, 'mi_request', 'Missing Information Requested', $3)`,
    [application.applicant_id, applicationId, message]
  );

  return { success: true, status: 'Missing Info' };
}

// UC-STAFF-04: Approve Application
export async function approveApplication(applicationId, staffId, { notes } = {}) {
  const app = await query(
    `SELECT id, status, reference_number, applicant_id, personal_info
     FROM ae_scholarships.applications WHERE id = $1`,
    [applicationId]
  );
  if (!app.rows[0]) throw Object.assign(new Error('Application not found'), { status: 404 });

  const application = app.rows[0];
  if (!['Submitted', 'Under Review'].includes(application.status)) {
    throw Object.assign(new Error('Can only approve submitted/under review applications'), { status: 400 });
  }

  const result = await query(
    `UPDATE ae_scholarships.applications
     SET status = 'Approved', decision = 'Approved', decision_date = now(),
         reviewer_id = COALESCE(reviewer_id, $2),
         review_notes = COALESCE(review_notes, '') || $3,
         updated_at = now()
     WHERE id = $1
     RETURNING id, reference_number, status, decision_date`,
    [applicationId, staffId, notes ? `\n[${new Date().toISOString()}] APPROVED: ${notes}` : '']
  );

  // Audit log
  await query(
    `INSERT INTO ae_scholarships.audit_logs (user_id, application_id, action, details)
     VALUES ($1, $2, 'APPLICATION_APPROVED', $3)`,
    [staffId, applicationId, JSON.stringify({ reference_number: application.reference_number, notes })]
  );

  // Notification
  await query(
    `INSERT INTO ae_scholarships.notifications (user_id, application_id, type, title, message)
     VALUES ($1, $2, 'decision_available', 'Application Approved', $3)`,
    [application.applicant_id, applicationId,
     `Congratulations! Your application ${application.reference_number} has been approved.`]
  );

  return result.rows[0];
}

// UC-STAFF-05: Reject Application
export async function rejectApplication(applicationId, staffId, { reasons, notes } = {}) {
  const app = await query(
    `SELECT id, status, reference_number, applicant_id
     FROM ae_scholarships.applications WHERE id = $1`,
    [applicationId]
  );
  if (!app.rows[0]) throw Object.assign(new Error('Application not found'), { status: 404 });

  const application = app.rows[0];
  if (!['Submitted', 'Under Review'].includes(application.status)) {
    throw Object.assign(new Error('Can only reject submitted/under review applications'), { status: 400 });
  }

  const result = await query(
    `UPDATE ae_scholarships.applications
     SET status = 'Rejected', decision = 'Rejected', decision_date = now(),
         reviewer_id = COALESCE(reviewer_id, $2),
         review_notes = COALESCE(review_notes, '') || $3,
         updated_at = now()
     WHERE id = $1
     RETURNING id, reference_number, status, decision_date`,
    [applicationId, staffId, notes ? `\n[${new Date().toISOString()}] REJECTED: ${notes}` : '']
  );

  // Audit log
  await query(
    `INSERT INTO ae_scholarships.audit_logs (user_id, application_id, action, details)
     VALUES ($1, $2, 'APPLICATION_REJECTED', $3)`,
    [staffId, applicationId, JSON.stringify({ reference_number: application.reference_number, reasons, notes })]
  );

  // Notification
  await query(
    `INSERT INTO ae_scholarships.notifications (user_id, application_id, type, title, message)
     VALUES ($1, $2, 'decision_available', 'Application Decision', $3)`,
    [application.applicant_id, applicationId,
     `A decision has been made on your application ${application.reference_number}. Please check your dashboard for details.`]
  );

  return result.rows[0];
}

// UC-STAFF-06: Rank Applications
export async function getRankedApplications(scholarshipId) {
  const result = await query(
    `SELECT a.id, a.reference_number, a.status, a.submitted_at,
            a.personal_info->>'first_name' as first_name,
            a.personal_info->>'last_name' as last_name,
            a.academic_marks,
            a.postsecondary_info->>'institution_name' as institution,
            a.postsecondary_info->>'program' as program,
            a.postsecondary_info->>'year_of_study' as year_of_study,
            s.name as scholarship_name
     FROM ae_scholarships.applications a
     JOIN ae_scholarships.scholarships s ON s.id = a.scholarship_id
     WHERE a.scholarship_id = $1 AND a.status NOT IN ('Draft', 'Withdrawn')
     ORDER BY a.submitted_at ASC`,
    [scholarshipId]
  );
  return result.rows;
}

// UC-STAFF-07: Assign Application
export async function assignApplication(applicationId, staffId, assigneeId) {
  const result = await query(
    `UPDATE ae_scholarships.applications
     SET reviewer_id = $2, status = CASE WHEN status = 'Submitted' THEN 'Under Review' ELSE status END, updated_at = now()
     WHERE id = $1
     RETURNING id, reference_number, reviewer_id, status`,
    [applicationId, assigneeId]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Application not found'), { status: 404 });

  await query(
    `INSERT INTO ae_scholarships.audit_logs (user_id, application_id, action, details)
     VALUES ($1, $2, 'APPLICATION_ASSIGNED', $3)`,
    [staffId, applicationId, JSON.stringify({ assigned_to: assigneeId })]
  );

  return result.rows[0];
}

// Bulk assign
export async function bulkAssign(applicationIds, staffId, assigneeId) {
  const results = [];
  for (const appId of applicationIds) {
    const r = await assignApplication(appId, staffId, assigneeId);
    results.push(r);
  }
  return results;
}

// UC-STAFF-08: Dashboard Stats
export async function getDashboardStats() {
  const stats = await query(`
    SELECT
      count(*) as total_applications,
      count(*) FILTER (WHERE status = 'Submitted') as submitted,
      count(*) FILTER (WHERE status = 'Under Review') as under_review,
      count(*) FILTER (WHERE status = 'Missing Info') as missing_info,
      count(*) FILTER (WHERE status = 'Approved') as approved,
      count(*) FILTER (WHERE status = 'Rejected') as rejected,
      count(*) FILTER (WHERE status = 'Pending Payment') as pending_payment,
      count(*) FILTER (WHERE status = 'Paid') as paid,
      count(*) FILTER (WHERE status = 'Withdrawn') as withdrawn,
      count(*) FILTER (WHERE status IN ('Submitted', 'Under Review')) as pending_review,
      ROUND(AVG(EXTRACT(DAY FROM COALESCE(decision_date, now()) - submitted_at)) FILTER (WHERE submitted_at IS NOT NULL), 1) as avg_turnaround_days
    FROM ae_scholarships.applications
    WHERE status != 'Draft'
  `);

  // Volume by scholarship (top 10)
  const byScholarship = await query(`
    SELECT s.name, count(*) as count
    FROM ae_scholarships.applications a
    JOIN ae_scholarships.scholarships s ON s.id = a.scholarship_id
    WHERE a.status != 'Draft'
    GROUP BY s.name
    ORDER BY count DESC
    LIMIT 10
  `);

  // Recent activity
  const recentActivity = await query(`
    SELECT al.action, al.details, al.created_at, u.display_name as staff_name
    FROM ae_scholarships.audit_logs al
    LEFT JOIN ae_scholarships.users u ON u.id = al.user_id
    ORDER BY al.created_at DESC
    LIMIT 20
  `);

  // Staff workload
  const staffWorkload = await query(`
    SELECT u.display_name, u.email, count(*) as assigned_count
    FROM ae_scholarships.applications a
    JOIN ae_scholarships.users u ON u.id = a.reviewer_id
    WHERE a.status IN ('Submitted', 'Under Review', 'Missing Info')
    GROUP BY u.id, u.display_name, u.email
    ORDER BY assigned_count DESC
  `);

  return {
    summary: stats.rows[0],
    byScholarship: byScholarship.rows,
    recentActivity: recentActivity.rows,
    staffWorkload: staffWorkload.rows
  };
}

// UC-STAFF-09: Reports
export async function generateReport({ startDate, endDate, scholarshipId, status } = {}) {
  let sql = `
    SELECT a.id, a.reference_number, a.status, a.submitted_at, a.decision_date, a.decision,
           a.personal_info->>'first_name' as first_name,
           a.personal_info->>'last_name' as last_name,
           s.name as scholarship_name, s.type as scholarship_type,
           s.value as scholarship_value,
           u.email as applicant_email,
           r.display_name as reviewer_name,
           EXTRACT(DAY FROM COALESCE(a.decision_date, now()) - a.submitted_at)::int as processing_days
    FROM ae_scholarships.applications a
    JOIN ae_scholarships.scholarships s ON s.id = a.scholarship_id
    JOIN ae_scholarships.users u ON u.id = a.applicant_id
    LEFT JOIN ae_scholarships.users r ON r.id = a.reviewer_id
    WHERE a.status != 'Draft'`;

  const values = [];
  let paramCount = 0;

  if (startDate) {
    paramCount++;
    sql += ` AND a.submitted_at >= $${paramCount}`;
    values.push(startDate);
  }
  if (endDate) {
    paramCount++;
    sql += ` AND a.submitted_at <= $${paramCount}`;
    values.push(endDate);
  }
  if (scholarshipId) {
    paramCount++;
    sql += ` AND a.scholarship_id = $${paramCount}`;
    values.push(scholarshipId);
  }
  if (status) {
    paramCount++;
    sql += ` AND a.status = $${paramCount}`;
    values.push(status);
  }

  sql += ` ORDER BY a.submitted_at DESC`;

  const result = await query(sql, values);

  // Compute summary metrics
  const rows = result.rows;
  const totalCount = rows.length;
  const approvedCount = rows.filter(r => r.status === 'Approved' || r.status === 'Paid').length;
  const rejectedCount = rows.filter(r => r.status === 'Rejected').length;
  const miCount = rows.filter(r => r.status === 'Missing Info').length;
  const processingDays = rows.filter(r => r.processing_days != null).map(r => r.processing_days);
  const avgTurnaround = processingDays.length > 0 ? (processingDays.reduce((a, b) => a + b, 0) / processingDays.length).toFixed(1) : 0;

  return {
    data: rows,
    metrics: {
      total: totalCount,
      approved: approvedCount,
      rejected: rejectedCount,
      missingInfo: miCount,
      approvalRate: totalCount > 0 ? ((approvedCount / totalCount) * 100).toFixed(1) : 0,
      miRate: totalCount > 0 ? ((miCount / totalCount) * 100).toFixed(1) : 0,
      avgTurnaround: parseFloat(avgTurnaround)
    }
  };
}

// Get staff members list (for assignment dropdown)
export async function getStaffMembers() {
  const result = await query(
    `SELECT id, display_name, email, role
     FROM ae_scholarships.users
     WHERE role IN ('scholarship_staff', 'scholarship_manager', 'admin', 'superadmin')
     ORDER BY display_name`
  );
  return result.rows;
}

// Get correspondence templates
export async function getCorrespondenceTemplates(type) {
  let sql = 'SELECT id, name, type, subject, body_template, variables FROM ae_scholarships.correspondence_templates WHERE active = true';
  const values = [];
  if (type) {
    sql += ' AND type = $1';
    values.push(type);
  }
  sql += ' ORDER BY name';
  const result = await query(sql, values);
  return result.rows;
}
