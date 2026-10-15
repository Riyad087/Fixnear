
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Allow the frontend to send requests to this server
app.use(cors({
    origin: "http://localhost:5173"
}));

// Allow Express to read JSON request bodies
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.json({
        message: "FixNear backend is running successfully!"
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`FixNear server is running on port ${PORT}`);
});
