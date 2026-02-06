import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Adding profile columns to users table...');

    // Add profile fields
    const columns = [
      { name: 'first_name', type: 'VARCHAR(100)' },
      { name: 'last_name', type: 'VARCHAR(100)' },
      { name: 'date_of_birth', type: 'DATE' },
      { name: 'phone', type: 'VARCHAR(20)' },
      { name: 'address_street', type: 'TEXT' },
      { name: 'address_city', type: 'VARCHAR(100)' },
      { name: 'address_province', type: 'VARCHAR(2)' },
      { name: 'address_postal_code', type: 'VARCHAR(7)' },
      { name: 'citizenship_status', type: 'VARCHAR(50)' },
      { name: 'residency_status', type: 'BOOLEAN' },
      { name: 'indigenous_status', type: 'VARCHAR(50)' },
      { name: 'gender', type: 'VARCHAR(30)' },
      { name: 'profile_complete', type: 'BOOLEAN DEFAULT false' }
    ];

    for (const col of columns) {
      try {
        await client.query(`ALTER TABLE ae_scholarships.users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
        console.log(`  + ${col.name} (${col.type})`);
      } catch (e) {
        console.log(`  ~ ${col.name} already exists or error: ${e.message}`);
      }
    }

    // Add updated_at column to banking_info
    try {
      await client.query('ALTER TABLE ae_scholarships.banking_info ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now()');
      console.log('  + banking_info.updated_at');
    } catch (e) {
      console.log('  ~ banking_info.updated_at:', e.message);
    }

    await client.query('COMMIT');
    console.log('\nProfile migration complete!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
