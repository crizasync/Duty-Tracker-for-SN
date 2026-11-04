const pool = require("../config/db");

exports.getAvatar = async (req, res, next) => {
  if (!/^avatar-[a-z0-9-]+\.(png|jpe?g|webp)$/i.test(req.params.filename)) return next();
  try {
    const result = await pool.query("SELECT image_data, content_type FROM profile_images WHERE filename = $1", [req.params.filename]);
    const image = result.rows[0];
    if (!image) return next(); // Preserve older uploads still available on disk.
    res.setHeader("Content-Type", image.content_type);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(image.image_data);
  } catch (error) {
    if (error.code === "42P01") return next(); // Legacy images work before migration.
    next(error);
  }
};
