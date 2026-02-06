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
  const login = await request('POST', '/api/auth/dev-login', { email: 'profiletest4@test.ca', role: 'applicant' });
  const token = login.body.data.token;
  console.log('1. Login OK');

  const create = await request('POST', '/api/profile/me', {
    first_name: 'Jane', last_name: 'Doe', date_of_birth: '2000-05-15',
    sin: '123-456-789', phone: '7801234567',
    address_street: '123 Main Street', address_city: 'Edmonton',
    address_province: 'AB', address_postal_code: 'T5J 2N9',
    citizenship_status: 'Canadian Citizen', residency_status: true
  }, { Authorization: 'Bearer ' + token });
  console.log('2. Create Profile:', create.status, create.body.success);
  if (create.body.data) {
    console.log('   Name:', create.body.data.display_name, '| Complete:', create.body.data.profile_complete);
  }
  if (!create.body.success) {
    console.log('   Error:', create.body.message || JSON.stringify(create.body.errors));
  }

  const get = await request('GET', '/api/profile/me', null, { Authorization: 'Bearer ' + token });
  console.log('3. Get Profile:', get.body.success, '| SIN masked:', get.body.data?.sin_masked);
  console.log('   City:', get.body.data?.address_city, '| Citizenship:', get.body.data?.citizenship_status);

  const update = await request('PUT', '/api/profile/me', {
    first_name: 'Janet', last_name: 'Smith', phone: '7809876543'
  }, { Authorization: 'Bearer ' + token });
  console.log('4. Update Profile:', update.status, update.body.success);
  if (update.body.data) {
    console.log('   New name:', update.body.data.display_name, '| Phone:', update.body.data.phone);
  }
  if (!update.body.success) {
    console.log('   Error:', update.body.message);
  }

  const bank = await request('POST', '/api/profile/banking', {
    institution_number: '001', transit_number: '12345', account_number: '1234567', authorization_signed: true
  }, { Authorization: 'Bearer ' + token });
  console.log('5. Save Banking:', bank.status, bank.body.success);

  const bankGet = await request('GET', '/api/profile/banking', null, { Authorization: 'Bearer ' + token });
  console.log('6. Get Banking:', bankGet.body.success, '| Masked:', bankGet.body.data?.account_number_masked);

  // Test lookups
  const cit = await request('GET', '/api/profile/lookups/citizenship_types');
  console.log('7. Citizenship lookups:', cit.body.data?.length);
  const prov = await request('GET', '/api/profile/lookups/provinces');
  console.log('8. Province lookups:', prov.body.data?.length);

  // Test validation errors
  const bad = await request('POST', '/api/profile/me', { first_name: 'X' }, { Authorization: 'Bearer ' + token });
  console.log('9. Validation:', bad.status, '| Errors:', bad.body.errors?.length);

  console.log('\nAll profile API tests complete!');
})();
