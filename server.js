require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");
const { initDb } = require("./db/database");
const { getUploadDir } = require("./config/paths");
const authRoutes = require("./routes/auth");
const contentRoutes = require("./routes/content");

const app = express();
const PORT = process.env.PORT || 8637;

let dbReady = initDb();

app.use(async (req, res, next) => {
  try {
    await dbReady;
    next();
  } catch (err) {
    console.error("Database unavailable:", err.message);
    if (!res.headersSent) {
      const hint = err.message.includes("fetch failed") || err.code === "ETIMEDOUT"
        ? "Cannot reach Neon from this network. For local dev, set USE_SQLITE=1 in .env"
        : "Set DATABASE_URL to your Neon connection string, or USE_SQLITE=1 for local dev.";
      res.status(503).json({ error: `Database unavailable. ${hint}` });
    }
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
    secure: process.env.VERCEL === "1",
  },
}));

app.use("/api/auth", authRoutes);
app.use("/api", contentRoutes);
app.use("/api", require("./routes/tools"));

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(getUploadDir()));

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "index.html"));
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

module.exports = app;

if (require.main === module && !process.env.VERCEL) {
  dbReady.then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Admin panel at http://localhost:${PORT}/admin`);
      console.log(`Admin password: set via ADMIN_PASSWORD in .env`);
    });
  }).catch((err) => {
    console.error("Failed to start:", err.message);
    process.exit(1);
  });
}
