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
  // UC-AUTH-04: Session Refresh
  // ============================
  console.log('=== TEST 1: POST /auth/refresh (UC-AUTH-04) ===');
  const refreshRes = await fetch(baseUrl + '/auth/refresh', { method: 'POST', headers });
  const refreshData = await refreshRes.json();
  console.log('Status:', refreshRes.status);
  console.log('New token received:', !!refreshData.data?.token);
  console.log('User in refresh:', refreshData.data?.user?.email);

  // Use new token for subsequent requests
  if (refreshData.data?.token) {
    headers['Authorization'] = 'Bearer ' + refreshData.data.token;
  }

  // TEST: Expired/invalid token rejection
  console.log('\n=== TEST 2: Expired token rejection (UC-AUTH-04) ===');
  const expiredRes = await fetch(baseUrl + '/auth/me', {
    headers: { 'Authorization': 'Bearer invalid.token.here', 'Content-Type': 'application/json' }
  });
  console.log('Status:', expiredRes.status, '(should be 401)');

  // ============================
  // UC-AUTH-05: Assign User Roles (already tested in admin)
  // ============================
  console.log('\n=== TEST 3: UC-AUTH-05 - Already implemented in UC-ADMIN-02 ===');
  console.log('Role assignment verified in admin tests (changeRole, self-protection)');

  // ============================
  // UC-AUDIT-01: View Audit Trail
  // ============================
  console.log('\n=== TEST 4: GET /admin/audit (UC-AUDIT-01) ===');
  const auditRes = await fetch(baseUrl + '/admin/audit?limit=5', { headers });
  const auditData = await auditRes.json();
  console.log('Status:', auditRes.status, '| Total logs:', auditData.total, '| Returned:', auditData.data?.length);
  if (auditData.data) {
    auditData.data.slice(0, 3).forEach(l =>
      console.log(`  ${new Date(l.created_at).toISOString().slice(0, 19)} | ${l.user_name || 'system'} | ${l.action}`)
    );
  }

  // TEST: Get audit actions
  console.log('\n=== TEST 5: GET /admin/audit/actions (UC-AUDIT-01) ===');
  const actionsRes = await fetch(baseUrl + '/admin/audit/actions', { headers });
  const actionsData = await actionsRes.json();
  console.log('Status:', actionsRes.status, '| Actions:', actionsData.join(', '));

  // TEST: Search audit logs
  console.log('\n=== TEST 6: GET /admin/audit?search=login (UC-AUDIT-01) ===');
  const searchAuditRes = await fetch(baseUrl + '/admin/audit?search=login', { headers });
  const searchAuditData = await searchAuditRes.json();
  console.log('Status:', searchAuditRes.status, '| Found:', searchAuditData.total);

  // TEST: Filter by action
  console.log('\n=== TEST 7: GET /admin/audit?action=login (UC-AUDIT-01) ===');
  const filterAuditRes = await fetch(baseUrl + '/admin/audit?action=login', { headers });
  const filterAuditData = await filterAuditRes.json();
  console.log('Status:', filterAuditRes.status, '| Matching:', filterAuditData.total);

  // TEST: Export CSV
  console.log('\n=== TEST 8: GET /admin/audit/export (UC-AUDIT-01) ===');
  const exportRes = await fetch(baseUrl + '/admin/audit/export', { headers });
  const csvText = await exportRes.text();
  console.log('Status:', exportRes.status, '| CSV length:', csvText.length, '| Lines:', csvText.split('\n').length);
  console.log('Headers:', csvText.split('\n')[0].substring(0, 100));

  // ============================
  // UC-INT-01: Sync Data with SFS
  // ============================
  console.log('\n=== TEST 9: POST /admin/sfs/sync (UC-INT-01) ===');
  const syncRes = await fetch(baseUrl + '/admin/sfs/sync', { method: 'POST', headers });
  const syncData = await syncRes.json();
  console.log('Status:', syncRes.status);
  console.log('Enrollment checks:', syncData.enrollment_checks);
  console.log('Confirmed:', syncData.enrollment_confirmed);
  console.log('Failed/Pending:', syncData.enrollment_failed);
  console.log('Students synced:', syncData.data_synced);
  console.log('Sync status:', syncData.status);

  console.log('\nAll remaining use case tests completed!');
}

test().catch(e => console.error('Test error:', e));
