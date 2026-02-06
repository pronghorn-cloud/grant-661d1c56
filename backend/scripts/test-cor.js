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
  if (!token) { console.log('Login failed'); return; }
  const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
  console.log('Staff login: OK\n');

  // Get a test application (prefer one without confirmed COR)
  const queueRes = await fetch(baseUrl + '/staff/queue', { headers });
  const queue = await queueRes.json();
  const testApp = queue.applications?.find(a => !a.cor_status || a.cor_status === 'Pending') || queue.applications?.[1];
  if (!testApp) { console.log('No applications found. Keys:', Object.keys(queue)); return; }
  console.log(`Test app: ${testApp.reference_number} (${testApp.id})`);

  // TEST 1: Check COR (SFS)
  console.log('\n=== TEST 1: POST /cor/check/:id ===');
  const checkRes = await fetch(baseUrl + '/cor/check/' + testApp.id, { method: 'POST', headers });
  const checkData = await checkRes.json();
  console.log('Status:', checkRes.status, '| Result:', JSON.stringify(checkData));

  // TEST 2: Send COR request
  console.log('\n=== TEST 2: POST /cor/request/:id ===');
  const sendRes = await fetch(baseUrl + '/cor/request/' + testApp.id, {
    method: 'POST', headers,
    body: JSON.stringify({ institution_email: 'registrar@ualberta.ca', custom_message: 'Please confirm enrollment for scholarship purposes.' })
  });
  const sendData = await sendRes.json();
  console.log('Status:', sendRes.status, '| Result:', JSON.stringify(sendData));
  const responseToken = sendData.responseToken;

  // TEST 3: Get COR status
  console.log('\n=== TEST 3: GET /cor/status/:id ===');
  const statusRes = await fetch(baseUrl + '/cor/status/' + testApp.id, { headers });
  const statusData = await statusRes.json();
  console.log('Status:', statusRes.status, '| COR Status:', statusData.cor_status, '| Requests:', statusData.requests?.length);

  // TEST 4: Get pending COR requests
  console.log('\n=== TEST 4: GET /cor/pending ===');
  const pendingRes = await fetch(baseUrl + '/cor/pending', { headers });
  const pendingData = await pendingRes.json();
  console.log('Status:', pendingRes.status, '| Total pending:', pendingData.total, '| Rows:', pendingData.data?.length);

  // TEST 5: Institution responds to COR (public endpoint)
  if (responseToken) {
    // First get the request info
    console.log('\n=== TEST 5a: GET /cor/respond/:token ===');
    const infoRes = await fetch(baseUrl + '/cor/respond/' + responseToken);
    const infoData = await infoRes.json();
    console.log('Status:', infoRes.status, '| Info:', JSON.stringify(infoData).substring(0, 150));

    console.log('\n=== TEST 5b: POST /cor/respond/:token ===');
    const respondRes = await fetch(baseUrl + '/cor/respond/' + responseToken, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Confirmed', confirmed_by: 'Registrar Office, UAlberta', notes: 'Student is enrolled full-time.' })
    });
    const respondData = await respondRes.json();
    console.log('Status:', respondRes.status, '| Result:', JSON.stringify(respondData));
  }

  // TEST 6: Get all COR requests
  console.log('\n=== TEST 6: GET /cor/all ===');
  const allRes = await fetch(baseUrl + '/cor/all', { headers });
  const allData = await allRes.json();
  console.log('Status:', allRes.status, '| Total:', allData.total, '| Rows:', allData.data?.length);

  // Verify final COR status
  console.log('\n=== VERIFY: Final COR Status ===');
  const finalRes = await fetch(baseUrl + '/cor/status/' + testApp.id, { headers });
  const finalData = await finalRes.json();
  console.log('Final COR Status:', finalData.cor_status, '| Confirmed Date:', finalData.cor_confirmed_date);

  console.log('\nAll COR tests completed!');
}

test().catch(e => console.error(e));
