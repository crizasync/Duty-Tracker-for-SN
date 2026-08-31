require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const dutyLogRoutes = require("./routes/dutyLogRoutes");
const procedureRoutes = require("./routes/procedureRoutes");
const reflectionRoutes = require("./routes/reflectionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve uploaded avatars from the same folder multer writes to: server/uploads
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);


app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/duty-logs", dutyLogRoutes);
app.use("/api/procedures", procedureRoutes);
app.use("/api/reflections", reflectionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);

app.get("/", (req, res) => {
  res.json({ message: "NurseTrack API Running" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});