import { query } from '../config/database.js';

// Main analytics dashboard data
export async function getAnalyticsDashboard() {
  const [
    statusDist,
    kpis,
    monthlyTrends,
    topScholarships,
    processingTimes,
    paymentStats
  ] = await Promise.all([
    getStatusDistribution(),
    getKPIs(),
    getMonthlyTrends(),
    getTopScholarships(),
    getProcessingTimes(),
    getPaymentStats()
  ]);

  return {
    statusDistribution: statusDist,
    kpis,
    monthlyTrends,
    topScholarships,
    processingTimes,
    paymentStats
  };
}

// Status distribution for donut chart
async function getStatusDistribution() {
  const result = await query(`
    SELECT status, count(*) as count
    FROM ae_scholarships.applications
    GROUP BY status
    ORDER BY count DESC
  `);
  const total = result.rows.reduce((sum, r) => sum + parseInt(r.count), 0);
  return result.rows.map(r => ({
    status: r.status,
    count: parseInt(r.count),
    percentage: total > 0 ? Math.round((parseInt(r.count) / total) * 100) : 0
  }));
}

// Key Performance Indicators
async function getKPIs() {
  const [totalRes, approvedRes, rejectedRes, miRes, paidRes, ddRes, avgTurnRes] = await Promise.all([
    query('SELECT count(*) FROM ae_scholarships.applications WHERE status != \'Draft\''),
    query('SELECT count(*) FROM ae_scholarships.applications WHERE status IN (\'Approved\', \'Paid\', \'Pending Payment\')'),
    query('SELECT count(*) FROM ae_scholarships.applications WHERE status = \'Rejected\''),
    query('SELECT count(*) FROM ae_scholarships.applications WHERE status = \'Missing Info\''),
    query('SELECT count(*) FROM ae_scholarships.applications WHERE status = \'Paid\''),
    query(`SELECT count(*) FROM ae_scholarships.banking_info WHERE authorization_signed = true`),
    query(`
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (decision_date - submitted_at)) / 86400), 1) as avg_days
      FROM ae_scholarships.applications
      WHERE decision_date IS NOT NULL AND submitted_at IS NOT NULL
    `)
  ]);

  const total = parseInt(totalRes.rows[0].count);
  const approved = parseInt(approvedRes.rows[0].count);
  const rejected = parseInt(rejectedRes.rows[0].count);
  const mi = parseInt(miRes.rows[0].count);
  const paid = parseInt(paidRes.rows[0].count);
  const dd = parseInt(ddRes.rows[0].count);
  const avgTurnaround = parseFloat(avgTurnRes.rows[0].avg_days) || 0;

  const decided = approved + rejected;

  return {
    total_applications: total,
    approval_rate: decided > 0 ? Math.round((approved / decided) * 100) : 0,
    mi_rate: total > 0 ? Math.round((mi / total) * 100) : 0,
    payment_completion_rate: approved > 0 ? Math.round((paid / approved) * 100) : 0,
    direct_deposit_rate: total > 0 ? Math.round((dd / Math.max(total, 1)) * 100) : 0,
    avg_turnaround_days: avgTurnaround,
    target_turnaround_days: 30,
    total_paid: paid,
    total_approved: approved,
    total_rejected: rejected,
    total_mi: mi
  };
}

// Monthly application trends
async function getMonthlyTrends() {
  const result = await query(`
    SELECT
      TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
      count(*) as total,
      count(*) FILTER (WHERE status IN ('Approved', 'Paid', 'Pending Payment')) as approved,
      count(*) FILTER (WHERE status = 'Rejected') as rejected,
      count(*) FILTER (WHERE status = 'Missing Info') as missing_info
    FROM ae_scholarships.applications
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month
  `);

  return result.rows.map(r => ({
    month: r.month,
    total: parseInt(r.total),
    approved: parseInt(r.approved),
    rejected: parseInt(r.rejected),
    missing_info: parseInt(r.missing_info)
  }));
}

// Top scholarships by application volume
async function getTopScholarships() {
  const result = await query(`
    SELECT s.name, s.code, count(a.id) as application_count,
           count(a.id) FILTER (WHERE a.status IN ('Approved', 'Paid', 'Pending Payment')) as approved_count,
           count(a.id) FILTER (WHERE a.status = 'Rejected') as rejected_count
    FROM ae_scholarships.scholarships s
    LEFT JOIN ae_scholarships.applications a ON a.scholarship_id = s.id
    GROUP BY s.id, s.name, s.code
    HAVING count(a.id) > 0
    ORDER BY count(a.id) DESC
    LIMIT 10
  `);

  return result.rows.map(r => ({
    name: r.name,
    code: r.code,
    total: parseInt(r.application_count),
    approved: parseInt(r.approved_count),
    rejected: parseInt(r.rejected_count)
  }));
}

// Processing time analysis
async function getProcessingTimes() {
  const result = await query(`
    SELECT time_range, count FROM (
      SELECT
        CASE
          WHEN days <= 7 THEN '0-7 days'
          WHEN days <= 14 THEN '8-14 days'
          WHEN days <= 30 THEN '15-30 days'
          ELSE '30+ days'
        END as time_range,
        CASE
          WHEN days <= 7 THEN 1
          WHEN days <= 14 THEN 2
          WHEN days <= 30 THEN 3
          ELSE 4
        END as sort_order,
        count(*) as count
      FROM (
        SELECT EXTRACT(EPOCH FROM (decision_date - submitted_at)) / 86400 as days
        FROM ae_scholarships.applications
        WHERE decision_date IS NOT NULL AND submitted_at IS NOT NULL
      ) sub
      GROUP BY time_range, sort_order
      ORDER BY sort_order
    ) result
  `);

  return result.rows.map(r => ({
    range: r.time_range,
    count: parseInt(r.count)
  }));
}

// Payment statistics
async function getPaymentStats() {
  const [batchesRes, totalPaidRes] = await Promise.all([
    query('SELECT count(*) as total, count(*) FILTER (WHERE status = \'Paid\') as paid FROM ae_scholarships.payment_batches'),
    query('SELECT COALESCE(SUM(total_amount), 0) as total_amount FROM ae_scholarships.payment_batches WHERE status = \'Paid\'')
  ]);

  return {
    total_batches: parseInt(batchesRes.rows[0].total),
    paid_batches: parseInt(batchesRes.rows[0].paid),
    total_disbursed: parseFloat(totalPaidRes.rows[0].total_amount)
  };
}
