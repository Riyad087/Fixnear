require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { testDatabaseConnection } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const providerRoutes = require("./routes/providerRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const matchingRoutes = require("./routes/matchingRoutes");
const quoteRoutes = require("./routes/quoteRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const complaintRoutes = require("./routes/complaintRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error("JWT_SECRET must be set to a random secret with at least 32 characters in backend/.env.");
    process.exit(1);
}

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "FixNear backend is running!", api: "/api", health: "/api/health" });
});
app.get("/api/health", async (req, res) => {
    try {
        const { pool } = require("./config/db");
        await pool.query("SELECT 1");
        res.json({ status: "ok", database: "connected" });
    } catch (error) {
        res.status(503).json({ status: "error", database: "unavailable" });
    }
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/complaints", complaintRoutes);

async function startServer() {
    try {
        await testDatabaseConnection();

        app.listen(PORT, () => {
            console.log(`FixNear server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server was not started because the database connection failed.");
        process.exit(1);
    }
}

startServer();
