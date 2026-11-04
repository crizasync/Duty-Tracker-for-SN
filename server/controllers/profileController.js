const pool = require("../config/db");
const fs = require("node:fs/promises");

// GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, full_name, username, phone_number, avatar_url, created_at
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
    }


    let query;
    let values;

    // Update with avatar
    if (avatarUrl) {
      const image = await fs.readFile(req.file.path);
      query = `
        WITH saved_image AS (
          INSERT INTO profile_images (user_id, filename, content_type, image_data)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (user_id) DO UPDATE SET
            filename = EXCLUDED.filename,
            content_type = EXCLUDED.content_type,
            image_data = EXCLUDED.image_data,
            updated_at = NOW()
          RETURNING filename
        )
        UPDATE users
        SET
          full_name = $5,
          phone_number = $6,
          avatar_url = '/uploads/' || (SELECT filename FROM saved_image)
        WHERE id = $7
        RETURNING
          id,
          full_name,
          username,
          phone_number,
          avatar_url,
          created_at
      `;

      values = [
        String(userId),
        req.file.filename,
        req.file.mimetype === "image/jpg" ? "image/jpeg" : req.file.mimetype,
        image,
        fullName,
        phoneNumber,
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
          username,
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
  } finally {
    // The uploaded temporary file is no longer needed after the database write.
    if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
  }
};
