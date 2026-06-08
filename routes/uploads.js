const express = require("express");
const { readUpload } = require("../lib/upload-storage");

const router = express.Router();

router.get("/:filename", async (req, res, next) => {
  try {
    const file = await readUpload(req.params.filename);
    if (!file) {
      return res.status(404).type("text/plain").send("Image not found");
    }
    res.type(file.mime);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(file.buffer);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
