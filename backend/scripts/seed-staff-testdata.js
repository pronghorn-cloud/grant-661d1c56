import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.anwfztxxdxzpcdlynsmq:Rocambole50!@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function seed() {
  const client = await pool.connect();
  try {
    // Get a valid scholarship ID
    const schRes = await client.query(
      `SELECT id, name FROM ae_scholarships.scholarships WHERE type = 'online application' LIMIT 3`
    );
    if (schRes.rows.length === 0) {
      // Fallback: use any scholarship
      const fallback = await client.query(`SELECT id, name FROM ae_scholarships.scholarships LIMIT 3`);
      schRes.rows.push(...fallback.rows);
    }
    if (schRes.rows.length === 0) { console.log('No scholarships!'); return; }
    console.log('Using scholarships:', schRes.rows.map(s => s.name).join(', '));

    // Get staff user id
    const staffRes = await client.query(
      `SELECT id FROM ae_scholarships.users WHERE role = 'scholarship_staff' LIMIT 1`
    );
    const staffId = staffRes.rows[0]?.id;
    console.log('Staff ID:', staffId);

    const testApplicants = [
      { first: 'Alice', last: 'Johnson', email: 'alice@student.ca', program: 'Computer Science' },
      { first: 'Bob', last: 'Williams', email: 'bob@student.ca', program: 'Engineering' },
      { first: 'Carol', last: 'Brown', email: 'carol@student.ca', program: 'Nursing' },
      { first: 'David', last: 'Davis', email: 'dave@student.ca', program: 'Business' },
      { first: 'Eve', last: 'Wilson', email: 'eve@student.ca', program: 'Arts' },
      { first: 'Frank', last: 'Miller', email: 'frank@student.ca', program: 'Science' },
      { first: 'Grace', last: 'Taylor', email: 'grace@student.ca', program: 'Education' },
      { first: 'Hank', last: 'Anderson', email: 'hank@student.ca', program: 'Law' }
    ];

    const targetStatuses = ['Submitted', 'Submitted', 'Under Review', 'Under Review', 'Missing Info', 'Approved', 'Approved', 'Rejected'];
    const appIds = [];

    for (let i = 0; i < testApplicants.length; i++) {
      const app = testApplicants[i];
      const schIdx = i % schRes.rows.length;
      const scholarshipId = schRes.rows[schIdx].id;

      // Create user (upsert)
      const userRes = await client.query(
        `INSERT INTO ae_scholarships.users (email, display_name, first_name, last_name, role, profile_complete,
          phone, address_street, address_city, address_province, address_postal_code,
          citizenship_status, residency_status, date_of_birth, gender, oauth_provider)
         VALUES ($1, $2, $3, $4, 'applicant', true,
           $5, $6, 'Edmonton', 'AB', $7,
           'Canadian Citizen', true, $8, $9, 'microsoft')
         ON CONFLICT (email) DO UPDATE SET
           display_name = EXCLUDED.display_name, first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name, profile_complete = true
         RETURNING id`,
        [app.email, `${app.first} ${app.last}`, app.first, app.last,
         `780-555-${1000 + i}`, `${100 + i * 10} Test Street`, `T5J ${i}K${i}`,
         `200${i}-0${(i % 9) + 1}-15`, i % 2 === 0 ? 'female' : 'male']
      );
      const userId = userRes.rows[0].id;

      // Generate reference number
      const refNum = `AES-2026-${String(Math.random()).substring(2, 8).toUpperCase()}`;

      // Create application directly via SQL
      const appRes = await client.query(
        `INSERT INTO ae_scholarships.applications (
           applicant_id, scholarship_id, reference_number, status,
           personal_info, postsecondary_info, essay,
           citizenship_status, residency_status,
           declaration_signed, privacy_consent,
           submitted_at, created_at, updated_at
         ) VALUES (
           $1, $2, $3, 'Submitted',
           $4, $5, $6,
           'Canadian Citizen', true,
           true, true,
           now() - interval '${(8 - i) * 3} days', now() - interval '${(8 - i) * 4} days', now()
         ) RETURNING id`,
        [
          userId, scholarshipId, refNum,
          JSON.stringify({
            first_name: app.first, last_name: app.last, email: app.email,
            phone: `780-555-${1000 + i}`, date_of_birth: `200${i}-0${(i % 9) + 1}-15`,
            address_line1: `${100 + i * 10} Test Street`, city: 'Edmonton',
            province: 'AB', postal_code: `T5J ${i}K${i}`,
            citizenship_status: 'Canadian Citizen', residency_status: true, gender: i % 2 === 0 ? 'female' : 'male'
          }),
          JSON.stringify({
            institution_name: 'University of Alberta',
            program: app.program, enrollment_status: 'full_time',
            year_of_study: String((i % 4) + 1), expected_graduation: '2027-06'
          }),
          `I am passionate about ${app.program} and committed to making a positive contribution to Alberta through my studies and career.`
        ]
      );
      appIds.push({ id: appRes.rows[0].id, name: app.first, targetStatus: targetStatuses[i] });
      console.log(`Created: ${app.first} ${app.last} - ${refNum}`);
    }

    // Now update to target statuses
    console.log('\nSetting varied statuses...');
    for (const a of appIds) {
      switch (a.targetStatus) {
        case 'Submitted':
          console.log(`  ${a.name} -> Submitted`);
          break;

        case 'Under Review':
          await client.query(
            `UPDATE ae_scholarships.applications SET status = 'Under Review', reviewer_id = $2, updated_at = now() WHERE id = $1`,
            [a.id, staffId]
          );
          await client.query(
            `INSERT INTO ae_scholarships.audit_logs (user_id, application_id, action, details) VALUES ($1, $2, 'APPLICATION_ASSIGNED', $3)`,
            [staffId, a.id, JSON.stringify({ assigned_to: staffId })]
          );
          console.log(`  ${a.name} -> Under Review`);
          break;

        case 'Missing Info':
          await client.query(
            `UPDATE ae_scholarships.applications SET status = 'Missing Info', reviewer_id = $2, updated_at = now() WHERE id = $1`,
            [a.id, staffId]
          );
          await client.query(
            `INSERT INTO ae_scholarships.audit_logs (user_id, application_id, action, details) VALUES ($1, $2, 'MI_SENT', $3)`,
            [staffId, a.id, JSON.stringify({ reasons: ['Missing transcript'] })]
          );
          console.log(`  ${a.name} -> Missing Info`);
          break;

        case 'Approved':
          await client.query(
            `UPDATE ae_scholarships.applications SET status = 'Approved', decision = 'Approved', decision_date = now() - interval '1 day', reviewer_id = $2, updated_at = now() WHERE id = $1`,
            [a.id, staffId]
          );
          await client.query(
            `INSERT INTO ae_scholarships.audit_logs (user_id, application_id, action, details) VALUES ($1, $2, 'APPLICATION_APPROVED', $3)`,
            [staffId, a.id, JSON.stringify({ notes: 'Excellent record' })]
          );
          console.log(`  ${a.name} -> Approved`);
          break;

        case 'Rejected':
          await client.query(
            `UPDATE ae_scholarships.applications SET status = 'Rejected', decision = 'Rejected', decision_date = now() - interval '1 day', reviewer_id = $2, updated_at = now() WHERE id = $1`,
            [a.id, staffId]
          );
          await client.query(
            `INSERT INTO ae_scholarships.audit_logs (user_id, application_id, action, details) VALUES ($1, $2, 'APPLICATION_REJECTED', $3)`,
            [staffId, a.id, JSON.stringify({ reasons: ['GPA below threshold'] })]
          );
          console.log(`  ${a.name} -> Rejected`);
          break;
      }
    }

    // Verify final counts
    const counts = await client.query(`
      SELECT status, count(*) as cnt
      FROM ae_scholarships.applications
      WHERE status != 'Draft'
      GROUP BY status ORDER BY status
    `);
    console.log('\n=== Final Application Counts ===');
    counts.rows.forEach(r => console.log(`  ${r.status}: ${r.cnt}`));

    const total = await client.query(`SELECT count(*) FROM ae_scholarships.applications WHERE status != 'Draft'`);
    console.log(`  TOTAL: ${total.rows[0].count}`);

    console.log('\nDone! Refresh the staff pages to see updated data.');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(e => console.error(e));
