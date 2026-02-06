/**
 * Phase 7: Comprehensive Integration Test Suite
 * Tests all API endpoints, error handling, auth, pagination, and user flows
 */
const baseUrl = 'http://localhost:3000/api';
let passed = 0, failed = 0, skipped = 0;

function assert(condition, testName) {
  if (condition) { passed++; console.log(`  PASS: ${testName}`); }
  else { failed++; console.log(`  FAIL: ${testName}`); }
}

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  let body;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('json')) body = await res.json();
  else body = await res.text();
  return { status: res.status, body, headers: res.headers };
}

async function test() {
  // ========================================
  // 5.1 Backend API Tests
  // ========================================
  console.log('\n====================================');
  console.log('5.1 BACKEND API TESTS');
  console.log('====================================');

  // --- Health Check ---
  console.log('\n--- Health Check ---');
  const health = await fetchJSON(baseUrl + '/health');
  assert(health.status === 200, 'Health endpoint returns 200');
  assert(health.body.status === 'ok', 'Health body has status ok');

  // --- Auth Endpoints ---
  console.log('\n--- Auth Endpoints ---');
  const headers = { 'Content-Type': 'application/json' };

  // Dev login admin
  const loginRes = await fetchJSON(baseUrl + '/auth/dev-login', {
    method: 'POST', headers,
    body: JSON.stringify({ email: 'admin@gov.ab.ca', role: 'admin' })
  });
  assert(loginRes.status === 200, 'Admin dev-login returns 200');
  assert(!!loginRes.body.data?.token, 'Login returns token');
  assert(loginRes.body.data?.user?.email === 'admin@gov.ab.ca', 'Login returns correct user email');
  const adminToken = loginRes.body.data.token;
  const adminHeaders = { 'Authorization': 'Bearer ' + adminToken, 'Content-Type': 'application/json' };

  // Auth me
  const meRes = await fetchJSON(baseUrl + '/auth/me', { headers: adminHeaders });
  assert(meRes.status === 200, 'GET /auth/me returns 200');
  assert(meRes.body.data?.email === 'admin@gov.ab.ca', '/auth/me returns correct user');

  // Token refresh (UC-AUTH-04)
  const refreshRes = await fetchJSON(baseUrl + '/auth/refresh', { method: 'POST', headers: adminHeaders });
  assert(refreshRes.status === 200, 'POST /auth/refresh returns 200');
  assert(!!refreshRes.body.data?.token, 'Refresh returns new token');

  // Invalid token
  const invalidRes = await fetchJSON(baseUrl + '/auth/me', {
    headers: { 'Authorization': 'Bearer invalid.token', 'Content-Type': 'application/json' }
  });
  assert(invalidRes.status === 401, 'Invalid token returns 401');

  // No token
  const noTokenRes = await fetchJSON(baseUrl + '/auth/me');
  assert(noTokenRes.status === 401, 'No token returns 401');

  // Login applicant
  const appLoginRes = await fetchJSON(baseUrl + '/auth/dev-login', {
    method: 'POST', headers,
    body: JSON.stringify({ email: 'student@test.com', role: 'applicant' })
  });
  assert(appLoginRes.status === 200, 'Applicant dev-login returns 200');
  const appToken = appLoginRes.body.data?.token;
  const appHeaders = { 'Authorization': 'Bearer ' + appToken, 'Content-Type': 'application/json' };

  // Login staff
  const staffLoginRes = await fetchJSON(baseUrl + '/auth/dev-login', {
    method: 'POST', headers,
    body: JSON.stringify({ email: 'staff@gov.ab.ca', role: 'scholarship_staff' })
  });
  assert(staffLoginRes.status === 200, 'Staff dev-login returns 200');
  const staffToken = staffLoginRes.body.data?.token;
  const staffHeaders = { 'Authorization': 'Bearer ' + staffToken, 'Content-Type': 'application/json' };

  // --- Scholarship Endpoints (Public) ---
  console.log('\n--- Scholarship Endpoints (Public) ---');
  const schList = await fetchJSON(baseUrl + '/scholarships');
  assert(schList.status === 200, 'GET /scholarships returns 200');
  assert(Array.isArray(schList.body.data), 'Scholarships returns array');
  assert(schList.body.data.length > 0, 'Scholarships has data');
  assert(typeof schList.body.count === 'number', 'Scholarships has count');

  // Filtering by type
  const schFiltered = await fetchJSON(baseUrl + '/scholarships?type=online+application');
  assert(schFiltered.status === 200, 'Filter by type returns 200');
  assert(schFiltered.body.data.length <= schList.body.count, 'Filter returns subset');

  // Search
  const schSearch = await fetchJSON(baseUrl + '/scholarships?search=rutherford');
  assert(schSearch.status === 200, 'Search: returns 200');
  assert(schSearch.body.data.length > 0, 'Search: finds Rutherford scholarship');

  // Get by ID
  const schId = schList.body.data[0].id;
  const schDetail = await fetchJSON(baseUrl + '/scholarships/' + schId);
  assert(schDetail.status === 200, 'GET /scholarships/:id returns 200');
  assert(schDetail.body.data?.id === schId, 'Detail returns correct scholarship');

  // Non-existent scholarship
  const sch404 = await fetchJSON(baseUrl + '/scholarships/00000000-0000-0000-0000-000000000000');
  assert(sch404.status === 404, 'Non-existent scholarship returns 404');

  // --- Profile Endpoints ---
  console.log('\n--- Profile Endpoints ---');
  const profileRes = await fetchJSON(baseUrl + '/profile/me', { headers: appHeaders });
  assert(profileRes.status === 200, 'GET /profile/me returns 200');

  const profileNoAuth = await fetchJSON(baseUrl + '/profile/me');
  assert(profileNoAuth.status === 401, 'GET /profile/me without auth returns 401');

  // Banking info
  const bankingRes = await fetchJSON(baseUrl + '/profile/banking', { headers: appHeaders });
  assert(bankingRes.status === 200, 'GET /profile/banking returns 200');

  // Lookups
  const lookupRes = await fetchJSON(baseUrl + '/profile/lookups/citizenship_types');
  assert(lookupRes.status === 200, 'GET /profile/lookups returns 200');

  // --- Application Endpoints ---
  console.log('\n--- Application Endpoints ---');
  const myApps = await fetchJSON(baseUrl + '/applications/my', { headers: appHeaders });
  assert(myApps.status === 200, 'GET /applications/my returns 200');
  assert(Array.isArray(myApps.body.data), 'My applications returns array');

  // Applicant can't access staff endpoints
  const staffDeny = await fetchJSON(baseUrl + '/staff/queue', { headers: appHeaders });
  assert(staffDeny.status === 403, 'Applicant denied staff queue (403)');

  // --- Staff Endpoints ---
  console.log('\n--- Staff Endpoints ---');
  const queue = await fetchJSON(baseUrl + '/staff/queue', { headers: staffHeaders });
  assert(queue.status === 200, 'GET /staff/queue returns 200');
  assert(Array.isArray(queue.body.applications), 'Queue returns applications array');
  assert(typeof queue.body.total === 'number', 'Queue has total count');

  const staffDash = await fetchJSON(baseUrl + '/staff/dashboard', { headers: staffHeaders });
  assert(staffDash.status === 200, 'GET /staff/dashboard returns 200');
  assert(!!staffDash.body.summary, 'Dashboard has summary');

  // Queue pagination
  const queuePage = await fetchJSON(baseUrl + '/staff/queue?limit=2&page=1', { headers: staffHeaders });
  assert(queuePage.status === 200, 'Staff queue pagination returns 200');
  assert(queuePage.body.applications.length <= 2, 'Staff queue respects limit');

  // Staff members
  const members = await fetchJSON(baseUrl + '/staff/members', { headers: staffHeaders });
  assert(members.status === 200, 'GET /staff/members returns 200');

  // Reports
  const reports = await fetchJSON(baseUrl + '/staff/reports?type=summary', { headers: staffHeaders });
  assert(reports.status === 200, 'GET /staff/reports returns 200');

  // --- Notification Endpoints ---
  console.log('\n--- Notification Endpoints ---');
  const notifs = await fetchJSON(baseUrl + '/notifications', { headers: appHeaders });
  assert(notifs.status === 200, 'GET /notifications returns 200');

  const unread = await fetchJSON(baseUrl + '/notifications/unread-count', { headers: appHeaders });
  assert(unread.status === 200, 'GET /notifications/unread-count returns 200');
  assert(typeof unread.body.count === 'number', 'Unread count is a number');

  // --- COR Endpoints ---
  console.log('\n--- COR Endpoints ---');
  const corPending = await fetchJSON(baseUrl + '/cor/pending', { headers: staffHeaders });
  assert(corPending.status === 200, 'GET /cor/pending returns 200');

  const corAll = await fetchJSON(baseUrl + '/cor/all', { headers: staffHeaders });
  assert(corAll.status === 200, 'GET /cor/all returns 200');
  assert(Array.isArray(corAll.body.data), 'COR all returns data array');

  // --- Payment Endpoints ---
  console.log('\n--- Payment Endpoints ---');
  const eligible = await fetchJSON(baseUrl + '/payments/eligible', { headers: staffHeaders });
  assert(eligible.status === 200, 'GET /payments/eligible returns 200');

  const batches = await fetchJSON(baseUrl + '/payments/batches', { headers: staffHeaders });
  assert(batches.status === 200, 'GET /payments/batches returns 200');

  const duplicates = await fetchJSON(baseUrl + '/payments/duplicates', { headers: staffHeaders });
  assert(duplicates.status === 200, 'GET /payments/duplicates returns 200');

  // --- Admin Endpoints ---
  console.log('\n--- Admin Endpoints ---');
  const adminSchs = await fetchJSON(baseUrl + '/admin/scholarships', { headers: adminHeaders });
  assert(adminSchs.status === 200, 'GET /admin/scholarships returns 200');

  const adminUsers = await fetchJSON(baseUrl + '/admin/users', { headers: adminHeaders });
  assert(adminUsers.status === 200, 'GET /admin/users returns 200');

  const roles = await fetchJSON(baseUrl + '/admin/users/roles', { headers: adminHeaders });
  assert(roles.status === 200, 'GET /admin/users/roles returns 200');
  assert(Array.isArray(roles.body), 'Roles returns array');

  const lookups = await fetchJSON(baseUrl + '/admin/scholarships/lookups', { headers: adminHeaders });
  assert(lookups.status === 200, 'GET /admin/scholarships/lookups returns 200');

  // Admin access control
  const adminDeny = await fetchJSON(baseUrl + '/admin/users', { headers: staffHeaders });
  assert(adminDeny.status === 403, 'Staff denied admin endpoints (403)');
  const adminDeny2 = await fetchJSON(baseUrl + '/admin/users', { headers: appHeaders });
  assert(adminDeny2.status === 403, 'Applicant denied admin endpoints (403)');

  // --- Audit Endpoints ---
  console.log('\n--- Audit Endpoints ---');
  const audit = await fetchJSON(baseUrl + '/admin/audit?limit=5', { headers: adminHeaders });
  assert(audit.status === 200, 'GET /admin/audit returns 200');
  assert(typeof audit.body.total === 'number', 'Audit has total count');

  const auditActions = await fetchJSON(baseUrl + '/admin/audit/actions', { headers: adminHeaders });
  assert(auditActions.status === 200, 'GET /admin/audit/actions returns 200');
  assert(Array.isArray(auditActions.body), 'Audit actions returns array');

  const auditExport = await fetchJSON(baseUrl + '/admin/audit/export', { headers: adminHeaders });
  assert(auditExport.status === 200, 'GET /admin/audit/export returns 200');
  assert(typeof auditExport.body === 'string' && auditExport.body.includes(','), 'Audit export returns CSV');

  const auditSearch = await fetchJSON(baseUrl + '/admin/audit?search=login', { headers: adminHeaders });
  assert(auditSearch.status === 200, 'Audit search returns 200');

  const auditFilter = await fetchJSON(baseUrl + '/admin/audit?action=login', { headers: adminHeaders });
  assert(auditFilter.status === 200, 'Audit filter by action returns 200');

  // --- Analytics Endpoints ---
  console.log('\n--- Analytics Endpoints ---');
  const analytics = await fetchJSON(baseUrl + '/analytics/dashboard', { headers: staffHeaders });
  assert(analytics.status === 200, 'GET /analytics/dashboard returns 200');
  assert(!!analytics.body.kpis, 'Analytics has KPIs');
  assert(Array.isArray(analytics.body.statusDistribution), 'Analytics has status distribution');
  assert(Array.isArray(analytics.body.monthlyTrends), 'Analytics has monthly trends');
  assert(Array.isArray(analytics.body.topScholarships), 'Analytics has top scholarships');
  assert(!!analytics.body.paymentStats, 'Analytics has payment stats');

  const analyticsDeny = await fetchJSON(baseUrl + '/analytics/dashboard', { headers: appHeaders });
  assert(analyticsDeny.status === 403, 'Applicant denied analytics (403)');

  // --- SFS Sync ---
  console.log('\n--- SFS Sync ---');
  const sfs = await fetchJSON(baseUrl + '/admin/sfs/sync', { method: 'POST', headers: adminHeaders });
  assert(sfs.status === 200, 'POST /admin/sfs/sync returns 200');
  assert(typeof sfs.body.enrollment_checks === 'number', 'SFS sync returns enrollment_checks');

  // ========================================
  // 5.2 Error Handling Tests
  // ========================================
  console.log('\n====================================');
  console.log('5.2 ERROR HANDLING TESTS');
  console.log('====================================');

  console.log('\n--- Invalid Inputs ---');
  const badLogin = await fetchJSON(baseUrl + '/auth/dev-login', {
    method: 'POST', headers,
    body: JSON.stringify({ email: '', role: '' })
  });
  assert(badLogin.status >= 400, 'Empty login returns error status');

  const badUUID = await fetchJSON(baseUrl + '/scholarships/not-a-uuid');
  assert(badUUID.status >= 400, 'Invalid UUID returns error');

  // ========================================
  // 5.3 Integration / Data Flow Tests
  // ========================================
  console.log('\n====================================');
  console.log('5.3 DATA FLOW TESTS');
  console.log('====================================');

  console.log('\n--- DB to API Data Flow ---');
  const schAll = await fetchJSON(baseUrl + '/scholarships');
  assert(schAll.body.data.every(s => s.id && s.name && s.code), 'All scholarships have id, name, code');

  const appAll = await fetchJSON(baseUrl + '/applications/my', { headers: appHeaders });
  if (appAll.body.data && appAll.body.data.length > 0) {
    assert(appAll.body.data.every(a => a.id && a.status), 'All applications have id and status');
  } else {
    console.log('  SKIP: No applications for this user');
    skipped++;
  }

  const notifAll = await fetchJSON(baseUrl + '/notifications', { headers: appHeaders });
  assert(notifAll.status === 200, 'Notifications flow from DB to API');

  // ========================================
  // 5.4 User Flow Tests
  // ========================================
  console.log('\n====================================');
  console.log('5.4 USER FLOW TESTS');
  console.log('====================================');

  // Flow 1: Applicant journey
  console.log('\n--- Flow: Applicant Journey ---');
  const flow1Login = await fetchJSON(baseUrl + '/auth/dev-login', {
    method: 'POST', headers,
    body: JSON.stringify({ email: 'student@test.com', role: 'applicant' })
  });
  assert(flow1Login.status === 200, 'Flow1: Applicant login OK');
  const f1H = { 'Authorization': 'Bearer ' + flow1Login.body.data.token, 'Content-Type': 'application/json' };

  const f1Sch = await fetchJSON(baseUrl + '/scholarships', { headers: f1H });
  assert(f1Sch.status === 200, 'Flow1: Browse scholarships OK');

  const f1Prof = await fetchJSON(baseUrl + '/profile/me', { headers: f1H });
  assert(f1Prof.status === 200, 'Flow1: View profile OK');

  const f1Apps = await fetchJSON(baseUrl + '/applications/my', { headers: f1H });
  assert(f1Apps.status === 200, 'Flow1: View my applications OK');

  const f1Notifs = await fetchJSON(baseUrl + '/notifications', { headers: f1H });
  assert(f1Notifs.status === 200, 'Flow1: View notifications OK');

  const f1Bank = await fetchJSON(baseUrl + '/profile/banking', { headers: f1H });
  assert(f1Bank.status === 200, 'Flow1: View banking info OK');

  // Flow 2: Staff journey
  console.log('\n--- Flow: Staff Journey ---');
  const flow2Login = await fetchJSON(baseUrl + '/auth/dev-login', {
    method: 'POST', headers,
    body: JSON.stringify({ email: 'staff@gov.ab.ca', role: 'scholarship_staff' })
  });
  assert(flow2Login.status === 200, 'Flow2: Staff login OK');
  const f2H = { 'Authorization': 'Bearer ' + flow2Login.body.data.token, 'Content-Type': 'application/json' };

  assert((await fetchJSON(baseUrl + '/staff/queue', { headers: f2H })).status === 200, 'Flow2: View queue OK');
  assert((await fetchJSON(baseUrl + '/staff/dashboard', { headers: f2H })).status === 200, 'Flow2: View dashboard OK');
  assert((await fetchJSON(baseUrl + '/cor/pending', { headers: f2H })).status === 200, 'Flow2: View COR OK');
  assert((await fetchJSON(baseUrl + '/payments/eligible', { headers: f2H })).status === 200, 'Flow2: View payments OK');
  assert((await fetchJSON(baseUrl + '/analytics/dashboard', { headers: f2H })).status === 200, 'Flow2: View analytics OK');
  assert((await fetchJSON(baseUrl + '/staff/reports?type=summary', { headers: f2H })).status === 200, 'Flow2: View reports OK');

  // Flow 3: Admin journey
  console.log('\n--- Flow: Admin Journey ---');
  const flow3Login = await fetchJSON(baseUrl + '/auth/dev-login', {
    method: 'POST', headers,
    body: JSON.stringify({ email: 'admin@gov.ab.ca', role: 'admin' })
  });
  assert(flow3Login.status === 200, 'Flow3: Admin login OK');
  const f3H = { 'Authorization': 'Bearer ' + flow3Login.body.data.token, 'Content-Type': 'application/json' };

  assert((await fetchJSON(baseUrl + '/admin/users', { headers: f3H })).status === 200, 'Flow3: View users OK');
  assert((await fetchJSON(baseUrl + '/admin/scholarships', { headers: f3H })).status === 200, 'Flow3: View scholarships OK');
  assert((await fetchJSON(baseUrl + '/admin/audit', { headers: f3H })).status === 200, 'Flow3: View audit OK');
  assert((await fetchJSON(baseUrl + '/admin/sfs/sync', { method: 'POST', headers: f3H })).status === 200, 'Flow3: SFS sync OK');
  assert((await fetchJSON(baseUrl + '/analytics/dashboard', { headers: f3H })).status === 200, 'Flow3: View analytics OK');

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n====================================');
  console.log('TEST SUMMARY');
  console.log('====================================');
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`SKIPPED: ${skipped}`);
  console.log(`TOTAL:  ${passed + failed + skipped}`);
  console.log('====================================');
  if (failed === 0) console.log('ALL TESTS PASSED!');
  else console.log(`${failed} test(s) FAILED - review above output.`);
}

test().catch(e => console.error('Test suite error:', e));
