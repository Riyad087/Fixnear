const express = require("express");
const { matchProviders } = require("../controllers/matchingController");
const { requireAuth } = require("../middleware/authMiddleware");
const router = express.Router();
router.use(requireAuth);
router.get("/providers", matchProviders);
router.post("/requests", (req, res) => {
  const { category, city, area, latitude, longitude } = req.body;
  const query = new URLSearchParams();
  if (category) query.set("category", category);
  if (city) query.set("city", city);
  if (area) query.set("area", area);
  if (latitude != null) query.set("latitude", String(latitude));
  if (longitude != null) query.set("longitude", String(longitude));
  req.url = `/providers?${query.toString()}`;
  return matchProviders(req, res);
});
module.exports = router;
