const { pool } = require("../config/db");

async function listNotifications(req, res) {
  try {
    const [notifications] = await pool.execute(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100",
      [req.user.id]
    );
    res.json({ notifications });
  } catch (error) {
    console.error("Notifications:", error.message);
    res.status(500).json({ message: "Could not load notifications." });
  }
}

async function markRead(req, res) {
  try {
    const [result] = await pool.execute(
      "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Notification not found." });
    res.json({ message: "Notification marked as read." });
  } catch (error) {
    console.error("Mark notification read:", error.message);
    res.status(500).json({ message: "Could not update notification." });
  }
}


async function markAllRead(req, res) {
  try {
    await pool.execute("UPDATE notifications SET is_read = TRUE WHERE user_id = ?", [req.user.id]);
    res.json({ message: "All notifications marked as read." });
  } catch (error) {
    console.error("Mark all notifications read:", error.message);
    res.status(500).json({ message: "Could not update notifications." });
  }
}

async function unreadCount(req, res) {
  try {
    const [rows] = await pool.execute("SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE", [req.user.id]);
    res.json({ unread_count: Number(rows[0].count) });
  } catch (error) {
    console.error("Unread count:", error.message);
    res.status(500).json({ message: "Could not count notifications." });
  }
}

module.exports = { listNotifications, markRead, markAllRead, unreadCount };
