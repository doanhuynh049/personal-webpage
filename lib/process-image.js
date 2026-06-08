const fs = require("fs");
const path = require("path");
const heicConvert = require("heic-convert");
const { getUploadDir } = require("../config/paths");
const { mimeFromFilename } = require("./upload-storage");

const HEIC_EXT = new Set([".heic", ".heif"]);

function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildStandardFilename({ country, sequence, ext = ".jpg" }) {
  const date = new Date().toISOString().slice(0, 10);
  const base = country ? slugify(country) || "travel" : "photo";
  const seq = String(sequence).padStart(3, "0");
  return `${base}-${date}-${seq}${ext}`;
}

function buildDefaultCaption({ country, filename }) {
  if (country && String(country).trim()) {
    return String(country).trim();
  }
  const stem = path.basename(filename, path.extname(filename)).replace(/-/g, " ");
  return stem.replace(/\b\w/g, (c) => c.toUpperCase());
}

function isHeicFile(originalName, mimetype) {
  const ext = path.extname(originalName || "").toLowerCase();
  if (HEIC_EXT.has(ext)) return true;
  return !!(mimetype && /heic|heif/i.test(mimetype));
}

async function normalizeUploadFile(file, options = {}) {
  const uploadDir = getUploadDir();
  const inputPath = path.join(uploadDir, file.filename);
  const originalName = file.originalname || file.filename;
  const heic = isHeicFile(originalName, file.mimetype);

  let buffer;
  let outExt = ".jpg";

  if (heic) {
    const input = fs.readFileSync(inputPath);
    const converted = await heicConvert({
      buffer: input,
      format: "JPEG",
      quality: 0.92,
    });
    buffer = Buffer.from(converted);
    outExt = ".jpg";
  } else {
    buffer = fs.readFileSync(inputPath);
    const ext = path.extname(originalName).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext)) {
      outExt = ext === ".jpeg" ? ".jpg" : ext;
    }
  }

  const newFilename = buildStandardFilename({
    country: options.country,
    sequence: options.sequence ?? Date.now() % 10000,
    ext: outExt,
  });
  const outputPath = path.join(uploadDir, newFilename);

  fs.writeFileSync(outputPath, buffer);
  if (inputPath !== outputPath && fs.existsSync(inputPath)) {
    fs.unlinkSync(inputPath);
  }

  const caption = options.caption?.trim() || "";
  const alt_text =
    options.alt_text?.trim() ||
    (caption ? caption : buildDefaultCaption({ country: options.country, filename: newFilename }));

  return {
    filename: newFilename,
    buffer,
    mime: mimeFromFilename(newFilename),
    caption,
    alt_text,
  };
}

module.exports = {
  normalizeUploadFile,
  buildStandardFilename,
  buildDefaultCaption,
  isHeicFile,
};
