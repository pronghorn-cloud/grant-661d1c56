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

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Database Migration - AE Online Scholarships');
    console.log('='.repeat(72));

    // Create schema
    await client.query('CREATE SCHEMA IF NOT EXISTS ae_scholarships;');
    console.log('Schema created: ae_scholarships\n');

    // Set search path
    await client.query('SET search_path TO ae_scholarships, public;');

    // ===================== LOOKUP TABLES =====================
    console.log('Creating lookup tables...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS ae_scholarships.scholarship_types (
        code VARCHAR(50) PRIMARY KEY,
        label VARCHAR(100) NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  scholarship_types');

    await client.query(`
      CREATE TABLE IF NOT EXISTS ae_scholarships.scholarship_categories (
        code VARCHAR(50) PRIMARY KEY,
        label VARCHAR(100) NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  scholarship_categories');

    await client.query(`
      CREATE TABLE IF NOT EXISTS ae_scholarships.application_statuses (
        code VARCHAR(30) PRIMARY KEY,
        label VARCHAR(100) NOT NULL,
        color VARCHAR(7),
        icon VARCHAR(30),
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  application_statuses');

    await client.query(`
      CREATE TABLE IF NOT EXISTS ae_scholarships.citizenship_types (
        code VARCHAR(50) PRIMARY KEY,
        label VARCHAR(100) NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  citizenship_types');

    await client.query(`
      CREATE TABLE IF NOT EXISTS ae_scholarships.cor_statuses (
        code VARCHAR(30) PRIMARY KEY,
        label VARCHAR(100) NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  cor_statuses');

    await client.query(`
      CREATE TABLE IF NOT EXISTS ae_scholarships.document_types (
        code VARCHAR(50) PRIMARY KEY,
        label VARCHAR(100) NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  document_types');

    await client.query(`
      CREATE TABLE IF NOT EXISTS ae_scholarships.notification_types (
        code VARCHAR(50) PRIMARY KEY,
        label VARCHAR(100) NOT NULL,
        template VARCHAR(100),
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  notification_types');

    await client.query(`
      CREATE TABLE IF NOT EXISTS ae_scholarships.user_roles (
        code VARCHAR(30) PRIMARY KEY,
        label VARCHAR(100) NOT NULL,
        permissions JSONB DEFAULT '[]',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  user_roles');

    await client.query(`
      CREATE TABLE IF NOT EXISTS ae_scholarships.correspondence_types (
        code VARCHAR(50) PRIMARY KEY,
        label VARCHAR(100) NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  correspondence_types');

    await client.query(`
      CREATE TABLE IF NOT EXISTS ae_scholarships.provinces (
        code VARCHAR(5) PRIMARY KEY,
        label VARCHAR(100) NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  provinces');

    // ===================== CORE TABLES =====================
    console.log('\nCreating core tables...');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ae_scholarships.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        aca_id VARCHAR(100),
        asn VARCHAR(20),
        sin_encrypted BYTEA,
        role VARCHAR(20) NOT NULL DEFAULT 'applicant' REFERENCES ae_scholarships.user_roles(code),
        oauth_provider VARCHAR(20) NOT NULL DEFAULT 'local',
        language_preference VARCHAR(5) DEFAULT 'en',
        is_blocked BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP
      );
    `);
    console.log('  users');

    // Scholarships table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ae_scholarships.scholarships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type VARCHAR(50) NOT NULL REFERENCES ae_scholarships.scholarship_types(code),
        value TEXT,
        deadline_start DATE,
        deadline_end DATE NOT NULL,
        payment_date VARCHAR(50),
        eligibility_criteria JSONB NOT NULL DEFAULT '{}',
        required_documents JSONB DEFAULT '[]',
        selection_process TEXT,
        max_awards INTEGER,
        category VARCHAR(50) REFERENCES ae_scholarships.scholarship_categories(code),
        source_url TEXT,
        status VARCHAR(20) DEFAULT 'Active',
        academic_year VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  scholarships');

    // Banking info table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ae_scholarships.banking_info (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES ae_scholarships.users(id) ON DELETE CASCADE,
        institution_number VARCHAR(3) NOT NULL,
        transit_number VARCHAR(5) NOT NULL,
        account_number VARCHAR(12) NOT NULL,
        authorization_signed BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  banking_info');

    // Applications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ae_scholarships.applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reference_number VARCHAR(20) UNIQUE NOT NULL,
        scholarship_id UUID NOT NULL REFERENCES ae_scholarships.scholarships(id),
        applicant_id UUID NOT NULL REFERENCES ae_scholarships.users(id),
        status VARCHAR(30) NOT NULL DEFAULT 'Draft' REFERENCES ae_scholarships.application_statuses(code),
        submitted_at TIMESTAMP,
        personal_info JSONB NOT NULL DEFAULT '{}',
        citizenship_status VARCHAR(30) NOT NULL REFERENCES ae_scholarships.citizenship_types(code),
        residency_status BOOLEAN NOT NULL DEFAULT false,
        indigenous_status VARCHAR(50),
        gender VARCHAR(10),
        postsecondary_info JSONB NOT NULL DEFAULT '{}',
        high_school_info JSONB,
        additional_info JSONB,
        essay TEXT,
        declaration_signed BOOLEAN NOT NULL DEFAULT false,
        privacy_consent BOOLEAN NOT NULL DEFAULT false,
        cor_status VARCHAR(20) REFERENCES ae_scholarships.cor_statuses(code),
        cor_confirmed_date TIMESTAMP,
        reviewer_id UUID REFERENCES ae_scholarships.users(id),
        review_notes TEXT,
        decision VARCHAR(20),
        decision_date TIMESTAMP,
        payment_method VARCHAR(20),
        bank_info_id UUID REFERENCES ae_scholarships.banking_info(id),
        academic_marks JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  applications');

    // Documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ae_scholarships.documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID NOT NULL REFERENCES ae_scholarships.applications(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        file_size INTEGER NOT NULL,
        storage_path TEXT NOT NULL,
        document_type VARCHAR(50) NOT NULL REFERENCES ae_scholarships.document_types(code),
        uploaded_at TIMESTAMP DEFAULT NOW(),
        verified BOOLEAN DEFAULT false
      );
    `);
    console.log('  documents');

    // Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ae_scholarships.notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES ae_scholarships.users(id) ON DELETE CASCADE,
        application_id UUID REFERENCES ae_scholarships.applications(id),
        type VARCHAR(50) NOT NULL REFERENCES ae_scholarships.notification_types(code),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT false,
        sent_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  notifications');

    // Audit logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ae_scholarships.audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES ae_scholarships.users(id),
        application_id UUID REFERENCES ae_scholarships.applications(id),
        action VARCHAR(50) NOT NULL,
        details JSONB,
        old_values JSONB,
        new_values JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  audit_logs');

    // Correspondence templates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ae_scholarships.correspondence_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        type VARCHAR(30) NOT NULL REFERENCES ae_scholarships.correspondence_types(code),
        subject TEXT NOT NULL,
        body_template TEXT NOT NULL,
        variables JSONB,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  correspondence_templates');

    // Import history (audit trail)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ae_scholarships.import_history (
        id SERIAL PRIMARY KEY,
        import_date TIMESTAMP DEFAULT NOW(),
        file_name TEXT NOT NULL,
        table_name TEXT NOT NULL,
        records_imported INTEGER,
        records_failed INTEGER,
        status VARCHAR(20),
        error_message TEXT,
        imported_by VARCHAR(100)
      );
    `);
    console.log('  import_history');

    // ===================== INDEXES =====================
    console.log('\nCreating indexes...');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON ae_scholarships.users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON ae_scholarships.users(role);
      CREATE INDEX IF NOT EXISTS idx_users_aca_id ON ae_scholarships.users(aca_id);

      CREATE INDEX IF NOT EXISTS idx_scholarships_type ON ae_scholarships.scholarships(type);
      CREATE INDEX IF NOT EXISTS idx_scholarships_category ON ae_scholarships.scholarships(category);
      CREATE INDEX IF NOT EXISTS idx_scholarships_status ON ae_scholarships.scholarships(status);
      CREATE INDEX IF NOT EXISTS idx_scholarships_deadline ON ae_scholarships.scholarships(deadline_end);
      CREATE INDEX IF NOT EXISTS idx_scholarships_year ON ae_scholarships.scholarships(academic_year);

      CREATE INDEX IF NOT EXISTS idx_applications_scholarship ON ae_scholarships.applications(scholarship_id);
      CREATE INDEX IF NOT EXISTS idx_applications_applicant ON ae_scholarships.applications(applicant_id);
      CREATE INDEX IF NOT EXISTS idx_applications_status ON ae_scholarships.applications(status);
      CREATE INDEX IF NOT EXISTS idx_applications_reviewer ON ae_scholarships.applications(reviewer_id);
      CREATE INDEX IF NOT EXISTS idx_applications_submitted ON ae_scholarships.applications(submitted_at);
      CREATE INDEX IF NOT EXISTS idx_applications_ref ON ae_scholarships.applications(reference_number);

      CREATE INDEX IF NOT EXISTS idx_documents_application ON ae_scholarships.documents(application_id);
      CREATE INDEX IF NOT EXISTS idx_documents_type ON ae_scholarships.documents(document_type);

      CREATE INDEX IF NOT EXISTS idx_notifications_user ON ae_scholarships.notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON ae_scholarships.notifications(read);

      CREATE INDEX IF NOT EXISTS idx_audit_user ON ae_scholarships.audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_application ON ae_scholarships.audit_logs(application_id);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON ae_scholarships.audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_created ON ae_scholarships.audit_logs(created_at);

      CREATE INDEX IF NOT EXISTS idx_banking_user ON ae_scholarships.banking_info(user_id);
    `);
    console.log('  All indexes created');

    console.log('\n' + '='.repeat(72));
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
