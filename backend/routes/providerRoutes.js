const express = require("express");
const {
    getProviders,
    getProviderById,
    compareProviders
} = require("../controllers/providerController");

const router = express.Router();

router.get("/", getProviders);
router.get("/compare", compareProviders);
router.get("/:id", getProviderById);

module.exports = router;
