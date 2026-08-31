const express = require("express");
const router = express.Router();

const {
  getProfile,
  updateProfile,
} = require("../controllers/profileController");

const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// GET PROFILE
router.get("/", auth, getProfile);

// UPDATE PROFILE
router.put(
  "/",
  auth,
  upload.single("avatar"),
  updateProfile
);

module.exports = router;