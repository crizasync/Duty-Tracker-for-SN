const pool = require("../config/db");

// GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, full_name, email, phone_number, avatar_url, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    res.json({
      success: true,
      profile: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, phoneNumber } = req.body;

    let avatarUrl = null;

    // If a new image was uploaded
    if (req.file) {
      avatarUrl = `/uploads/${req.file.filename}`;
    } else {
      console.log("updateProfile: req.file is missing (no avatar uploaded)");
    }


    let query;
    let values;

    // Update with avatar
    if (avatarUrl) {
      query = `
        UPDATE users
        SET
          full_name = $1,
          phone_number = $2,
          avatar_url = $3
        WHERE id = $4
        RETURNING
          id,
          full_name,
          email,
          phone_number,
          avatar_url,
          created_at
      `;

      values = [
        fullName,
        phoneNumber,
        avatarUrl,
        userId,
      ];
    } else {
      // Update without changing avatar
      query = `
        UPDATE users
        SET
          full_name = $1,
          phone_number = $2
        WHERE id = $3
        RETURNING
          id,
          full_name,
          email,
          phone_number,
          avatar_url,
          created_at
      `;

      values = [
        fullName,
        phoneNumber,
        userId,
      ];
    }

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: "Profile updated successfully",
      profile: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};