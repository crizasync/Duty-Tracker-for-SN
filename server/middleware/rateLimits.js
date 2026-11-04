const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const base = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
};

exports.loginIpLimit = rateLimit({ ...base, limit: 50 });
exports.loginAccountLimit = rateLimit({
  ...base,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: req => `${ipKeyGenerator(req.ip)}:${typeof req.body?.username === "string" ? req.body.username.trim().toLowerCase().slice(0, 50) : "invalid"}`,
});
