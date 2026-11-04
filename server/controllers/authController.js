const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dummyHash = bcrypt.hashSync("unmatchable-placeholder-password", 12);

// REGISTER
exports.register = async (req, res) => {
  try {
    const { fullName, password, username } = req.body || {};
    const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";

    if (!/^[a-z0-9_.-]{3,50}$/.test(normalizedUsername)) {
      return res.status(400).json({
        success: false,
        message: "Username must be 3–50 letters, numbers, dots, underscores, or hyphens",
      });
    }

    if (typeof fullName !== "string" || !fullName.trim() || fullName.length > 150 ||
        typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ success: false, message: "Provide a name (up to 150 characters) and a password of at least 8 characters." });
    }
    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({ success: false, message: "Password is too long. Please choose a shorter password." });
    }

    // Check if user exists
    const userCheck = await pool.query(
      "SELECT username FROM users WHERE LOWER(username) = $1",
      [normalizedUsername]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await pool.query(
      `INSERT INTO users (full_name, password, username)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, username`,
      [fullName, hashedPassword, normalizedUsername]
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: newUser.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ success: false, message: "Username already exists" });
    }
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== "string" || !/^[a-z0-9_.-]{3,50}$/i.test(username.trim()) || typeof password !== "string" || !password || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // Find user
    const user = await pool.query(
      "SELECT * FROM users WHERE LOWER(username) = $1",
      [username.trim().toLowerCase()]
    );

    if (user.rows.length === 0) {
      await bcrypt.compare(password, dummyHash);
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const foundUser = user.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, foundUser.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: foundUser.id,
        username: foundUser.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d", algorithm: "HS256" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: foundUser.id,
        full_name: foundUser.full_name,
        username: foundUser.username,
        avatar_url: foundUser.avatar_url,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
