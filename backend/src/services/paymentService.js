import { query, getClient } from '../config/database.js';

// UC-PAY-01: Get applications eligible for payment
export async function getEligibleApplications() {
  const result = await query(`
    SELECT a.id, a.reference_number, a.status, a.applicant_id, a.scholarship_id,
           a.personal_info->>'first_name' as first_name,
           a.personal_info->>'last_name' as last_name,
           u.email, u.display_name,
           s.name as scholarship_name, s.value as scholarship_value,
           b.id as bank_info_id,
           b.institution_number, b.transit_number,
           '****' || RIGHT(b.account_number, 4) as account_masked,
           b.authorization_signed
    FROM ae_scholarships.applications a
    JOIN ae_scholarships.users u ON u.id = a.applicant_id
    JOIN ae_scholarships.scholarships s ON s.id = a.scholarship_id
    LEFT JOIN ae_scholarships.banking_info b ON b.user_id = a.applicant_id
    WHERE a.status = 'Approved'
    ORDER BY a.decision_date ASC
  `);

  return result.rows.map(r => ({
    ...r,
    has_banking: !!r.bank_info_id && !!r.authorization_signed,
    amount: parseFloat(r.scholarship_value) || 0
  }));
}

// UC-PAY-01: Generate payment batch
export async function generatePaymentBatch(applicationIds, userId) {
  if (!applicationIds?.length) {
    const err = new Error('No applications selected');
    err.status = 400;
    throw err;
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Verify all applications are eligible
    const appsResult = await client.query(`
      SELECT a.id, a.reference_number, a.applicant_id, a.status,
             a.personal_info->>'first_name' as first_name,
             a.personal_info->>'last_name' as last_name,
             u.email, u.display_name,
             s.name as scholarship_name, s.value as scholarship_value,
             b.institution_number, b.transit_number, b.account_number, b.authorization_signed
      FROM ae_scholarships.applications a
      JOIN ae_scholarships.users u ON u.id = a.applicant_id
      JOIN ae_scholarships.scholarships s ON s.id = a.scholarship_id
      LEFT JOIN ae_scholarships.banking_info b ON b.user_id = a.applicant_id
      WHERE a.id = ANY($1) AND a.status = 'Approved'
    `, [applicationIds]);

    if (appsResult.rows.length === 0) {
      throw Object.assign(new Error('No eligible applications found'), { status: 400 });
    }

    // Validate all have banking info
    const missingBanking = appsResult.rows.filter(a => !a.institution_number || !a.authorization_signed);
    if (missingBanking.length > 0) {
      throw Object.assign(new Error(`${missingBanking.length} application(s) missing banking info`), { status: 400 });
    }

    // Calculate total amount
    const totalAmount = appsResult.rows.reduce((sum, a) => sum + (parseFloat(a.scholarship_value) || 0), 0);

    // Generate batch number
    const now = new Date();
    const batchNumber = `PAY-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const fileName = `payment_batch_${batchNumber.replace(/[^A-Za-z0-9]/g, '_')}.1gx`;

    // Create batch record
    const batchResult = await client.query(`
      INSERT INTO ae_scholarships.payment_batches (batch_number, generated_by, application_count, total_amount, file_name)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [batchNumber, userId, appsResult.rows.length, totalAmount, fileName]);
    const batchId = batchResult.rows[0].id;

    // Create payment items and update application statuses
    for (const app of appsResult.rows) {
      const amount = parseFloat(app.scholarship_value) || 0;

      await client.query(`
        INSERT INTO ae_scholarships.payment_items (batch_id, application_id, applicant_id, amount,
          institution_number, transit_number, account_number)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [batchId, app.id, app.applicant_id, amount,
          app.institution_number, app.transit_number, app.account_number]);

      // Update application status to Pending Payment
      await client.query(
        `UPDATE ae_scholarships.applications SET status = 'Pending Payment', updated_at = now() WHERE id = $1`,
        [app.id]
      );

      // Create notification for applicant
      await client.query(`
        INSERT INTO ae_scholarships.notifications (user_id, application_id, type, title, message)
        VALUES ($1, $2, 'payment_processed', 'Payment Processing', $3)
      `, [app.applicant_id, app.id,
          `Your scholarship payment for ${app.scholarship_name} is being processed. Reference: ${app.reference_number}.`]);
    }

    // Audit log
    await client.query(`
      INSERT INTO ae_scholarships.audit_logs (user_id, action, details)
      VALUES ($1, 'PAYMENT_BATCH_GENERATED', $2)
    `, [userId, JSON.stringify({
      batch_id: batchId, batch_number: batchNumber,
      count: appsResult.rows.length, total_amount: totalAmount,
      applications: appsResult.rows.map(a => a.reference_number)
    })]);

    await client.query('COMMIT');

    // Generate 1GX file content
    const fileContent = generate1GXContent(appsResult.rows, batchNumber);

    return {
      batch_id: batchId,
      batch_number: batchNumber,
      file_name: fileName,
      application_count: appsResult.rows.length,
      total_amount: totalAmount,
      file_content: fileContent
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Generate 1GX (SAP) compatible file content
function generate1GXContent(applications, batchNumber) {
  const lines = [];
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

  // Header record
  lines.push(`H|${batchNumber}|${dateStr}|AESCHOLAR|${applications.length}|${applications.reduce((s, a) => s + (parseFloat(a.scholarship_value) || 0), 0).toFixed(2)}`);

  // Detail records
  for (const app of applications) {
    const amount = (parseFloat(app.scholarship_value) || 0).toFixed(2);
    lines.push([
      'D',
      app.reference_number,
      `${app.first_name} ${app.last_name}`,
      app.institution_number,
      app.transit_number,
      app.account_number,
      amount,
      dateStr,
      'SCHOLARSHIP'
    ].join('|'));
  }

  // Trailer record
  lines.push(`T|${applications.length}|${applications.reduce((s, a) => s + (parseFloat(a.scholarship_value) || 0), 0).toFixed(2)}`);

  return lines.join('\n');
}

// UC-PAY-01: Mark batch as paid (confirm payment)
export async function confirmBatchPayment(batchId, userId) {
  const batchResult = await query(
    `SELECT id, status FROM ae_scholarships.payment_batches WHERE id = $1`,
    [batchId]
  );
  if (!batchResult.rows[0]) {
    throw Object.assign(new Error('Batch not found'), { status: 404 });
  }
  if (batchResult.rows[0].status === 'Paid') {
    throw Object.assign(new Error('Batch already confirmed'), { status: 400 });
  }

  // Update batch status
  await query(
    `UPDATE ae_scholarships.payment_batches SET status = 'Paid', updated_at = now() WHERE id = $1`,
    [batchId]
  );

  // Update all payment items and applications
  const items = await query(
    `SELECT pi.application_id, pi.applicant_id, a.reference_number, s.name as scholarship_name
     FROM ae_scholarships.payment_items pi
     JOIN ae_scholarships.applications a ON a.id = pi.application_id
     JOIN ae_scholarships.scholarships s ON s.id = a.scholarship_id
     WHERE pi.batch_id = $1`,
    [batchId]
  );

  for (const item of items.rows) {
    await query(
      `UPDATE ae_scholarships.applications SET status = 'Paid', updated_at = now() WHERE id = $1`,
      [item.application_id]
    );
    await query(
      `UPDATE ae_scholarships.payment_items SET status = 'Paid' WHERE batch_id = $1 AND application_id = $2`,
      [batchId, item.application_id]
    );
    // Notify applicant
    await query(`
      INSERT INTO ae_scholarships.notifications (user_id, application_id, type, title, message)
      VALUES ($1, $2, 'payment_processed', 'Payment Complete', $3)
    `, [item.applicant_id, item.application_id,
        `Your scholarship payment for ${item.scholarship_name} has been deposited. Reference: ${item.reference_number}.`]).catch(() => {});
  }

  // Audit log
  await query(`
    INSERT INTO ae_scholarships.audit_logs (user_id, action, details)
    VALUES ($1, 'PAYMENT_BATCH_CONFIRMED', $2)
  `, [userId, JSON.stringify({ batch_id: batchId, count: items.rows.length })]).catch(() => {});

  return { message: 'Batch confirmed as paid', count: items.rows.length };
}

// Get all payment batches
export async function getPaymentBatches({ page = 1, limit = 25 } = {}) {
  const offset = (page - 1) * limit;
  const countRes = await query(`SELECT count(*) FROM ae_scholarships.payment_batches`);
  const result = await query(`
    SELECT pb.*, u.display_name as generated_by_name
    FROM ae_scholarships.payment_batches pb
    LEFT JOIN ae_scholarships.users u ON u.id = pb.generated_by
    ORDER BY pb.created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  return {
    data: result.rows,
    total: parseInt(countRes.rows[0].count),
    page, limit
  };
}

// Get batch details with items
export async function getBatchDetails(batchId) {
  const batchRes = await query(`
    SELECT pb.*, u.display_name as generated_by_name
    FROM ae_scholarships.payment_batches pb
    LEFT JOIN ae_scholarships.users u ON u.id = pb.generated_by
    WHERE pb.id = $1
  `, [batchId]);

  if (!batchRes.rows[0]) return null;

  const itemsRes = await query(`
    SELECT pi.*, a.reference_number, u.display_name as applicant_name, u.email as applicant_email,
           s.name as scholarship_name
    FROM ae_scholarships.payment_items pi
    JOIN ae_scholarships.applications a ON a.id = pi.application_id
    JOIN ae_scholarships.users u ON u.id = pi.applicant_id
    JOIN ae_scholarships.scholarships s ON s.id = a.scholarship_id
    WHERE pi.batch_id = $1
    ORDER BY u.display_name
  `, [batchId]);

  return { ...batchRes.rows[0], items: itemsRes.rows };
}

// UC-PAY-02: Get duplicate bank account flags
export async function getDuplicateBankAccounts() {
  const result = await query(`
    SELECT b1.user_id as user1_id, u1.display_name as user1_name, u1.email as user1_email,
           b2.user_id as user2_id, u2.display_name as user2_name, u2.email as user2_email,
           b1.institution_number, b1.transit_number,
           '****' || RIGHT(b1.account_number, 4) as account_masked,
           b1.created_at as user1_created, b2.created_at as user2_created
    FROM ae_scholarships.banking_info b1
    JOIN ae_scholarships.banking_info b2 ON
      b1.institution_number = b2.institution_number AND
      b1.transit_number = b2.transit_number AND
      b1.account_number = b2.account_number AND
      b1.user_id < b2.user_id
    JOIN ae_scholarships.users u1 ON u1.id = b1.user_id
    JOIN ae_scholarships.users u2 ON u2.id = b2.user_id
    ORDER BY b1.created_at DESC
  `);

  return result.rows;
}
