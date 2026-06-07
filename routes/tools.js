const express = require("express");
const { getPublicContent } = require("../db/database");
const { generateResumePdf } = require("../lib/generateResumePdf");
const { suggestWithAI } = require("../lib/ai-suggest");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/resume.pdf", async (req, res, next) => {
  try {
    const data = await getPublicContent();
    const pdf = await generateResumePdf(data);
    const filename = `${(data.profile.name || "resume").replace(/\s+/g, "_")}_Resume.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
});

router.post("/ai/suggest", requireAuth, async (req, res, next) => {
  try {
    const { section, field, currentText, context } = req.body;
    const result = await suggestWithAI({ section, field, currentText, context });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
