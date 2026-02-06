import { query, getClient } from '../config/database.js';
import crypto from 'crypto';

function generateReferenceNumber() {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `AES-${year}-${random}`;
}

export async function startApplication(applicantId, scholarshipId) {
  // Check scholarship exists and is active
  const schResult = await query(
    `SELECT id, name, type, deadline_end, status, academic_year
     FROM ae_scholarships.scholarships WHERE id = $1`,
    [scholarshipId]
  );
  if (!schResult.rows[0]) throw Object.assign(new Error('Scholarship not found'), { status: 404 });

  const scholarship = schResult.rows[0];

  // Check online application type
  if (scholarship.type !== 'online application') {
    throw Object.assign(new Error('This scholarship does not accept online applications'), { status: 400 });
  }

  // Check deadline
  if (scholarship.deadline_end && new Date(scholarship.deadline_end) < new Date()) {
    throw Object.assign(new Error('The application deadline has passed'), { status: 400 });
  }

  // Check for existing application
  const existing = await query(
    `SELECT id, status FROM ae_scholarships.applications
     WHERE applicant_id = $1 AND scholarship_id = $2 AND status NOT IN ('Withdrawn')`,
    [applicantId, scholarshipId]
  );
  if (existing.rows.length > 0) {
    const app = existing.rows[0];
    if (app.status === 'Draft') {
      return { existing: true, application: app };
    }
    throw Object.assign(new Error('You have already applied for this scholarship'), { status: 409 });
  }

  // Get applicant profile for pre-fill
  const profileResult = await query(
    `SELECT first_name, last_name, email, phone, date_of_birth,
            address_street, address_city, address_province, address_postal_code,
            citizenship_status, residency_status, indigenous_status, gender, asn
     FROM ae_scholarships.users WHERE id = $1`,
    [applicantId]
  );
  const profile = profileResult.rows[0];

  const personalInfo = {
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: profile.email,
    phone: profile.phone,
    date_of_birth: profile.date_of_birth,
    address_street: profile.address_street,
    address_city: profile.address_city,
    address_province: profile.address_province,
    address_postal_code: profile.address_postal_code
  };

  const result = await query(
    `INSERT INTO ae_scholarships.applications
     (reference_number, scholarship_id, applicant_id, status,
      personal_info, citizenship_status, residency_status,
      indigenous_status, gender, postsecondary_info,
      declaration_signed, privacy_consent)
     VALUES ($1, $2, $3, 'Draft', $4, $5, $6, $7, $8, '{}', false, false)
     RETURNING *`,
    [generateReferenceNumber(), scholarshipId, applicantId,
     JSON.stringify(personalInfo),
     profile.citizenship_status, profile.residency_status,
     profile.indigenous_status || null, profile.gender || null]
  );

  const app = result.rows[0];

  // Add scholarship name to response
  app.scholarship_name = scholarship.name;

  return { existing: false, application: app };
}

export async function getMyApplications(applicantId) {
  const result = await query(
    `SELECT a.id, a.reference_number, a.scholarship_id, a.status, a.submitted_at, a.created_at, a.updated_at,
            s.name as scholarship_name, s.type as scholarship_type,
            s.deadline_end, s.value as scholarship_value
     FROM ae_scholarships.applications a
     JOIN ae_scholarships.scholarships s ON s.id = a.scholarship_id
     WHERE a.applicant_id = $1
     ORDER BY a.created_at DESC`,
    [applicantId]
  );
  return result.rows;
}

export async function getApplicationById(applicationId, userId) {
  const result = await query(
    `SELECT a.*, s.name as scholarship_name, s.type as scholarship_type,
            s.deadline_end, s.value as scholarship_value, s.academic_year,
            s.eligibility_criteria, s.selection_process
     FROM ae_scholarships.applications a
     JOIN ae_scholarships.scholarships s ON s.id = a.scholarship_id
     WHERE a.id = $1`,
    [applicationId]
  );

  if (!result.rows[0]) return null;

  const app = result.rows[0];
  // Only the applicant or staff can see the application
  if (app.applicant_id !== userId) {
    // Check if user is staff
    const userResult = await query('SELECT role FROM ae_scholarships.users WHERE id = $1', [userId]);
    const staffRoles = ['scholarship_staff', 'scholarship_manager', 'admin', 'superadmin'];
    if (!staffRoles.includes(userResult.rows[0]?.role)) {
      return null;
    }
  }

  // Get documents
  const docs = await query(
    `SELECT id, file_name, file_type, file_size, document_type, uploaded_at, verified
     FROM ae_scholarships.documents WHERE application_id = $1 ORDER BY uploaded_at`,
    [applicationId]
  );
  app.documents = docs.rows;

  return app;
}

export async function saveDraft(applicationId, applicantId, data) {
  // Verify ownership and draft status
  const check = await query(
    `SELECT id, status FROM ae_scholarships.applications
     WHERE id = $1 AND applicant_id = $2`,
    [applicationId, applicantId]
  );
  if (!check.rows[0]) throw Object.assign(new Error('Application not found'), { status: 404 });
  if (check.rows[0].status !== 'Draft') {
    throw Object.assign(new Error('Can only edit draft applications'), { status: 400 });
  }

  const updates = [];
  const values = [applicationId];
  let paramCount = 1;

  const jsonFields = ['personal_info', 'postsecondary_info', 'high_school_info', 'additional_info', 'academic_marks'];
  const textFields = ['essay', 'citizenship_status', 'indigenous_status', 'gender'];
  const boolFields = ['residency_status', 'declaration_signed', 'privacy_consent'];

  for (const field of jsonFields) {
    if (data[field] !== undefined) {
      paramCount++;
      updates.push(`${field} = $${paramCount}`);
      values.push(JSON.stringify(data[field]));
    }
  }

  for (const field of textFields) {
    if (data[field] !== undefined) {
      paramCount++;
      updates.push(`${field} = $${paramCount}`);
      values.push(data[field]);
    }
  }

  for (const field of boolFields) {
    if (data[field] !== undefined) {
      paramCount++;
      updates.push(`${field} = $${paramCount}`);
      values.push(data[field]);
    }
  }

  if (updates.length === 0) return check.rows[0];

  updates.push('updated_at = now()');

  const result = await query(
    `UPDATE ae_scholarships.applications SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );

  return result.rows[0];
}

export async function submitApplication(applicationId, applicantId) {
  const app = await getApplicationById(applicationId, applicantId);
  if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
  if (app.applicant_id !== applicantId) throw Object.assign(new Error('Unauthorized'), { status: 403 });
  if (app.status !== 'Draft') throw Object.assign(new Error('Can only submit draft applications'), { status: 400 });

  // Validate completeness
  const errors = [];
  const pi = app.personal_info || {};
  if (!pi.first_name || !pi.last_name) errors.push('Personal information is incomplete');
  if (!app.citizenship_status) errors.push('Citizenship status is required');

  const psi = app.postsecondary_info || {};
  if (!psi.institution_name) errors.push('Post-secondary institution is required');

  if (!app.declaration_signed) errors.push('Declaration must be signed');
  if (!app.privacy_consent) errors.push('Privacy consent is required');

  if (errors.length > 0) {
    throw Object.assign(new Error('Application is incomplete'), { status: 400, errors });
  }

  const result = await query(
    `UPDATE ae_scholarships.applications
     SET status = 'Submitted', submitted_at = now(), updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [applicationId]
  );

  // Create notification (non-blocking)
  query(
    `INSERT INTO ae_scholarships.notifications (user_id, application_id, type, title, message)
     VALUES ($1, $2, 'submitted', 'Application Submitted', $3)`,
    [applicantId, applicationId, `Your application ${app.reference_number} for ${app.scholarship_name} has been submitted successfully.`]
  ).catch(() => {});

  // Log audit (non-blocking)
  query(
    `INSERT INTO ae_scholarships.audit_logs (user_id, action, entity_type, entity_id, details)
     VALUES ($1, 'APPLICATION_SUBMITTED', 'application', $2, $3)`,
    [applicantId, applicationId, JSON.stringify({ reference_number: app.reference_number, scholarship: app.scholarship_name })]
  ).catch(() => {});

  return result.rows[0];
}

export async function withdrawApplication(applicationId, applicantId) {
  const check = await query(
    `SELECT id, status, reference_number FROM ae_scholarships.applications
     WHERE id = $1 AND applicant_id = $2`,
    [applicationId, applicantId]
  );
  if (!check.rows[0]) throw Object.assign(new Error('Application not found'), { status: 404 });

  const allowedStatuses = ['Draft', 'Submitted', 'Under Review', 'Missing Info'];
  if (!allowedStatuses.includes(check.rows[0].status)) {
    throw Object.assign(new Error('Cannot withdraw application in current status'), { status: 400 });
  }

  const result = await query(
    `UPDATE ae_scholarships.applications
     SET status = 'Withdrawn', updated_at = now()
     WHERE id = $1
     RETURNING id, reference_number, status`,
    [applicationId]
  );

  // Log audit (non-blocking)
  query(
    `INSERT INTO ae_scholarships.audit_logs (user_id, action, entity_type, entity_id, details)
     VALUES ($1, 'APPLICATION_WITHDRAWN', 'application', $2, $3)`,
    [applicantId, applicationId, JSON.stringify({ reference_number: check.rows[0].reference_number })]
  ).catch(() => {});

  return result.rows[0];
}

export async function respondToMissingInfo(applicationId, applicantId) {
  const check = await query(
    `SELECT id, status FROM ae_scholarships.applications
     WHERE id = $1 AND applicant_id = $2`,
    [applicationId, applicantId]
  );
  if (!check.rows[0]) throw Object.assign(new Error('Application not found'), { status: 404 });
  if (check.rows[0].status !== 'Missing Info') {
    throw Object.assign(new Error('Application is not in Missing Info status'), { status: 400 });
  }

  const result = await query(
    `UPDATE ae_scholarships.applications
     SET status = 'Submitted', updated_at = now()
     WHERE id = $1
     RETURNING id, reference_number, status`,
    [applicationId]
  );

  return result.rows[0];
}

// Document management
export async function addDocument(applicationId, applicantId, fileInfo) {
  // Verify ownership
  const check = await query(
    `SELECT id, status FROM ae_scholarships.applications
     WHERE id = $1 AND applicant_id = $2`,
    [applicationId, applicantId]
  );
  if (!check.rows[0]) throw Object.assign(new Error('Application not found'), { status: 404 });

  const editableStatuses = ['Draft', 'Missing Info'];
  if (!editableStatuses.includes(check.rows[0].status)) {
    throw Object.assign(new Error('Cannot add documents in current status'), { status: 400 });
  }

  const result = await query(
    `INSERT INTO ae_scholarships.documents
     (application_id, file_name, file_type, file_size, storage_path, document_type)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, file_name, file_type, file_size, document_type, uploaded_at`,
    [applicationId, fileInfo.originalname, fileInfo.mimetype, fileInfo.size,
     fileInfo.path, fileInfo.documentType || 'other']
  );

  return result.rows[0];
}

export async function removeDocument(documentId, applicantId) {
  const result = await query(
    `DELETE FROM ae_scholarships.documents d
     USING ae_scholarships.applications a
     WHERE d.id = $1 AND d.application_id = a.id AND a.applicant_id = $2
     AND a.status IN ('Draft', 'Missing Info')
     RETURNING d.id, d.storage_path`,
    [documentId, applicantId]
  );

  if (!result.rows[0]) throw Object.assign(new Error('Document not found or cannot be deleted'), { status: 404 });
  return result.rows[0];
}
