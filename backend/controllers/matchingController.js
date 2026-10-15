const { pool } = require("../config/db");

function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (degrees) => degrees * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function matchProviders(req, res) {
  const { category, city, area, latitude, longitude } = req.query;
  if (!category) return res.status(400).json({ message: "Service category is required." });

  try {
    const [providers] = await pool.execute(
      `SELECT p.id, p.business_name, p.service_category, p.description, p.city, p.area,
              p.latitude, p.longitude, p.service_radius, p.price_range, p.rating,
              p.total_reviews, p.is_verified, p.is_available, u.name AS provider_name
       FROM providers p JOIN users u ON u.id = p.user_id
       WHERE p.is_verified = TRUE AND p.is_available = TRUE
         AND LOWER(p.service_category) = LOWER(?)
         AND (? = '' OR LOWER(p.city) = LOWER(?))
       ORDER BY p.rating DESC`,
      [category, city || "", city || ""]
    );

    const hasCoordinates = Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
      && latitude !== undefined && longitude !== undefined;

    const matches = [];
    for (const provider of providers) {
      if (area && provider.area && provider.area.toLowerCase() !== area.toLowerCase() && !hasCoordinates) continue;
      let distance = null;
      if (hasCoordinates && provider.latitude != null && provider.longitude != null) {
        distance = distanceKm(Number(latitude), Number(longitude), Number(provider.latitude), Number(provider.longitude));
        if (distance > Number(provider.service_radius || 5)) continue;
      }
      const ratingScore = provider.total_reviews > 0 ? Math.min(100, Math.max(0, Number(provider.rating) / 5 * 100)) : 50;
      const distanceScore = distance == null ? (area && provider.area.toLowerCase() === area.toLowerCase() ? 75 : 50)
        : Math.max(0, 100 * (1 - distance / Math.max(Number(provider.service_radius || 5), 1)));
      const availabilityScore = 100;
      const score = Math.round(ratingScore * 0.5 + distanceScore * 0.35 + availabilityScore * 0.15);
      const reasons = [];
      reasons.push("Verified provider");
      reasons.push("Currently available");
      if (distance != null) reasons.push(`${distance.toFixed(1)} km away and within service radius`);
      else if (area && provider.area.toLowerCase() === area.toLowerCase()) reasons.push("Serves your selected area");
      if (provider.total_reviews > 0) reasons.push(`Rated ${Number(provider.rating).toFixed(1)} from ${provider.total_reviews} reviews`);
      matches.push({ ...provider, distance_km: distance == null ? null : Number(distance.toFixed(2)), match_score: score, match_reasons: reasons });
    }
    matches.sort((a, b) => b.match_score - a.match_score);
    res.json({ algorithm: "Rule-based score: rating 50%, distance/area fit 35%, availability 15%. Missing coordinates use area fit instead of inventing distance.", providers: matches });
  } catch (error) {
    console.error("Matching error:", error.message);
    res.status(500).json({ message: "Could not match providers." });
  }
}

module.exports = { matchProviders };
