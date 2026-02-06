import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  const client = await pool.connect();

  try {
    console.log('Seeding Lookup Tables - AE Online Scholarships');
    console.log('='.repeat(72));

    await client.query('SET search_path TO ae_scholarships, public;');

    // Scholarship Types
    const scholarshipTypes = [
      ['form application', 'Form Application', 1],
      ['indirect', 'Indirect', 2],
      ['online application', 'Online Application', 3]
    ];
    for (const [code, label, order] of scholarshipTypes) {
      await client.query(
        `INSERT INTO scholarship_types (code, label, sort_order) VALUES ($1, $2, $3) ON CONFLICT (code) DO UPDATE SET label = $2, sort_order = $3`,
        [code, label, order]
      );
    }
    console.log(`  scholarship_types: ${scholarshipTypes.length} records`);

    // Scholarship Categories
    const categories = [
      ['Agriculture', 1], ['Technology', 2], ['Citizenship/Leadership', 3],
      ['Language', 4], ['Indigenous', 5], ['Science', 6],
      ['Arts', 7], ['Education', 8], ['General', 9]
    ];
    for (const [code, order] of categories) {
      await client.query(
        `INSERT INTO scholarship_categories (code, label, sort_order) VALUES ($1, $1, $2) ON CONFLICT (code) DO UPDATE SET sort_order = $2`,
        [code, order]
      );
    }
    console.log(`  scholarship_categories: ${categories.length} records`);

    // Application Statuses (from domain.js config)
    const statuses = [
      ['Draft', 'Draft', '#6c757d', 'edit', 1],
      ['Submitted', 'Submitted', '#0070c4', 'check-circle', 2],
      ['Under Review', 'Under Review', '#17a2b8', 'search', 3],
      ['Missing Info', 'Missing Info', '#ffc107', 'alert-triangle', 4],
      ['Approved', 'Approved', '#28a745', 'award', 5],
      ['Rejected', 'Rejected', '#dc3545', 'x-circle', 6],
      ['Pending Payment', 'Pending Payment', '#fd7e14', 'clock', 7],
      ['Paid', 'Paid', '#28a745', 'dollar-sign', 8],
      ['Withdrawn', 'Withdrawn', '#6c757d', 'minus-circle', 9]
    ];
    for (const [code, label, color, icon, order] of statuses) {
      await client.query(
        `INSERT INTO application_statuses (code, label, color, icon, sort_order) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (code) DO UPDATE SET label = $2, color = $3, icon = $4, sort_order = $5`,
        [code, label, color, icon, order]
      );
    }
    console.log(`  application_statuses: ${statuses.length} records`);

    // Citizenship Types
    const citizenshipTypes = [
      ['Canadian Citizen', 1], ['Permanent Resident', 2],
      ['Protected Person', 3], ['International (Visa)', 4]
    ];
    for (const [code, order] of citizenshipTypes) {
      await client.query(
        `INSERT INTO citizenship_types (code, label, sort_order) VALUES ($1, $1, $2) ON CONFLICT (code) DO UPDATE SET sort_order = $2`,
        [code, order]
      );
    }
    console.log(`  citizenship_types: ${citizenshipTypes.length} records`);

    // COR Statuses
    const corStatuses = [
      ['Not Required', 1], ['Pending', 2], ['Requested', 3],
      ['Confirmed', 4], ['Failed', 5]
    ];
    for (const [code, order] of corStatuses) {
      await client.query(
        `INSERT INTO cor_statuses (code, label, sort_order) VALUES ($1, $1, $2) ON CONFLICT (code) DO UPDATE SET sort_order = $2`,
        [code, order]
      );
    }
    console.log(`  cor_statuses: ${corStatuses.length} records`);

    // Document Types
    const docTypes = [
      ['transcript', 'Transcript', 1],
      ['nomination_letter', 'Nomination Letter', 2],
      ['essay', 'Essay', 3],
      ['reference', 'Reference Letter', 4],
      ['identification', 'Identification', 5],
      ['mprr', 'MPRR', 6],
      ['enrollment_verification', 'Enrollment Verification', 7],
      ['other', 'Other', 8]
    ];
    for (const [code, label, order] of docTypes) {
      await client.query(
        `INSERT INTO document_types (code, label, sort_order) VALUES ($1, $2, $3) ON CONFLICT (code) DO UPDATE SET label = $2, sort_order = $3`,
        [code, label, order]
      );
    }
    console.log(`  document_types: ${docTypes.length} records`);

    // Notification Types
    const notifTypes = [
      ['submitted', 'Application Submitted', 'submission_confirmation', 1],
      ['action_required', 'Action Required', 'missing_info_request', 2],
      ['decision_available', 'Decision Available', 'decision_notification', 3],
      ['mi_request', 'Missing Information', 'mi_letter', 4],
      ['payment_processed', 'Payment Processed', 'payment_confirmation', 5],
      ['cor_request', 'COR Request', 'cor_request_letter', 6],
      ['deadline_reminder', 'Deadline Reminder', 'deadline_reminder', 7]
    ];
    for (const [code, label, template, order] of notifTypes) {
      await client.query(
        `INSERT INTO notification_types (code, label, template, sort_order) VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO UPDATE SET label = $2, template = $3, sort_order = $4`,
        [code, label, template, order]
      );
    }
    console.log(`  notification_types: ${notifTypes.length} records`);

    // User Roles
    const roles = [
      ['applicant', 'Applicant', JSON.stringify(['apply', 'view_own', 'upload_documents']), 1],
      ['scholarship_staff', 'Scholarship Staff', JSON.stringify(['review', 'assign', 'generate_correspondence', 'view_queue']), 2],
      ['scholarship_manager', 'Scholarship Manager', JSON.stringify(['review', 'approve', 'reject', 'assign', 'generate_correspondence', 'view_queue', 'view_reports']), 3],
      ['admin', 'Administrator', JSON.stringify(['manage_users', 'manage_scholarships', 'view_reports', 'manage_templates', 'system_config']), 4],
      ['superadmin', 'Super Administrator', JSON.stringify(['all']), 5],
      ['finance', 'Finance Officer', JSON.stringify(['view_approved', 'process_payments', 'generate_batch', 'view_reports']), 6]
    ];
    for (const [code, label, permissions, order] of roles) {
      await client.query(
        `INSERT INTO user_roles (code, label, permissions, sort_order) VALUES ($1, $2, $3::jsonb, $4) ON CONFLICT (code) DO UPDATE SET label = $2, permissions = $3::jsonb, sort_order = $4`,
        [code, label, permissions, order]
      );
    }
    console.log(`  user_roles: ${roles.length} records`);

    // Correspondence Types
    const corrTypes = [
      ['approval', 'Approval Letter', 1],
      ['rejection', 'Rejection Letter', 2],
      ['missing_info', 'Missing Information Request', 3],
      ['cor_request', 'COR Request', 4],
      ['payment_confirmation', 'Payment Confirmation', 5]
    ];
    for (const [code, label, order] of corrTypes) {
      await client.query(
        `INSERT INTO correspondence_types (code, label, sort_order) VALUES ($1, $2, $3) ON CONFLICT (code) DO UPDATE SET label = $2, sort_order = $3`,
        [code, label, order]
      );
    }
    console.log(`  correspondence_types: ${corrTypes.length} records`);

    // Provinces
    const provinces = [
      ['AB', 'Alberta', 1], ['BC', 'British Columbia', 2],
      ['SK', 'Saskatchewan', 3], ['MB', 'Manitoba', 4],
      ['ON', 'Ontario', 5], ['QC', 'Quebec', 6],
      ['NB', 'New Brunswick', 7], ['NS', 'Nova Scotia', 8],
      ['PE', 'Prince Edward Island', 9], ['NL', 'Newfoundland and Labrador', 10],
      ['YT', 'Yukon', 11], ['NT', 'Northwest Territories', 12],
      ['NU', 'Nunavut', 13]
    ];
    for (const [code, label, order] of provinces) {
      await client.query(
        `INSERT INTO provinces (code, label, sort_order) VALUES ($1, $2, $3) ON CONFLICT (code) DO UPDATE SET label = $2, sort_order = $3`,
        [code, label, order]
      );
    }
    console.log(`  provinces: ${provinces.length} records`);

    // Seed correspondence templates
    console.log('\nSeeding correspondence templates...');

    const templates = [
      {
        name: 'Approval Letter',
        type: 'approval',
        subject: 'Scholarship Application Approved - {{scholarship_name}}',
        body: `Dear {{applicant_name}},

We are pleased to inform you that your application for the {{scholarship_name}} has been approved.

Award Amount: {{award_value}}
Academic Year: {{academic_year}}

{{#if direct_deposit}}
Your award will be deposited directly to the bank account on file.
{{else}}
A cheque will be mailed to your address on file.
{{/if}}

If you have any questions, please contact the Student Financial Assistance office.

Sincerely,
Student Financial Assistance
Alberta Advanced Education`,
        variables: JSON.stringify(['applicant_name', 'scholarship_name', 'award_value', 'academic_year', 'direct_deposit'])
      },
      {
        name: 'Rejection Letter',
        type: 'rejection',
        subject: 'Scholarship Application Update - {{scholarship_name}}',
        body: `Dear {{applicant_name}},

Thank you for your application to the {{scholarship_name}}.

After careful review, we regret to inform you that your application was not selected for an award at this time.

{{#if reason}}
Reason: {{reason}}
{{/if}}

We encourage you to apply for other available scholarships. Visit our website for more opportunities.

Sincerely,
Student Financial Assistance
Alberta Advanced Education`,
        variables: JSON.stringify(['applicant_name', 'scholarship_name', 'reason'])
      },
      {
        name: 'Missing Information Request',
        type: 'missing_info',
        subject: 'Action Required - Missing Information for {{scholarship_name}}',
        body: `Dear {{applicant_name}},

We have reviewed your application for the {{scholarship_name}} and require additional information to complete our assessment.

Missing Items:
{{missing_items}}

Please provide the requested information by {{deadline_date}}. You can update your application by logging into your account.

If you have any questions, please contact us.

Sincerely,
Student Financial Assistance
Alberta Advanced Education`,
        variables: JSON.stringify(['applicant_name', 'scholarship_name', 'missing_items', 'deadline_date'])
      },
      {
        name: 'COR Request',
        type: 'cor_request',
        subject: 'Confirmation of Registration Request - {{applicant_name}}',
        body: `Dear Registrar,

We are requesting Confirmation of Registration for the following student:

Student Name: {{applicant_name}}
Student ID: {{student_id}}
Institution: {{institution_name}}
Program: {{program_name}}
Academic Year: {{academic_year}}

Please confirm the student's registration status at your earliest convenience.

Sincerely,
Student Financial Assistance
Alberta Advanced Education`,
        variables: JSON.stringify(['applicant_name', 'student_id', 'institution_name', 'program_name', 'academic_year'])
      },
      {
        name: 'Payment Confirmation',
        type: 'payment_confirmation',
        subject: 'Payment Processed - {{scholarship_name}}',
        body: `Dear {{applicant_name}},

Your scholarship payment for the {{scholarship_name}} has been processed.

Amount: {{payment_amount}}
Method: {{payment_method}}
Date: {{payment_date}}

{{#if direct_deposit}}
The funds should appear in your bank account within 3-5 business days.
{{else}}
A cheque has been mailed to your address on file.
{{/if}}

Sincerely,
Student Financial Assistance
Alberta Advanced Education`,
        variables: JSON.stringify(['applicant_name', 'scholarship_name', 'payment_amount', 'payment_method', 'payment_date', 'direct_deposit'])
      }
    ];

    for (const tpl of templates) {
      await client.query(
        `INSERT INTO correspondence_templates (name, type, subject, body_template, variables)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         ON CONFLICT DO NOTHING`,
        [tpl.name, tpl.type, tpl.subject, tpl.body, tpl.variables]
      );
    }
    console.log(`  correspondence_templates: ${templates.length} records`);

    console.log('\n' + '='.repeat(72));
    console.log('Seed completed successfully!');

  } catch (error) {
    console.error('Seed error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
