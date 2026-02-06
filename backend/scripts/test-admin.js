const baseUrl = 'http://localhost:3000/api';

async function test() {
  // Login as admin
  const loginRes = await fetch(baseUrl + '/auth/dev-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gov.ab.ca', role: 'admin' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  if (!token) { console.log('Login failed:', JSON.stringify(loginData)); return; }
  const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
  console.log('Admin login: OK\n');

  // ============================
  // UC-ADMIN-01: Scholarship Management
  // ============================

  // TEST 1: List scholarships
  console.log('=== TEST 1: GET /admin/scholarships ===');
  const schRes = await fetch(baseUrl + '/admin/scholarships?limit=5', { headers });
  const schData = await schRes.json();
  console.log('Status:', schRes.status, '| Total:', schData.total, '| Returned:', schData.data?.length);

  // TEST 2: Get lookups
  console.log('\n=== TEST 2: GET /admin/scholarships/lookups ===');
  const lookupRes = await fetch(baseUrl + '/admin/scholarships/lookups', { headers });
  const lookupData = await lookupRes.json();
  console.log('Status:', lookupRes.status, '| Categories:', lookupData.categories?.length, '| Types:', lookupData.types?.length);

  // TEST 3: Create scholarship
  console.log('\n=== TEST 3: POST /admin/scholarships ===');
  const createRes = await fetch(baseUrl + '/admin/scholarships', {
    method: 'POST', headers,
    body: JSON.stringify({
      code: 'TEST-ADMIN-001',
      name: 'Admin Test Scholarship',
      type: 'online application',
      value: '1500.00',
      deadline_end: '2026-06-30',
      academic_year: '2025-2026',
      status: 'Active'
    })
  });
  const createData = await createRes.json();
  console.log('Status:', createRes.status, '| Created:', createData.code, createData.name);
  const newSchId = createData.id;

  // TEST 4: Update scholarship
  if (newSchId) {
    console.log('\n=== TEST 4: PUT /admin/scholarships/:id ===');
    const updateRes = await fetch(baseUrl + '/admin/scholarships/' + newSchId, {
      method: 'PUT', headers,
      body: JSON.stringify({ value: '2000.00', status: 'Closed' })
    });
    const updateData = await updateRes.json();
    console.log('Status:', updateRes.status, '| Updated value:', updateData.value, '| Status:', updateData.status);
  }

  // TEST 5: Get scholarship by ID
  if (newSchId) {
    console.log('\n=== TEST 5: GET /admin/scholarships/:id ===');
    const detailRes = await fetch(baseUrl + '/admin/scholarships/' + newSchId, { headers });
    const detailData = await detailRes.json();
    console.log('Status:', detailRes.status, '| Name:', detailData.name, '| Apps:', detailData.application_count);
  }

  // ============================
  // UC-ADMIN-02: User Management
  // ============================

  // TEST 6: List users
  console.log('\n=== TEST 6: GET /admin/users ===');
  const usersRes = await fetch(baseUrl + '/admin/users?limit=5', { headers });
  const usersData = await usersRes.json();
  console.log('Status:', usersRes.status, '| Total:', usersData.total, '| Returned:', usersData.data?.length);
  if (usersData.data) {
    usersData.data.slice(0, 3).forEach(u => console.log(`  ${u.display_name} - ${u.role} - Apps: ${u.application_count}`));
  }

  // TEST 7: Get roles
  console.log('\n=== TEST 7: GET /admin/users/roles ===');
  const rolesRes = await fetch(baseUrl + '/admin/users/roles', { headers });
  const rolesData = await rolesRes.json();
  console.log('Status:', rolesRes.status, '| Roles:', rolesData.map(r => r.code).join(', '));

  // TEST 8: Search users
  console.log('\n=== TEST 8: GET /admin/users?search=test ===');
  const searchRes = await fetch(baseUrl + '/admin/users?search=test', { headers });
  const searchData = await searchRes.json();
  console.log('Status:', searchRes.status, '| Found:', searchData.total);

  // TEST 9: Update user role (find a test user)
  const testUser = usersData.data?.find(u => u.role === 'applicant');
  if (testUser) {
    console.log('\n=== TEST 9: PUT /admin/users/:id/role ===');
    console.log(`Changing ${testUser.display_name} from applicant to scholarship_staff...`);
    const roleRes = await fetch(baseUrl + '/admin/users/' + testUser.id + '/role', {
      method: 'PUT', headers,
      body: JSON.stringify({ role: 'scholarship_staff' })
    });
    const roleData = await roleRes.json();
    console.log('Status:', roleRes.status, '| Result:', roleData.message);

    // Revert
    console.log('Reverting back to applicant...');
    await fetch(baseUrl + '/admin/users/' + testUser.id + '/role', {
      method: 'PUT', headers,
      body: JSON.stringify({ role: 'applicant' })
    });
    console.log('Reverted.');
  }

  // TEST 10: Block/unblock user
  if (testUser) {
    console.log('\n=== TEST 10: PUT /admin/users/:id/block ===');
    const blockRes = await fetch(baseUrl + '/admin/users/' + testUser.id + '/block', {
      method: 'PUT', headers,
      body: JSON.stringify({ blocked: true })
    });
    const blockData = await blockRes.json();
    console.log('Status:', blockRes.status, '| Result:', blockData.message);

    // Unblock
    const unblockRes = await fetch(baseUrl + '/admin/users/' + testUser.id + '/block', {
      method: 'PUT', headers,
      body: JSON.stringify({ blocked: false })
    });
    const unblockData = await unblockRes.json();
    console.log('Unblock:', unblockRes.status, '|', unblockData.message);
  }

  // TEST 11: Self-role-change protection
  console.log('\n=== TEST 11: Self-protection check ===');
  const selfRes = await fetch(baseUrl + '/admin/users/' + loginData.data.user.id + '/role', {
    method: 'PUT', headers,
    body: JSON.stringify({ role: 'applicant' })
  });
  const selfData = await selfRes.json();
  console.log('Status:', selfRes.status, '| Result:', selfData.message, '(should be 400)');

  // ============================
  // UC-ADMIN-03: Legacy Import
  // ============================

  // TEST 12: Get import history
  console.log('\n=== TEST 12: GET /admin/legacy/imports ===');
  const legacyRes = await fetch(baseUrl + '/admin/legacy/imports', { headers });
  const legacyData = await legacyRes.json();
  console.log('Status:', legacyRes.status, '| Total imports:', legacyData.total);

  // TEST 13: Import legacy submissions
  console.log('\n=== TEST 13: POST /admin/legacy/import ===');
  const importRes = await fetch(baseUrl + '/admin/legacy/import', {
    method: 'POST', headers,
    body: JSON.stringify({
      submissions: [
        { email: 'legacy1@test.com', first_name: 'Legacy', last_name: 'User1', scholarship_code: 'TEST-ADMIN-001', status: 'Submitted' },
        { email: 'legacy2@test.com', first_name: 'Legacy', last_name: 'User2', scholarship_code: 'INVALID-CODE', status: 'Submitted' }
      ]
    })
  });
  const importData = await importRes.json();
  console.log('Status:', importRes.status);
  console.log('Imported:', importData.imported, '| Failed:', importData.failed, '| Total:', importData.total);
  if (importData.errors?.length) {
    importData.errors.forEach(e => console.log('  Error:', e.email, '-', e.error));
  }

  // ============================
  // ACCESS CONTROL TEST
  // ============================
  console.log('\n=== TEST 14: Access control - staff should be denied ===');
  const staffLogin = await fetch(baseUrl + '/auth/dev-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@gov.ab.ca', role: 'scholarship_staff' })
  });
  const staffData = await staffLogin.json();
  const staffHeaders = { 'Authorization': 'Bearer ' + staffData.data.token, 'Content-Type': 'application/json' };
  const deniedRes = await fetch(baseUrl + '/admin/users', { headers: staffHeaders });
  console.log('Status:', deniedRes.status, '(should be 403)');

  console.log('\nAll admin tests completed!');
}

test().catch(e => console.error('Test error:', e));
