const express = require("express");
const { verifyPassword, updatePassword } = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/login", (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
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

router.put("/password", requireAuth, (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  updatePassword(password);
  res.json({ ok: true });
});

module.exports = router;
