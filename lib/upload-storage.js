const fs = require("fs");
const path = require("path");
const { getUploadDir } = require("../config/paths");
const { getSql } = require("../db/database");

function mimeFromFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };
  return map[ext] || "application/octet-stream";
}

async function persistUploadFile({ filename, buffer, mime }) {
  const filePath = path.join(getUploadDir(), filename);
  fs.writeFileSync(filePath, buffer);
  const sql = getSql();

  await sql`
    INSERT INTO upload_files (filename, data, mime_type)
    VALUES (${filename}, ${buffer}, ${mime || mimeFromFilename(filename)})
    ON CONFLICT (filename) DO UPDATE SET
      data = EXCLUDED.data,
      mime_type = EXCLUDED.mime_type
  `;

  return `/uploads/${filename}`;
}

async function persistUpload(file) {
  const filePath = path.join(getUploadDir(), file.filename);
  const data = fs.readFileSync(filePath);
  const mime = file.mimetype || mimeFromFilename(file.filename);
  return persistUploadFile({ filename: file.filename, buffer: data, mime });
}

async function readUpload(filename) {
  const safeName = path.basename(filename);
  const filePath = path.join(getUploadDir(), safeName);

  if (fs.existsSync(filePath)) {
    return {
      buffer: fs.readFileSync(filePath),
      mime: mimeFromFilename(safeName),
      source: "disk",
    };
  }

  const sql = getSql();
  const rows = await sql`
    SELECT data, mime_type FROM upload_files WHERE filename = ${safeName}
  `;
  if (!rows.length) return null;

  const raw = rows[0].data;
  return {
    buffer: Buffer.isBuffer(raw) ? raw : Buffer.from(raw),
    mime: rows[0].mime_type || mimeFromFilename(safeName),
    source: "db",
  };
}

module.exports = { persistUpload, persistUploadFile, readUpload, mimeFromFilename };
