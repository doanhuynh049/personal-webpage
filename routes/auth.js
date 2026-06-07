const express = require("express");
const { verifyPassword } = require("../db/auth-helper");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/login", (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).json({ error: "ADMIN_PASSWORD is not configured on the server" });
  }
  if (verifyPassword(password)) {
    req.session.authenticated = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "Invalid password" });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/check", (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

router.put("/password", requireAuth, (_req, res) => {
  res.status(400).json({
    error: "Password is set via ADMIN_PASSWORD in .env (local) or Vercel environment variables (production).",
  });
});

module.exports = router;
