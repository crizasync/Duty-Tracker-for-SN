const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { searchFacilities } = require("../controllers/facilityController");
router.get("/search", auth, searchFacilities);
module.exports = router;
