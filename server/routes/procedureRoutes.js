const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  createProcedure,
  getProcedures,
  updateProcedure,
  deleteProcedure,
} = require("../controllers/procedureController");

router.post("/", auth, createProcedure);
router.get("/", auth, getProcedures);
router.put("/:id", auth, updateProcedure);
router.delete("/:id", auth, deleteProcedure);

module.exports = router;