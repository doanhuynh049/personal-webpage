const express = require("express");
const fs = require("fs");
const path = require("path");
const { db, getPublicContent } = require("../db/database");
const { requireAuth } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const router = express.Router();

router.get("/content", (_req, res) => {
  res.json(getPublicContent());
});

router.put("/profile", requireAuth, (req, res) => {
  const { name, greeting, tagline, intro, profile_image } = req.body;
  db.prepare(`
    UPDATE profile SET name = ?, greeting = ?, tagline = ?, intro = ?, profile_image = ?
    WHERE id = 1
  `).run(name, greeting, tagline, intro, profile_image);
  res.json({ ok: true });
});

router.put("/about", requireAuth, (req, res) => {
  const { heading, bio, location, focus, currently } = req.body;
  db.prepare(`
    UPDATE about SET heading = ?, bio = ?, location = ?, focus = ?, currently = ?
    WHERE id = 1
  `).run(heading, bio, location, focus, currently);
  res.json({ ok: true });
});

router.put("/sections/:key", requireAuth, (req, res) => {
  const { label, heading, description } = req.body;
  db.prepare(`
    UPDATE sections SET label = ?, heading = ?, description = ?
    WHERE key = ?
  `).run(label, heading, description, req.params.key);
  res.json({ ok: true });
});

router.post("/education", requireAuth, (req, res) => {
  const { period, title, institution, description, sort_order } = req.body;
  const result = db.prepare(`
    INSERT INTO education (period, title, institution, description, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).run(period, title, institution, description, sort_order ?? 0);
  res.json({ id: result.lastInsertRowid });
});

router.put("/education/:id", requireAuth, (req, res) => {
  const { period, title, institution, description, sort_order } = req.body;
  db.prepare(`
    UPDATE education SET period = ?, title = ?, institution = ?, description = ?, sort_order = ?
    WHERE id = ?
  `).run(period, title, institution, description, sort_order ?? 0, req.params.id);
  res.json({ ok: true });
});

router.delete("/education/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM education WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

router.post("/jobs", requireAuth, (req, res) => {
  const { period, title, company, description, sort_order } = req.body;
  const result = db.prepare(`
    INSERT INTO jobs (period, title, company, description, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).run(period, title, company, description, sort_order ?? 0);
  res.json({ id: result.lastInsertRowid });
});

router.put("/jobs/:id", requireAuth, (req, res) => {
  const { period, title, company, description, sort_order } = req.body;
  db.prepare(`
    UPDATE jobs SET period = ?, title = ?, company = ?, description = ?, sort_order = ?
    WHERE id = ?
  `).run(period, title, company, description, sort_order ?? 0, req.params.id);
  res.json({ ok: true });
});

router.delete("/jobs/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM jobs WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

router.post("/experiences", requireAuth, (req, res) => {
  const { title, description, is_skills, sort_order } = req.body;
  const result = db.prepare(`
    INSERT INTO experiences (title, description, is_skills, sort_order)
    VALUES (?, ?, ?, ?)
  `).run(title, description, is_skills ? 1 : 0, sort_order ?? 0);
  res.json({ id: result.lastInsertRowid });
});

router.put("/experiences/:id", requireAuth, (req, res) => {
  const { title, description, is_skills, sort_order } = req.body;
  db.prepare(`
    UPDATE experiences SET title = ?, description = ?, is_skills = ?, sort_order = ?
    WHERE id = ?
  `).run(title, description, is_skills ? 1 : 0, sort_order ?? 0, req.params.id);
  res.json({ ok: true });
});

router.delete("/experiences/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM experiences WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

router.post("/experiences/:id/skills", requireAuth, (req, res) => {
  const { name } = req.body;
  const result = db.prepare("INSERT INTO skills (experience_id, name) VALUES (?, ?)").run(req.params.id, name);
  res.json({ id: result.lastInsertRowid });
});

router.delete("/skills/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM skills WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

router.post("/gallery", requireAuth, (req, res) => {
  const { image_path, caption, alt_text, layout, sort_order } = req.body;
  const result = db.prepare(`
    INSERT INTO gallery (image_path, caption, alt_text, layout, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).run(image_path, caption, alt_text, layout || "normal", sort_order ?? 0);
  res.json({ id: result.lastInsertRowid });
});

router.put("/gallery/:id", requireAuth, (req, res) => {
  const { image_path, caption, alt_text, layout, sort_order } = req.body;
  db.prepare(`
    UPDATE gallery SET image_path = ?, caption = ?, alt_text = ?, layout = ?, sort_order = ?
    WHERE id = ?
  `).run(image_path, caption, alt_text, layout || "normal", sort_order ?? 0, req.params.id);
  res.json({ ok: true });
});

router.delete("/gallery/:id", requireAuth, (req, res) => {
  const item = db.prepare("SELECT image_path FROM gallery WHERE id = ?").get(req.params.id);
  if (item && item.image_path.startsWith("/uploads/")) {
    const filePath = path.join(__dirname, "..", "public", item.image_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.prepare("DELETE FROM gallery WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

router.post("/contacts", requireAuth, (req, res) => {
  const { label, value, url, sort_order } = req.body;
  const result = db.prepare(`
    INSERT INTO contacts (label, value, url, sort_order) VALUES (?, ?, ?, ?)
  `).run(label, value, url, sort_order ?? 0);
  res.json({ id: result.lastInsertRowid });
});

router.put("/contacts/:id", requireAuth, (req, res) => {
  const { label, value, url, sort_order } = req.body;
  db.prepare(`
    UPDATE contacts SET label = ?, value = ?, url = ?, sort_order = ?
    WHERE id = ?
  `).run(label, value, url, sort_order ?? 0, req.params.id);
  res.json({ ok: true });
});

router.delete("/contacts/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM contacts WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

router.post("/upload", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({ path: `/uploads/${req.file.filename}` });
});

module.exports = router;
