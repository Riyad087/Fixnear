const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

function createToken(user) {
    return jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
}

async function register(req, res) {
    try {
        const { name, email, password, phone, city = "", area = "" } = req.body;

        if (!name || !email || !password || !phone) {
            return res.status(400).json({
                message: "Name, email, password, and phone are required."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long."
            });
        }

        const [existingUsers] = await pool.execute(
            "SELECT id FROM users WHERE email = ?",
            [email.trim().toLowerCase()]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: "Email is already registered." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            `INSERT INTO users (name, email, password, phone, city, area, role)
             VALUES (?, ?, ?, ?, ?, ?, 'customer')`,
            [
                name.trim(),
                email.trim().toLowerCase(),
                hashedPassword,
                phone.trim(),
                city.trim(),
                area.trim()
            ]
        );

        const user = {
            id: result.insertId,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            city: city.trim(),
            area: area.trim(),
            role: "customer"
        };

        return res.status(201).json({
            message: "Registration successful.",
            token: createToken(user),
            user
        });
    } catch (error) {
        console.error("Registration error:", error.message);
        return res.status(500).json({ message: "Could not register user." });
    }
}

async function registerProvider(req, res) {
    const connection = await pool.getConnection();
    try {
        const {
            name, email, password, phone, city = "", area = "",
            business_name, service_category, description = "",
            service_radius = 10, price_range = ""
        } = req.body;

        if (!name || !email || !password || !phone || !business_name || !service_category || !city || !area) {
            return res.status(400).json({
                message: "Name, email, password, phone, business name, service category, city, and area are required."
            });
        }
        if (String(password).length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long." });
        }
        const normalizedEmail = String(email).trim().toLowerCase();
        const radius = Number(service_radius);
        if (!Number.isFinite(radius) || radius < 1 || radius > 200) {
            return res.status(400).json({ message: "Service radius must be between 1 and 200 km." });
        }

        await connection.beginTransaction();
        const [existing] = await connection.execute("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
        if (existing.length) {
            await connection.rollback();
            return res.status(409).json({ message: "Email is already registered." });
        }
        const hashedPassword = await bcrypt.hash(String(password), 12);
        const [userResult] = await connection.execute(
            `INSERT INTO users (name, email, password, phone, city, area, role)
             VALUES (?, ?, ?, ?, ?, ?, 'provider')`,
            [String(name).trim(), normalizedEmail, hashedPassword, String(phone).trim(), String(city).trim(), String(area).trim()]
        );
        await connection.execute(
            `INSERT INTO providers
             (user_id, business_name, service_category, description, city, area, service_radius, price_range, is_verified, is_available)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE, TRUE)`,
            [userResult.insertId, String(business_name).trim(), String(service_category).trim(), String(description).trim(), String(city).trim(), String(area).trim(), radius, String(price_range || "Contact for estimate").trim()]
        );
        await connection.commit();
        return res.status(201).json({
            message: "Provider account created. Your profile is pending administrator verification; you can now log in.",
            user: { id: userResult.insertId, name: String(name).trim(), email: normalizedEmail, role: "provider" }
        });
    } catch (error) {
        try { await connection.rollback(); } catch (_) {}
        console.error("Provider registration error:", error.message);
        if (error.code === "ER_NO_SUCH_TABLE" || error.code === "ER_BAD_FIELD_ERROR") {
            return res.status(500).json({ message: "Provider database schema is missing required columns. Check the users and providers tables against the FixNear schema." });
        }
        return res.status(500).json({ message: "Could not create provider account." });
    } finally {
        connection.release();
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const [users] = await pool.execute(
            `SELECT id, name, email, password, phone, role, city, area
             FROM users WHERE email = ?`,
            [email.trim().toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const user = users[0];
        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const safeUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            city: user.city,
            area: user.area
        };

        return res.json({
            message: "Login successful.",
            token: createToken(safeUser),
            user: safeUser
        });
    } catch (error) {
        console.error("Login error:", error.message);
        return res.status(500).json({ message: "Could not log in." });
    }
}

module.exports = { register, registerProvider, login };
