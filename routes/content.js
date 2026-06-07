const express = require("express");
const fs = require("fs");
const path = require("path");
const { getSql, getPublicContent } = require("../db/database");
const { requireAuth } = require("../middleware/auth");
const { upload, getUploadDir } = require("../middleware/upload");

const router = express.Router();

router.get("/content", async (_req, res, next) => {
  try {
    res.json(await getPublicContent());
  } catch (err) {
    next(err);
  }
});

router.put("/profile", requireAuth, async (req, res, next) => {
  try {
    const { name, greeting, tagline, intro, profile_image } = req.body;
    const sql = getSql();
    await sql`
      UPDATE profile SET name = ${name}, greeting = ${greeting}, tagline = ${tagline},
      intro = ${intro}, profile_image = ${profile_image}
      WHERE id = 1
    `;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.put("/about", requireAuth, async (req, res, next) => {
  try {
    const { heading, bio, location, focus, currently } = req.body;
    const sql = getSql();
    await sql`
      UPDATE about SET heading = ${heading}, bio = ${bio}, location = ${location},
      focus = ${focus}, currently = ${currently}
      WHERE id = 1
    `;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.put("/sections/:key", requireAuth, async (req, res, next) => {
  try {
    const { label, heading, description } = req.body;
    const sql = getSql();
    await sql`
      UPDATE sections SET label = ${label}, heading = ${heading}, description = ${description}
      WHERE section_key = ${req.params.key}
    `;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/education", requireAuth, async (req, res, next) => {
  try {
    const { period, title, institution, description, sort_order } = req.body;
    const sql = getSql();
    const rows = await sql`
      INSERT INTO education (period, title, institution, description, sort_order)
      VALUES (${period}, ${title}, ${institution}, ${description}, ${sort_order ?? 0})
      RETURNING id
    `;
    res.json({ id: rows[0].id });
  } catch (err) {
    next(err);
  }
});

router.put("/education/:id", requireAuth, async (req, res, next) => {
  try {
    const { period, title, institution, description, sort_order } = req.body;
    const sql = getSql();
    await sql`
      UPDATE education SET period = ${period}, title = ${title}, institution = ${institution},
      description = ${description}, sort_order = ${sort_order ?? 0}
      WHERE id = ${req.params.id}
    `;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/education/:id", requireAuth, async (req, res, next) => {
  try {
    const sql = getSql();
    await sql`DELETE FROM education WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/jobs", requireAuth, async (req, res, next) => {
  try {
    const { period, title, company, description, sort_order } = req.body;
    const sql = getSql();
    const rows = await sql`
      INSERT INTO jobs (period, title, company, description, sort_order)
      VALUES (${period}, ${title}, ${company}, ${description}, ${sort_order ?? 0})
      RETURNING id
    `;
    res.json({ id: rows[0].id });
  } catch (err) {
    next(err);
  }
});

router.put("/jobs/:id", requireAuth, async (req, res, next) => {
  try {
    const { period, title, company, description, sort_order } = req.body;
    const sql = getSql();
    await sql`
      UPDATE jobs SET period = ${period}, title = ${title}, company = ${company},
      description = ${description}, sort_order = ${sort_order ?? 0}
      WHERE id = ${req.params.id}
    `;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/jobs/:id", requireAuth, async (req, res, next) => {
  try {
    const sql = getSql();
    await sql`DELETE FROM jobs WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/experiences", requireAuth, async (req, res, next) => {
  try {
    const { title, description, is_skills, sort_order } = req.body;
    const sql = getSql();
    const rows = await sql`
      INSERT INTO experiences (title, description, is_skills, sort_order)
      VALUES (${title}, ${description}, ${!!is_skills}, ${sort_order ?? 0})
      RETURNING id
    `;
    res.json({ id: rows[0].id });
  } catch (err) {
    next(err);
  }
});

router.put("/experiences/:id", requireAuth, async (req, res, next) => {
  try {
    const { title, description, is_skills, sort_order } = req.body;
    const sql = getSql();
    await sql`
      UPDATE experiences SET title = ${title}, description = ${description},
      is_skills = ${!!is_skills}, sort_order = ${sort_order ?? 0}
      WHERE id = ${req.params.id}
    `;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/experiences/:id", requireAuth, async (req, res, next) => {
  try {
    const sql = getSql();
    await sql`DELETE FROM experiences WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/experiences/:id/skills", requireAuth, async (req, res, next) => {
  try {
    const { name } = req.body;
    const sql = getSql();
    const rows = await sql`
      INSERT INTO skills (experience_id, name) VALUES (${req.params.id}, ${name})
      RETURNING id
    `;
    res.json({ id: rows[0].id });
  } catch (err) {
    next(err);
  }
});

router.delete("/skills/:id", requireAuth, async (req, res, next) => {
  try {
    const sql = getSql();
    await sql`DELETE FROM skills WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/gallery", requireAuth, async (req, res, next) => {
  try {
    const { image_path, caption, alt_text, layout, sort_order } = req.body;
    const sql = getSql();
    const rows = await sql`
      INSERT INTO gallery (image_path, caption, alt_text, layout, sort_order)
      VALUES (${image_path}, ${caption}, ${alt_text}, ${layout || "normal"}, ${sort_order ?? 0})
      RETURNING id
    `;
    res.json({ id: rows[0].id });
  } catch (err) {
    next(err);
  }
});

router.put("/gallery/:id", requireAuth, async (req, res, next) => {
  try {
    const { image_path, caption, alt_text, layout, sort_order } = req.body;
    const sql = getSql();
    await sql`
      UPDATE gallery SET image_path = ${image_path}, caption = ${caption}, alt_text = ${alt_text},
      layout = ${layout || "normal"}, sort_order = ${sort_order ?? 0}
      WHERE id = ${req.params.id}
    `;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/gallery/:id", requireAuth, async (req, res, next) => {
  try {
    const sql = getSql();
    const rows = await sql`SELECT image_path FROM gallery WHERE id = ${req.params.id}`;
    const item = rows[0];
    if (item && item.image_path.startsWith("/uploads/")) {
      const filePath = path.join(getUploadDir(), path.basename(item.image_path));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await sql`DELETE FROM gallery WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/contacts", requireAuth, async (req, res, next) => {
  try {
    const { label, value, url, sort_order } = req.body;
    const sql = getSql();
    const rows = await sql`
      INSERT INTO contacts (label, value, url, sort_order)
      VALUES (${label}, ${value}, ${url}, ${sort_order ?? 0})
      RETURNING id
    `;
    res.json({ id: rows[0].id });
  } catch (err) {
    next(err);
  }
});

router.put("/contacts/:id", requireAuth, async (req, res, next) => {
  try {
    const { label, value, url, sort_order } = req.body;
    const sql = getSql();
    await sql`
      UPDATE contacts SET label = ${label}, value = ${value}, url = ${url},
      sort_order = ${sort_order ?? 0}
      WHERE id = ${req.params.id}
    `;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/contacts/:id", requireAuth, async (req, res, next) => {
  try {
    const sql = getSql();
    await sql`DELETE FROM contacts WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/upload", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({ path: `/uploads/${req.file.filename}` });
});

module.exports = router;
