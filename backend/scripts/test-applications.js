import http from 'http';

function request(method, path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = { hostname: 'localhost', port: 3000, path, method, headers: { 'Content-Type': 'application/json', ...headers } };
    const req = http.request(options, res => { let body = ''; res.on('data', c => body += c); res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) })); });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  // 1. Login as applicant with profile
  console.log('=== Setup: Login & Create Profile ===');
  const login = await request('POST', '/api/auth/dev-login', { email: 'apptest@test.ca', role: 'applicant' });
  const token = login.body.data.token;

  // Create profile first
  await request('POST', '/api/profile/me', {
    first_name: 'App', last_name: 'Tester', date_of_birth: '2000-01-01',
    sin: '987-654-321', phone: '7805551234',
    address_street: '789 Test Blvd', address_city: 'Edmonton',
    address_province: 'AB', address_postal_code: 'T5K 1A1',
    citizenship_status: 'Canadian Citizen', residency_status: true
  }, { Authorization: 'Bearer ' + token });
  console.log('Profile created');

  // 2. Get an online scholarship
  const schRes = await request('GET', '/api/scholarships?type=online+application', null, { Authorization: 'Bearer ' + token });
  const onlineScholarships = schRes.body.data.filter(s => s.type === 'online application');
  if (onlineScholarships.length === 0) {
    console.log('No online scholarships found, using first scholarship');
  }
  const scholarshipId = onlineScholarships.length > 0 ? onlineScholarships[0].id : schRes.body.data[0].id;
  console.log('Using scholarship:', onlineScholarships[0]?.name || 'N/A');

  // 3. Start application
  console.log('\n=== UC-APP-01: Start Application ===');
  const startRes = await request('POST', '/api/applications', { scholarship_id: scholarshipId }, { Authorization: 'Bearer ' + token });
  console.log('Start:', startRes.status, startRes.body.success);
  if (!startRes.body.success) {
    console.log('Error:', startRes.body.message);
    // If no online scholarship, test with first one and expect error
    process.exit(0);
  }
  const appId = startRes.body.data.id;
  const refNum = startRes.body.data.reference_number;
  console.log('Ref:', refNum, '| Status:', startRes.body.data.status);
  console.log('Personal info pre-filled:', JSON.stringify(startRes.body.data.personal_info).substring(0, 100));

  // 4. Save draft (UC-APP-03)
  console.log('\n=== UC-APP-03: Save Draft ===');
  const saveRes = await request('PUT', '/api/applications/' + appId, {
    postsecondary_info: {
      institution_name: 'University of Alberta',
      program: 'Computer Science',
      enrollment_status: 'Full-time',
      year_of_study: 3,
      expected_graduation: '2027-05'
    },
    high_school_info: {
      school_name: 'Old Scona Academic',
      graduation_year: 2018
    },
    additional_info: {
      extracurriculars: 'Student Council, Debate Club',
      awards: 'Deans List 2024'
    },
    essay: 'I am passionate about technology and its potential to improve lives in Alberta...'
  }, { Authorization: 'Bearer ' + token });
  console.log('Draft saved:', saveRes.status, saveRes.body.success);

  // 5. Get application (UC-APP-02 verify)
  console.log('\n=== UC-APP-02: Get Application Detail ===');
  const getRes = await request('GET', '/api/applications/' + appId, null, { Authorization: 'Bearer ' + token });
  console.log('Get:', getRes.body.success);
  console.log('Post-secondary:', JSON.stringify(getRes.body.data.postsecondary_info).substring(0, 80));
  console.log('Essay length:', getRes.body.data.essay?.length);

  // 6. Update declaration and privacy consent
  console.log('\n=== Finalize Draft ===');
  const finalRes = await request('PUT', '/api/applications/' + appId, {
    declaration_signed: true,
    privacy_consent: true
  }, { Authorization: 'Bearer ' + token });
  // declaration_signed and privacy_consent are booleans not in allowed fields, need to add them
  console.log('Finalize:', finalRes.status);

  // 7. Submit (UC-APP-05)
  console.log('\n=== UC-APP-05: Submit Application ===');
  const submitRes = await request('POST', '/api/applications/' + appId + '/submit', null, { Authorization: 'Bearer ' + token });
  console.log('Submit:', submitRes.status, submitRes.body.success);
  console.log('Message:', submitRes.body.message);
  if (!submitRes.body.success) console.log('Errors:', submitRes.body.errors);

  // 8. View my applications (UC-APP-06)
  console.log('\n=== UC-APP-06: View My Applications ===');
  const myApps = await request('GET', '/api/applications/my', null, { Authorization: 'Bearer ' + token });
  console.log('My apps:', myApps.body.count);
  myApps.body.data.forEach(a => console.log('  -', a.reference_number, '|', a.status, '|', a.scholarship_name));

  // 9. Withdraw test - start another application first
  console.log('\n=== UC-APP-07: Withdraw Test ===');
  // Try to withdraw the submitted one
  const withdrawRes = await request('POST', '/api/applications/' + appId + '/withdraw', null, { Authorization: 'Bearer ' + token });
  console.log('Withdraw submitted:', withdrawRes.status, withdrawRes.body.success);

  console.log('\nAll application API tests complete!');
})();
