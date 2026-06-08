const multer = require("multer");
const path = require("path");
const { getUploadDir } = require("../config/paths");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, getUploadDir()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".heic", ".heif"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext) || /heic|heif/i.test(file.mimetype || "")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (JPG, PNG, WebP, GIF, SVG, HEIC)"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = { upload, getUploadDir };
