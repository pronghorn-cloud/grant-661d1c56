import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.anwfztxxdxzpcdlynsmq:Rocambole50!@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function seed() {
  const client = await pool.connect();
  try {
    // 1. Make sure scholarships have a value set
    console.log('Setting scholarship values...');
    await client.query(`
      UPDATE ae_scholarships.scholarships
      SET value = '2500.00'
      WHERE value IS NULL OR value = ''
    `);

    // 2. Find approved applications
    const approvedRes = await client.query(`
      SELECT a.id, a.applicant_id, a.reference_number, u.display_name
      FROM ae_scholarships.applications a
      JOIN ae_scholarships.users u ON u.id = a.applicant_id
      WHERE a.status = 'Approved'
    `);
    console.log(`Found ${approvedRes.rows.length} approved applications`);

    if (approvedRes.rows.length === 0) {
      console.log('No approved applications found. Creating some...');
      const toApprove = await client.query(`
        UPDATE ae_scholarships.applications
        SET status = 'Approved', updated_at = NOW()
        WHERE status IN ('Submitted', 'Under Review')
        AND id IN (
          SELECT id FROM ae_scholarships.applications
          WHERE status IN ('Submitted', 'Under Review')
          LIMIT 3
        )
        RETURNING id, applicant_id, reference_number
      `);
      console.log(`Approved ${toApprove.rows.length} applications`);
      approvedRes.rows.push(...toApprove.rows);
    }

    // 3. Add banking info for users with approved applications
    const userIds = [...new Set(approvedRes.rows.map(a => a.applicant_id))];
    console.log(`Adding banking info for ${userIds.length} users...`);

    const bankData = [
      { institution: '001', transit: '00012', account: '1234567' },
      { institution: '004', transit: '00045', account: '9876543' },
      { institution: '010', transit: '00078', account: '5551234' },
      { institution: '001', transit: '00012', account: '7778889' },
      { institution: '003', transit: '00033', account: '4445556' }
    ];

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const bank = bankData[i % bankData.length];

      // Check if banking info already exists
      const existing = await client.query(
        'SELECT id FROM ae_scholarships.banking_info WHERE user_id = $1',
        [userId]
      );

      if (existing.rows.length > 0) {
        console.log(`  User ${userId}: banking info already exists, updating...`);
        await client.query(`
          UPDATE ae_scholarships.banking_info
          SET institution_number = $1, transit_number = $2, account_number = $3,
              authorization_signed = true, updated_at = NOW()
          WHERE user_id = $4
        `, [bank.institution, bank.transit, bank.account, userId]);
      } else {
        console.log(`  User ${userId}: inserting banking info...`);
        await client.query(`
          INSERT INTO ae_scholarships.banking_info (user_id, institution_number, transit_number, account_number, authorization_signed)
          VALUES ($1, $2, $3, $4, true)
        `, [userId, bank.institution, bank.transit, bank.account]);
      }
    }

    // 4. Also add a duplicate bank account for testing duplicate detection
    // Find a user without an approved app to give them the same bank as user[0]
    const otherUser = await client.query(`
      SELECT id FROM ae_scholarships.users
      WHERE id NOT IN (${userIds.map((_, i) => '$' + (i + 1)).join(',')})
      LIMIT 1
    `, userIds);

    if (otherUser.rows.length > 0) {
      const dupUserId = otherUser.rows[0].id;
      const dupBank = bankData[0]; // Same as first user
      const existingDup = await client.query(
        'SELECT id FROM ae_scholarships.banking_info WHERE user_id = $1',
        [dupUserId]
      );
      if (existingDup.rows.length === 0) {
        await client.query(`
          INSERT INTO ae_scholarships.banking_info (user_id, institution_number, transit_number, account_number, authorization_signed)
          VALUES ($1, $2, $3, $4, true)
        `, [dupUserId, dupBank.institution, dupBank.transit, dupBank.account]);
        console.log(`  User ${dupUserId}: added DUPLICATE bank info for testing`);
      }
    }

    // 5. Verify eligible applications
    const eligibleRes = await client.query(`
      SELECT a.id, a.reference_number, u.display_name, b.institution_number, b.transit_number
      FROM ae_scholarships.applications a
      JOIN ae_scholarships.users u ON u.id = a.applicant_id
      LEFT JOIN ae_scholarships.banking_info b ON b.user_id = a.applicant_id
      WHERE a.status = 'Approved'
    `);
    console.log(`\nEligible for payment: ${eligibleRes.rows.length} applications`);
    eligibleRes.rows.forEach(r => {
      console.log(`  ${r.reference_number} - ${r.display_name} - Bank: ${r.institution_number || 'NONE'}-${r.transit_number || 'NONE'}`);
    });

    console.log('\nPayment test data seeded successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
