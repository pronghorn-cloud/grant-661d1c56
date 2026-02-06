const baseUrl = 'http://localhost:3000/api';

async function test() {
  // Login using dev-login endpoint
  const loginRes = await fetch(baseUrl + '/auth/dev-login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'test@alberta.ca', role: 'applicant'})
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  console.log('Login:', token ? 'OK' : 'FAILED');
  console.log('User ID:', loginData.data?.user?.id);
  if (!token) { console.log(JSON.stringify(loginData)); return; }

  const headers = { 'Authorization': 'Bearer ' + token };

  // Test 1: Get all notifications
  console.log('\n=== TEST 1: GET /notifications ===');
  const res1 = await fetch(baseUrl + '/notifications', { headers });
  const data1 = await res1.json();
  console.log('Status:', res1.status);
  console.log('Count:', Array.isArray(data1) ? data1.length : 'N/A');
  if (Array.isArray(data1) && data1.length > 0) {
    console.log('First:', JSON.stringify(data1[0]));
  } else {
    console.log('Response:', JSON.stringify(data1).substring(0, 300));
  }

  // Test 2: Get unread count
  console.log('\n=== TEST 2: GET /notifications/unread-count ===');
  const res2 = await fetch(baseUrl + '/notifications/unread-count', { headers });
  const data2 = await res2.json();
  console.log('Status:', res2.status, '| Data:', JSON.stringify(data2));

  // If we have notifications, test mark as read
  if (Array.isArray(data1) && data1.length > 0) {
    console.log('\n=== TEST 3: PUT /notifications/:id/read ===');
    const res3 = await fetch(baseUrl + '/notifications/' + data1[0].id + '/read', { method: 'PUT', headers });
    const data3 = await res3.json();
    console.log('Status:', res3.status, '| Data:', JSON.stringify(data3));

    // Re-check unread count
    console.log('\n=== TEST 4: GET /notifications/unread-count (after mark one) ===');
    const res4 = await fetch(baseUrl + '/notifications/unread-count', { headers });
    const data4 = await res4.json();
    console.log('Status:', res4.status, '| Data:', JSON.stringify(data4));

    console.log('\n=== TEST 5: PUT /notifications/read-all ===');
    const res5 = await fetch(baseUrl + '/notifications/read-all', { method: 'PUT', headers });
    const data5 = await res5.json();
    console.log('Status:', res5.status, '| Data:', JSON.stringify(data5));
  }

  // Test with unread filter
  console.log('\n=== TEST 6: GET /notifications?unread=true ===');
  const res6 = await fetch(baseUrl + '/notifications?unread=true', { headers });
  const data6 = await res6.json();
  console.log('Status:', res6.status, '| Unread count:', Array.isArray(data6) ? data6.length : 'N/A');

  console.log('\nAll notification API tests completed!');
}
test().catch(e => console.error(e));
