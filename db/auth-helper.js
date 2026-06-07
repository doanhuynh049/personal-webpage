const crypto = require("crypto");

function getEnvPassword() {
  const raw = process.env.ADMIN_PASSWORD;
  if (!raw) return null;
  return raw.replace(/^["']|["']$/g, "");
}

function verifyPassword(password) {
  const envPassword = getEnvPassword();
  if (!envPassword || !password) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(envPassword);
  if (a.length !== b.length) return false;

  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

module.exports = { getEnvPassword, verifyPassword };
