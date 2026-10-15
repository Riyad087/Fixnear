const { pool } = require("../config/db");

async function getProfile(req, res) {
    try {
        const [users] = await pool.execute(
            `SELECT id, name, email, phone, role, city, area, created_at
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        return res.json({ user: users[0] });
    } catch (error) {
        console.error("Profile error:", error.message);
        return res.status(500).json({ message: "Could not load profile." });
    }
}

async function updateProfile(req, res) {
    try {
        const { name, phone, city = "", area = "" } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ message: "Name and phone are required." });
        }

        await pool.execute(
            "UPDATE users SET name = ?, phone = ?, city = ?, area = ? WHERE id = ?",
            [name.trim(), phone.trim(), city.trim(), area.trim(), req.user.id]
        );

        const [users] = await pool.execute(
            `SELECT id, name, email, phone, role, city, area, created_at
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        return res.json({ message: "Profile updated successfully.", user: users[0] });
    } catch (error) {
        console.error("Update profile error:", error.message);
        return res.status(500).json({ message: "Could not update profile." });
    }
}

module.exports = { getProfile, updateProfile };
