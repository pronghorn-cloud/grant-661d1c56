const baseUrl = 'http://localhost:3000/api';

async function test() {
  // Login as finance staff
  const loginRes = await fetch(baseUrl + '/auth/dev-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'finance@gov.ab.ca', role: 'finance' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  if (!token) { console.log('Login failed:', JSON.stringify(loginData)); return; }
  const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
  console.log('Finance staff login: OK\n');

  // TEST 1: Get eligible applications
  console.log('=== TEST 1: GET /payments/eligible ===');
  const eligibleRes = await fetch(baseUrl + '/payments/eligible', { headers });
  const eligibleData = await eligibleRes.json();
  console.log('Status:', eligibleRes.status);
  if (Array.isArray(eligibleData)) {
    console.log('Eligible count:', eligibleData.length);
    eligibleData.forEach(a => {
      console.log(`  ${a.reference_number} - ${a.display_name} - $${a.amount} - Banking: ${a.has_banking}`);
    });
  } else {
    console.log('Response:', JSON.stringify(eligibleData).substring(0, 200));
  }

  // TEST 2: Check duplicates
  console.log('\n=== TEST 2: GET /payments/duplicates ===');
  const dupRes = await fetch(baseUrl + '/payments/duplicates', { headers });
  const dupData = await dupRes.json();
  console.log('Status:', dupRes.status);
  if (Array.isArray(dupData)) {
    console.log('Duplicates found:', dupData.length);
    dupData.forEach(d => console.log(`  ${d.user1_name} <-> ${d.user2_name} : ${d.institution_number}-${d.transit_number} ${d.account_masked}`));
  } else {
    console.log('Response:', JSON.stringify(dupData).substring(0, 200));
  }

  // TEST 3: Generate payment batch (select apps with banking)
  console.log('\n=== TEST 3: POST /payments/batch ===');
  const eligibleWithBanking = (Array.isArray(eligibleData) ? eligibleData : []).filter(a => a.has_banking);
  if (eligibleWithBanking.length === 0) {
    console.log('SKIP: No eligible apps with banking info');
  } else {
    const selectedIds = eligibleWithBanking.map(a => a.id);
    console.log('Generating batch for', selectedIds.length, 'applications...');
    const batchRes = await fetch(baseUrl + '/payments/batch', {
      method: 'POST', headers,
      body: JSON.stringify({ application_ids: selectedIds })
    });
    const batchData = await batchRes.json();
    console.log('Status:', batchRes.status);
    console.log('Batch:', JSON.stringify(batchData, null, 2).substring(0, 500));

    // TEST 4: Get batches list
    console.log('\n=== TEST 4: GET /payments/batches ===');
    const batchesRes = await fetch(baseUrl + '/payments/batches', { headers });
    const batchesData = await batchesRes.json();
    console.log('Status:', batchesRes.status);
    console.log('Total batches:', batchesData.total || batchesData.data?.length || 'N/A');
    if (batchesData.data) {
      batchesData.data.forEach(b => console.log(`  ${b.batch_number} - ${b.application_count} apps - $${b.total_amount} - ${b.status}`));
    }

    // TEST 5: Get batch details
    const batchId = batchData.batch_id;
    if (batchId) {
      console.log('\n=== TEST 5: GET /payments/batches/:id ===');
      const detailRes = await fetch(baseUrl + '/payments/batches/' + batchId, { headers });
      const detailData = await detailRes.json();
      console.log('Status:', detailRes.status);
      console.log('Batch #:', detailData.batch_number, '| Items:', detailData.items?.length);

      // TEST 6: Confirm batch as paid
      console.log('\n=== TEST 6: POST /payments/batches/:id/confirm ===');
      const confirmRes = await fetch(baseUrl + '/payments/batches/' + batchId + '/confirm', {
        method: 'POST', headers
      });
      const confirmData = await confirmRes.json();
      console.log('Status:', confirmRes.status);
      console.log('Result:', JSON.stringify(confirmData));
    }
  }

  // Final check: eligible should now be empty (all moved to Paid)
  console.log('\n=== VERIFY: Re-check eligible ===');
  const finalRes = await fetch(baseUrl + '/payments/eligible', { headers });
  const finalData = await finalRes.json();
  console.log('Remaining eligible:', Array.isArray(finalData) ? finalData.length : 'error');

  console.log('\nAll payment tests completed!');
}

test().catch(e => console.error('Test error:', e));
