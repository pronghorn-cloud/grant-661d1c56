import { query } from '../config/database.js';

export async function getUserNotifications(userId, { limit = 50, offset = 0, unreadOnly = false } = {}) {
  let sql = `
    SELECT n.id, n.application_id, n.type, n.title, n.message, n.read, n.sent_at,
           nt.label as type_label
    FROM ae_scholarships.notifications n
    LEFT JOIN ae_scholarships.notification_types nt ON nt.code = n.type
    WHERE n.user_id = $1`;

  const values = [userId];
  let paramCount = 1;

  if (unreadOnly) {
    sql += ` AND n.read = false`;
  }

  sql += ` ORDER BY n.sent_at DESC`;

  paramCount++;
  sql += ` LIMIT $${paramCount}`;
  values.push(limit);

  paramCount++;
  sql += ` OFFSET $${paramCount}`;
  values.push(offset);

  const result = await query(sql, values);
  return result.rows;
}

export async function getUnreadCount(userId) {
  const result = await query(
    `SELECT count(*) FROM ae_scholarships.notifications WHERE user_id = $1 AND read = false`,
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
}

export async function markAsRead(notificationId, userId) {
  const result = await query(
    `UPDATE ae_scholarships.notifications SET read = true
     WHERE id = $1 AND user_id = $2
     RETURNING id, read`,
    [notificationId, userId]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Notification not found'), { status: 404 });
  return result.rows[0];
}

export async function markAllAsRead(userId) {
  const result = await query(
    `UPDATE ae_scholarships.notifications SET read = true
     WHERE user_id = $1 AND read = false
     RETURNING id`,
    [userId]
  );
  return { updated: result.rowCount };
}

export async function createNotification(userId, { applicationId, type, title, message }) {
  const result = await query(
    `INSERT INTO ae_scholarships.notifications (user_id, application_id, type, title, message)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, application_id, type, title, message, read, sent_at`,
    [userId, applicationId || null, type, title, message]
  );
  return result.rows[0];
}
