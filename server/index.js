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
const facilityRoutes = require("./routes/facilityRoutes");

const app = express();
app.disable("x-powered-by");
// Set only to the actual proxy hop count when deployed behind a trusted proxy.
if (process.env.TRUST_PROXY_HOPS) app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS));

app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb", parameterLimit: 100 }));
app.use(require("./middleware/inputGuard"));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (req.path.startsWith("/api/")) res.setHeader("Cache-Control", "no-store");
  next();
});
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
app.use("/api/facilities", facilityRoutes);

app.get("/", (req, res) => {
  res.json({ message: "NurseTrack API Running" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
