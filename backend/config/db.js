const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "fixnear_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testDatabaseConnection() {
    let connection;

    try {
        connection = await pool.getConnection();
        console.log("MySQL database connected successfully.");
    } catch (error) {
        console.error("MySQL connection failed:", error.message);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = { pool, testDatabaseConnection };
