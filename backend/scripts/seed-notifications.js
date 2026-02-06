import pg from 'pg';

const c = new pg.Client('postgresql://postgres.anwfztxxdxzpcdlynsmq:Rocambole50!@aws-1-us-east-2.pooler.supabase.com:6543/postgres');
await c.connect();

// List all users
const users = await c.query('SELECT id, email, role, display_name FROM ae_scholarships.users ORDER BY created_at');
console.log('=== ALL USERS ===');
users.rows.forEach(u => console.log(u.id, '|', u.email, '|', u.role, '|', u.display_name));

// Check existing notifications
const notifs = await c.query('SELECT user_id, count(*) FROM ae_scholarships.notifications GROUP BY user_id');
console.log('\n=== NOTIFICATIONS BY USER ===');
notifs.rows.forEach(n => console.log(n.user_id, '| count:', n.count));

// Seed notifications for ALL users
for (const user of users.rows) {
  const existing = await c.query('SELECT count(*) FROM ae_scholarships.notifications WHERE user_id = $1', [user.id]);
  if (parseInt(existing.rows[0].count) > 0) {
    console.log('\nSkipping', user.email, '- already has', existing.rows[0].count, 'notifications');
    continue;
  }

  if (user.role === 'applicant') {
    await c.query(
      "INSERT INTO ae_scholarships.notifications (user_id, type, title, message) VALUES ($1, 'submitted', 'Application Submitted', 'Your application AES-2026-TEST01 has been submitted successfully.')",
      [user.id]
    );
    await c.query(
      "INSERT INTO ae_scholarships.notifications (user_id, type, title, message) VALUES ($1, 'action_required', 'Action Required', 'Please provide additional documentation for your scholarship application.')",
      [user.id]
    );
    await c.query(
      "INSERT INTO ae_scholarships.notifications (user_id, type, title, message) VALUES ($1, 'decision_available', 'Decision Available', 'A decision has been made on your scholarship application.')",
      [user.id]
    );
    console.log('\nSeeded 3 notifications for applicant', user.email);
  } else {
    await c.query(
      "INSERT INTO ae_scholarships.notifications (user_id, type, title, message) VALUES ($1, 'submitted', 'New Application Received', 'A new scholarship application has been submitted for review.')",
      [user.id]
    );
    console.log('\nSeeded 1 notification for staff', user.email);
  }
}

// Final count
const finalCount = await c.query('SELECT user_id, count(*) FROM ae_scholarships.notifications GROUP BY user_id');
console.log('\n=== FINAL NOTIFICATION COUNTS ===');
for (const row of finalCount.rows) {
  const u = users.rows.find(u => u.id === row.user_id);
  console.log(u?.email || row.user_id, '| count:', row.count);
}

await c.end();
console.log('\nDone! Refresh the Notifications page in the browser.');
