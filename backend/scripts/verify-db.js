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

async function verify() {
  const client = await pool.connect();

  try {
    console.log('Database Verification - AE Online Scholarships');
    console.log('='.repeat(72));

    await client.query('SET search_path TO ae_scholarships, public;');

    // Check all tables and counts
    const tables = [
      'scholarship_types', 'scholarship_categories', 'application_statuses',
      'citizenship_types', 'cor_statuses', 'document_types',
      'notification_types', 'user_roles', 'correspondence_types', 'provinces',
      'users', 'scholarships', 'banking_info', 'applications',
      'documents', 'notifications', 'audit_logs',
      'correspondence_templates', 'import_history'
    ];

    console.log('\nTable Record Counts:');
    console.log('-'.repeat(50));

    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        const count = result.rows[0].count;
        const status = parseInt(count) > 0 ? 'OK' : '--';
        console.log(`  ${table.padEnd(30)} ${String(count).padStart(5)}  ${status}`);
      } catch (err) {
        console.log(`  ${table.padEnd(30)}  ERROR: ${err.message}`);
      }
    }

    // Check import history
    console.log('\nImport History:');
    console.log('-'.repeat(50));
    const history = await client.query('SELECT * FROM import_history ORDER BY import_date DESC LIMIT 5');
    for (const row of history.rows) {
      console.log(`  ${row.file_name} -> ${row.table_name}: ${row.records_imported} imported, ${row.records_failed} failed (${row.status})`);
    }

    // Check scholarship type distribution
    console.log('\nScholarships by Type:');
    console.log('-'.repeat(50));
    const byType = await client.query('SELECT type, COUNT(*) FROM scholarships GROUP BY type ORDER BY count DESC');
    for (const row of byType.rows) {
      console.log(`  ${row.type.padEnd(25)} ${row.count}`);
    }

    // Check scholarship category distribution
    console.log('\nScholarships by Category:');
    console.log('-'.repeat(50));
    const byCat = await client.query('SELECT category, COUNT(*) FROM scholarships GROUP BY category ORDER BY count DESC');
    for (const row of byCat.rows) {
      console.log(`  ${(row.category || 'Uncategorized').padEnd(25)} ${row.count}`);
    }

    console.log('\n' + '='.repeat(72));
    console.log('Verification complete!');

  } catch (error) {
    console.error('Verification error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verify();
