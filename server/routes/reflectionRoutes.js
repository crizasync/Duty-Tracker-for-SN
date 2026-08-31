const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  createReflection,
  getReflections,
  updateReflection,
  deleteReflection,
} = require("../controllers/reflectionController");

router.post("/", auth, createReflection);
router.get("/", auth, getReflections);
router.put("/:id", auth, updateReflection);
router.delete("/:id", auth, deleteReflection);

module.exports = router;