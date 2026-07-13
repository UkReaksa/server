// src/middlewares/upload.middleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// make sure uploads/avatars folder exists
const uploadDir = path.join(__dirname, "../../uploads/avatars");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `avatar_${req.params.id}_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("Only jpg, jpeg, png, webp allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2000 * 1024 * 1024 }, // 2MB max
});

module.exports = upload;
