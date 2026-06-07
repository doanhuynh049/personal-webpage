const path = require("path");
const os = require("os");
const fs = require("fs");

const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION);

function getUploadDir() {
  const dir = isServerless
    ? path.join(os.tmpdir(), "uploads")
    : path.join(__dirname, "..", "public", "uploads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

module.exports = { isServerless, getUploadDir };
