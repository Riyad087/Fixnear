const { pool } = require("../config/db");
const { notify, addHistory } = require("../models/module2Helpers");

const allowedTransitions = {
  accepted: ["on_the_way", "cancelled"],
  on_the_way: ["in_service", "cancelled"],
  in_service: ["completed", "cancelled"]
};

function validDateTime(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !/^\d{2}:\d{2}(:\d{2})?$/.test(String(time))) return false;
  const parsed = new Date(`${date}T${time}`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

async function createBooking(req, res) {
  const { provider_id, service_category, problem_title, problem_description,
    service_address, city, area, latitude, longitude, preferred_date,
    preferred_time, urgency = "normal" } = req.body;

  if (!provider_id || !service_category || !problem_title || !problem_description ||
      !service_address || !city || !area || !preferred_date || !preferred_time) {
    return res.status(400).json({ message: "Please complete all required booking fields." });
  }
  if (!validDateTime(preferred_date, preferred_time)) {
    return res.status(400).json({ message: "Enter a valid preferred date and time." });
  }
  if (new Date(`${preferred_date}T${preferred_time}`) < new Date()) {
    return res.status(400).json({ message: "Preferred date and time must be in the future." });
  }
  if (!["normal", "urgent"].includes(urgency)) {
    return res.status(400).json({ message: "Urgency must be normal or urgent." });
  }

  try {
    const [providers] = await pool.execute(
      `SELECT id, user_id, service_category, is_verified, is_available
       FROM providers WHERE id = ?`,
      [Number(provider_id)]
    );
    const provider = providers[0];
    if (!provider || !provider.is_verified) return res.status(404).json({ message: "Verified provider not found." });
    if (!provider.is_available) return res.status(409).json({ message: "This provider is temporarily unavailable." });
    if (provider.service_category.toLowerCase() !== String(service_category).trim().toLowerCase()) {
      return res.status(400).json({ message: "The selected service category does not match this provider." });
    }

    const [result] = await pool.execute(
      `INSERT INTO bookings
       (customer_id, provider_id, service_category, problem_title, problem_description,
        service_address, city, area, latitude, longitude, preferred_date, preferred_time, urgency)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, provider.id, service_category.trim(), problem_title.trim(),
       problem_description.trim(), service_address.trim(), city.trim(), area.trim(),
       latitude ?? null, longitude ?? null, preferred_date, preferred_time, urgency]
    );
    await addHistory(result.insertId, req.user.id, null, "requested", "Booking request submitted.");
    await notify(provider.user_id, `New service booking request #${result.insertId}.`, result.insertId);
    return res.status(201).json({ message: "Booking request submitted.", booking_id: result.insertId });
  } catch (error) {
    console.error("Create booking:", error.message);
    return res.status(500).json({ message: "Could not create booking." });
  }
}

async function getMyBookings(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT b.*, p.business_name, u.name AS provider_name
       FROM bookings b JOIN providers p ON p.id = b.provider_id
       JOIN users u ON u.id = p.user_id
       WHERE b.customer_id = ? ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ bookings: rows });
  } catch (error) {
    console.error("My bookings:", error.message);
    res.status(500).json({ message: "Could not load bookings." });
  }
}

async function getProviderBookings(req, res) {
  try {
    const [providerRows] = await pool.execute("SELECT id FROM providers WHERE user_id = ?", [req.user.id]);
    if (!providerRows.length) return res.status(403).json({ message: "Provider profile required." });
    const [rows] = await pool.execute(
      `SELECT b.*, u.name AS customer_name, u.phone AS customer_phone
       FROM bookings b JOIN users u ON u.id = b.customer_id
       WHERE b.provider_id = ? ORDER BY b.created_at DESC`,
      [providerRows[0].id]
    );
    res.json({ bookings: rows });
  } catch (error) {
    console.error("Provider bookings:", error.message);
    res.status(500).json({ message: "Could not load provider bookings." });
  }
}

async function getBookingDetails(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT b.*, p.user_id AS provider_user_id, p.business_name,
              cu.name AS customer_name, pu.name AS provider_name
       FROM bookings b JOIN providers p ON p.id = b.provider_id
       JOIN users cu ON cu.id = b.customer_id JOIN users pu ON pu.id = p.user_id
       WHERE b.id = ?`,
      [req.params.id]
    );
    const booking = rows[0];
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    const ownsAsCustomer = booking.customer_id === req.user.id;
    const ownsAsProvider = booking.provider_user_id === req.user.id;
    if (!ownsAsCustomer && !ownsAsProvider) return res.status(403).json({ message: "You cannot access this booking." });

    const [history] = await pool.execute(
      "SELECT previous_status, new_status, note, created_at FROM booking_status_history WHERE booking_id = ? ORDER BY created_at",
      [booking.id]
    );
    res.json({ booking, history });
  } catch (error) {
    console.error("Booking details:", error.message);
    res.status(500).json({ message: "Could not load booking details." });
  }
}

async function changeBookingState(req, res) {
  const { action } = req.params;
  const { reason, status, note } = req.body || {};
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT b.*, p.user_id AS provider_user_id, p.is_available, p.is_verified
       FROM bookings b JOIN providers p ON p.id = b.provider_id
       WHERE b.id = ? FOR UPDATE`,
      [req.params.id]
    );
    const booking = rows[0];
    if (!booking) {
      await connection.rollback();
      return res.status(404).json({ message: "Booking not found." });
    }

    let nextStatus;
    let targetUserId;
    if (action === "cancel") {
      if (booking.customer_id !== req.user.id && booking.provider_user_id !== req.user.id) {
        await connection.rollback();
        return res.status(403).json({ message: "You cannot cancel this booking." });
      }
      if (!["requested", "accepted", "on_the_way"].includes(booking.status)) {
        await connection.rollback();
        return res.status(409).json({ message: "This booking can no longer be cancelled." });
      }
      nextStatus = "cancelled";
      targetUserId = booking.customer_id === req.user.id ? booking.provider_user_id : booking.customer_id;
    } else {
      if (booking.provider_user_id !== req.user.id) {
        await connection.rollback();
        return res.status(403).json({ message: "Only the assigned provider can manage this request." });
      }
      if (action === "accept" || action === "reject") {
        if (booking.status !== "requested") {
          await connection.rollback();
          return res.status(409).json({ message: "Only requested bookings can be accepted or rejected." });
        }
        if (action === "accept") {
          if (!booking.is_verified || !booking.is_available) {
            await connection.rollback();
            return res.status(409).json({ message: "Provider must be verified and available to accept bookings." });
          }
          const start = `${booking.preferred_date.toISOString ? booking.preferred_date.toISOString().slice(0,10) : booking.preferred_date} ${booking.preferred_time}`;
          const [conflicts] = await connection.execute(
            `SELECT id FROM bookings
             WHERE provider_id = ? AND id <> ?
               AND status IN ('accepted','on_the_way','in_service')
               AND preferred_date = ? AND ABS(TIME_TO_SEC(TIMEDIFF(preferred_time, ?))) < 7200
             FOR UPDATE`,
            [booking.provider_id, booking.id, booking.preferred_date, booking.preferred_time]
          );
          if (conflicts.length) {
            await connection.rollback();
            return res.status(409).json({ message: "This time overlaps another active booking." });
          }
          nextStatus = "accepted";
        } else {
          nextStatus = "rejected";
        }
      } else if (action === "status") {
        nextStatus = status;
        if (!(allowedTransitions[booking.status] || []).includes(nextStatus)) {
          await connection.rollback();
          return res.status(400).json({ message: `Invalid status transition from ${booking.status} to ${nextStatus}.` });
        }
      } else {
        await connection.rollback();
        return res.status(400).json({ message: "Unknown booking action." });
      }
      targetUserId = booking.customer_id;
    }

    const reasonValue = typeof reason === "string" ? reason.trim().slice(0, 500) : null;
    await connection.execute(
      `UPDATE bookings SET status = ?,
       cancellation_reason = CASE WHEN ? = 'cancelled' THEN ? ELSE cancellation_reason END,
       rejection_reason = CASE WHEN ? = 'rejected' THEN ? ELSE rejection_reason END,
       accepted_at = CASE WHEN ? = 'accepted' THEN NOW() ELSE accepted_at END,
       started_at = CASE WHEN ? = 'in_service' THEN NOW() ELSE started_at END,
       completed_at = CASE WHEN ? = 'completed' THEN NOW() ELSE completed_at END
       WHERE id = ?`,
      [nextStatus, nextStatus, reasonValue, nextStatus, reasonValue, nextStatus, nextStatus, nextStatus, booking.id]
    );
    await addHistory(booking.id, req.user.id, booking.status, nextStatus, note || reasonValue, connection);
    await notify(targetUserId, `Booking #${booking.id} status changed to ${nextStatus.replaceAll("_", " ")}.`, booking.id, null, connection);
    await connection.commit();
    return res.json({ message: `Booking ${nextStatus.replaceAll("_", " ")} successfully.`, status: nextStatus });
  } catch (error) {
    await connection.rollback();
    console.error("Change booking status:", error.message);
    return res.status(500).json({ message: "Could not update booking status." });
  } finally {
    connection.release();
  }
}

module.exports = { createBooking, getMyBookings, getProviderBookings, getBookingDetails, changeBookingState };
