const multer = require("multer");
const path = require("path");
const fs = require("fs");

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
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${Date.now()}${ext}`);
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
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

module.exports = upload;

