const baseUrl = 'http://localhost:3000/api';

async function test() {
  // Login as staff
  const loginRes = await fetch(baseUrl + '/auth/dev-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@gov.ab.ca', role: 'scholarship_staff' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  if (!token) { console.log('Login failed:', JSON.stringify(loginData)); return; }
  const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
  console.log('Staff login: OK\n');

  // ============================
  // TEST 1: GET /analytics/dashboard (as staff)
  // ============================
  console.log('=== TEST 1: GET /analytics/dashboard (staff) ===');
  const dashRes = await fetch(baseUrl + '/analytics/dashboard', { headers });
  const dashData = await dashRes.json();
  console.log('Status:', dashRes.status);

  if (dashData.kpis) {
    const d = dashData;
    console.log('\n--- KPIs ---');
    console.log('Total applications:', d.kpis?.total_applications);
    console.log('Approval rate:', d.kpis?.approval_rate + '%');
    console.log('MI rate:', d.kpis?.mi_rate + '%');
    console.log('Avg turnaround:', d.kpis?.avg_turnaround_days, 'days (target:', d.kpis?.target_turnaround_days + ')');
    console.log('Direct deposit rate:', d.kpis?.direct_deposit_rate + '%');
    console.log('Total paid apps:', d.kpis?.total_paid);

    console.log('\n--- Status Distribution ---');
    if (d.statusDistribution) {
      d.statusDistribution.forEach(s => console.log(`  ${s.status}: ${s.count} (${s.percentage}%)`));
    }

    console.log('\n--- Monthly Trends ---');
    if (d.monthlyTrends) {
      d.monthlyTrends.slice(0, 3).forEach(m =>
        console.log(`  ${m.month}: ${m.total} total, ${m.approved} approved, ${m.rejected} rejected`)
      );
      if (d.monthlyTrends.length > 3) console.log(`  ... and ${d.monthlyTrends.length - 3} more months`);
    }

    console.log('\n--- Top Scholarships ---');
    if (d.topScholarships) {
      d.topScholarships.forEach(s =>
        console.log(`  ${s.name}: ${s.total} apps (${s.approved} approved, ${s.rejected} rejected)`)
      );
    }

    console.log('\n--- Processing Times ---');
    if (d.processingTimes) {
      d.processingTimes.forEach(p => console.log(`  ${p.range}: ${p.count}`));
    }

    console.log('\n--- Payment Stats ---');
    if (d.paymentStats) {
      console.log('  Total batches:', d.paymentStats.total_batches);
      console.log('  Paid batches:', d.paymentStats.paid_batches);
      console.log('  Total disbursed: $' + d.paymentStats.total_disbursed);
    }
  } else {
    console.log('No data returned:', JSON.stringify(dashData));
  }

  // ============================
  // TEST 2: Applicant should NOT access analytics
  // ============================
  console.log('\n=== TEST 2: Applicant access denied ===');
  const appLoginRes = await fetch(baseUrl + '/auth/dev-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@test.com', role: 'applicant' })
  });
  const appLoginData = await appLoginRes.json();
  const appToken = appLoginData.data?.token;
  if (appToken) {
    const denyRes = await fetch(baseUrl + '/analytics/dashboard', {
      headers: { 'Authorization': 'Bearer ' + appToken }
    });
    console.log('Status:', denyRes.status, '(should be 403)');
  } else {
    console.log('Applicant login failed - skipping');
  }

  // ============================
  // TEST 3: Admin can also access analytics
  // ============================
  console.log('\n=== TEST 3: Admin access to analytics ===');
  const adminLoginRes = await fetch(baseUrl + '/auth/dev-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gov.ab.ca', role: 'admin' })
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.data?.token;
  if (adminToken) {
    const adminDashRes = await fetch(baseUrl + '/analytics/dashboard', {
      headers: { 'Authorization': 'Bearer ' + adminToken }
    });
    console.log('Status:', adminDashRes.status, '(should be 200)');
  }

  console.log('\nAll analytics tests completed!');
}

test().catch(e => console.error('Test error:', e));
