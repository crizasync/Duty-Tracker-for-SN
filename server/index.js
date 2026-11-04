
require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const dutyLogRoutes = require("./routes/dutyLogRoutes");
const procedureRoutes = require("./routes/procedureRoutes");
const reflectionRoutes = require("./routes/reflectionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
const facilityRoutes = require("./routes/facilityRoutes");

// ==========================================
// INITIALIZE EXPRESS
// ==========================================
const app = express();

app.disable("x-powered-by");

// Trust proxy only when explicitly configured
if (process.env.TRUST_PROXY_HOPS) {
  app.set(
    "trust proxy",
    Number(process.env.TRUST_PROXY_HOPS)
  );
}

// ==========================================
// CORS CONFIGURATION
// ==========================================
app.use(cors(require("./config/cors").corsOptions(process.env.CLIENT_URL)));

// ==========================================
// REQUEST BODY PARSING
// ==========================================
app.use(
  express.json({
    limit: "100kb",
  })
);

app.use(
  express.urlencoded({
    extended: false,
    limit: "100kb",
    parameterLimit: 100,
  })
);

// ==========================================
// INPUT VALIDATION / PROTECTION
// ==========================================
app.use(require("./middleware/inputGuard"));

// ==========================================
// SECURITY HEADERS
// ==========================================
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");

  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store");
  }

  next();
});

// ==========================================
// UPLOADED AVATARS
// ==========================================
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ==========================================
// API ROUTES
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/duty-logs", dutyLogRoutes);
app.use("/api/procedures", procedureRoutes);
app.use("/api/reflections", reflectionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/facilities", facilityRoutes);

// ==========================================
// ROOT ENDPOINT
// ==========================================
app.get("/", (req, res) => {
  res.status(200).json({
    message: "NurseTrack API Running",
    status: "OK",
  });
});

// ==========================================
// HEALTH CHECK ENDPOINT
// ==========================================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Duty-Tracker backend is running",
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 404 HANDLER
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ==========================================
// ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
