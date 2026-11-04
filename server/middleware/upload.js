const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { randomUUID } = require("node:crypto");

// Create uploads folder if it doesn't exist
const pathToUploads = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(pathToUploads)) {
  fs.mkdirSync(pathToUploads, { recursive: true });
}


// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pathToUploads);
  },


  filename: (req, file, cb) => {
    const extensions = { "image/jpeg": ".jpg", "image/jpg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
    cb(null, `avatar-${randomUUID()}${extensions[file.mimetype]}`);
  },
});

// Allow only images
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
});

module.exports = upload;

