const { pool } = require("../config/db");

async function notify(userId, message, bookingId = null, quoteId = null, connection = pool) {
  await connection.execute(
    "INSERT INTO notifications (user_id, booking_id, quote_id, message) VALUES (?, ?, ?, ?)",
    [userId, bookingId, quoteId, message]
  );
}

async function addHistory(bookingId, userId, previousStatus, newStatus, note = null, connection = pool) {
  await connection.execute(
    `INSERT INTO booking_status_history
     (booking_id, changed_by_user_id, previous_status, new_status, note)
     VALUES (?, ?, ?, ?, ?)`,
    [bookingId, userId, previousStatus, newStatus, note]
  );
}

module.exports = { notify, addHistory };
