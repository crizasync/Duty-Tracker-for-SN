const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (typeof authHeader !== "string" || !/^Bearer \S+$/i.test(authHeader)) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (!decoded || typeof decoded !== "object" || !/^[1-9]\d*$/.test(String(decoded.id))) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};
