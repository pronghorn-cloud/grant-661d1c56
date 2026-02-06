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
  console.log('Staff login:', token ? 'OK' : 'FAILED');
  if (!token) { console.log(JSON.stringify(loginData)); return; }

  const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

  // Test 1: Work Queue
  console.log('\n=== TEST 1: GET /staff/queue ===');
  const res1 = await fetch(baseUrl + '/staff/queue', { headers });
  const data1 = await res1.json();
  console.log('Status:', res1.status);
  console.log('Total:', data1.total, '| Page:', data1.page, '| Apps:', data1.applications?.length);
  if (data1.applications?.length > 0) {
    console.log('First app:', data1.applications[0].reference_number, '|', data1.applications[0].status);
  }

  // Test 2: Dashboard Stats
  console.log('\n=== TEST 2: GET /staff/dashboard ===');
  const res2 = await fetch(baseUrl + '/staff/dashboard', { headers });
  const data2 = await res2.json();
  console.log('Status:', res2.status);
  console.log('Summary:', JSON.stringify(data2.summary));
  console.log('By Scholarship:', data2.byScholarship?.length, 'entries');

  // Test 3: Reports
  console.log('\n=== TEST 3: GET /staff/reports ===');
  const res3 = await fetch(baseUrl + '/staff/reports', { headers });
  const data3 = await res3.json();
  console.log('Status:', res3.status);
  console.log('Metrics:', JSON.stringify(data3.metrics));
  console.log('Data rows:', data3.data?.length);

  // Test 4: Staff Members
  console.log('\n=== TEST 4: GET /staff/members ===');
  const res4 = await fetch(baseUrl + '/staff/members', { headers });
  const data4 = await res4.json();
  console.log('Status:', res4.status, '| Members:', data4.length);
  data4.forEach(m => console.log('  -', m.display_name, '|', m.role));

  // Test 5: Review Application (if any exist)
  if (data1.applications?.length > 0) {
    const appId = data1.applications[0].id;
    console.log('\n=== TEST 5: GET /staff/applications/' + appId + ' ===');
    const res5 = await fetch(baseUrl + '/staff/applications/' + appId, { headers });
    const data5 = await res5.json();
    console.log('Status:', res5.status);
    console.log('Ref:', data5.reference_number, '| Eligibility:', JSON.stringify(data5.eligibility));
    console.log('Docs:', data5.documents?.length, '| History:', data5.history?.length);

    // Test 6: Add review note
    console.log('\n=== TEST 6: POST /staff/applications/:id/notes ===');
    const res6 = await fetch(baseUrl + '/staff/applications/' + appId + '/notes', {
      method: 'POST', headers,
      body: JSON.stringify({ notes: 'Test review note from API test' })
    });
    const data6 = await res6.json();
    console.log('Status:', res6.status, '| Result:', JSON.stringify(data6));
  }

  // Test 7: Templates
  console.log('\n=== TEST 7: GET /staff/templates ===');
  const res7 = await fetch(baseUrl + '/staff/templates', { headers });
  const data7 = await res7.json();
  console.log('Status:', res7.status, '| Templates:', data7.length);
  data7.forEach(t => console.log('  -', t.name, '|', t.type));

  console.log('\nAll staff API tests completed!');
}
test().catch(e => console.error(e));
