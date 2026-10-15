const { pool } = require("../config/db");

async function getProviders(req, res) {
    try {
        const { category, city, area, sort } = req.query;
        const conditions = ["p.is_verified = TRUE"];
        const values = [];

        if (category) {
            conditions.push("p.service_category LIKE ?");
            values.push(`%${category}%`);
        }

        if (city) {
            conditions.push("p.city LIKE ?");
            values.push(`%${city}%`);
        }

        if (area) {
            conditions.push("p.area LIKE ?");
            values.push(`%${area}%`);
        }

        let orderBy = "p.rating DESC, p.total_reviews DESC";
        if (sort === "price") {
            orderBy = "p.price_range ASC, p.rating DESC";
        } else if (sort === "reviews") {
            orderBy = "p.total_reviews DESC, p.rating DESC";
        }

        const sql = `
            SELECT p.id, p.user_id, p.business_name, p.service_category,
                   p.description, p.city, p.area, p.latitude, p.longitude,
                   p.service_radius, p.price_range, p.rating, p.total_reviews,
                   p.is_verified, p.is_available, u.name AS provider_name
            FROM providers p
            JOIN users u ON u.id = p.user_id
            WHERE ${conditions.join(" AND ")}
            ORDER BY ${orderBy}
        `;

        const [providers] = await pool.execute(sql, values);
        return res.json({ providers });
    } catch (error) {
        console.error("Provider search error:", error.message);
        return res.status(500).json({ message: "Could not search providers." });
    }
}

async function getProviderById(req, res) {
    try {
        const [providers] = await pool.execute(
            `SELECT p.id, p.user_id, p.business_name, p.service_category,
                    p.description, p.city, p.area, p.latitude, p.longitude,
                    p.service_radius, p.price_range, p.rating, p.total_reviews,
                    p.is_verified, p.is_available, u.name AS provider_name
             FROM providers p
             JOIN users u ON u.id = p.user_id
             WHERE p.id = ? AND p.is_verified = TRUE`,
            [req.params.id]
        );

        if (providers.length === 0) {
            return res.status(404).json({ message: "Verified provider not found." });
        }

        return res.json({ provider: providers[0] });
    } catch (error) {
        console.error("Provider details error:", error.message);
        return res.status(500).json({ message: "Could not load provider details." });
    }
}

async function compareProviders(req, res) {
    try {
        const idsText = String(req.query.ids || "");
        const ids = [...new Set(idsText.split(",").map((id) => Number(id)))];

        if (
            ids.length < 2 ||
            ids.length > 4 ||
            ids.some((id) => !Number.isInteger(id) || id <= 0)
        ) {
            return res.status(400).json({
                message: "Provide between 2 and 4 valid provider IDs, e.g. ?ids=1,2."
            });
        }

        const placeholders = ids.map(() => "?").join(", ");
        const [providers] = await pool.execute(
            `SELECT p.id, p.business_name, p.service_category, p.description,
                    p.city, p.area, p.service_radius, p.price_range, p.rating,
                    p.total_reviews, p.is_verified, p.is_available,
                    u.name AS provider_name
             FROM providers p
             JOIN users u ON u.id = p.user_id
             WHERE p.is_verified = TRUE AND p.id IN (${placeholders})`,
            ids
        );

        return res.json({ providers });
    } catch (error) {
        console.error("Provider comparison error:", error.message);
        return res.status(500).json({ message: "Could not compare providers." });
    }
}

module.exports = { getProviders, getProviderById, compareProviders };
