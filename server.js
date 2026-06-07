require("dotenv").config();

const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const path = require("path");
const { initDb } = require("./db/database");
const { getUploadDir } = require("./config/paths");
const { ensureConnected, getPgPool } = require("./lib/db-connect");

const app = express();
const PORT = process.env.PORT || 8637;

if (process.env.VERCEL === "1") {
  app.set("trust proxy", 1);
}

function buildSessionOptions() {
  const options = {
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
      secure: process.env.VERCEL === "1",
    },
  };

  const pool = getPgPool();
  if (pool) {
    options.store = new pgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    });
  }

  return options;
}

const setupPromise = (async () => {
  await initDb();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(session(buildSessionOptions()));

  app.use("/api/auth", require("./routes/auth"));
  app.use("/api", require("./routes/content"));
  app.use("/api", require("./routes/tools"));

  app.use(express.static(path.join(__dirname, "public")));
  app.use("/uploads", express.static(getUploadDir()));

  const faviconPath = path.join(__dirname, "public", "favicon.svg");
  app.get(["/favicon.ico", "/favicon.svg"], (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=604800");
    res.type("image/svg+xml");
    res.sendFile(faviconPath);
  });

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
})();

app.use(async (req, res, next) => {
  try {
    await setupPromise;
    next();
  } catch (err) {
    console.error("Database unavailable:", err.message || err.code || err);
    if (!res.headersSent) {
      res.status(503).json({ error: err.message || "Database unavailable" });
    }
  }
});

module.exports = app;

if (require.main === module && !process.env.VERCEL) {
  setupPromise
    .then(() => {
      const server = app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(`Admin panel at http://localhost:${PORT}/admin`);
        console.log(`Admin password: set via ADMIN_PASSWORD in .env`);
      });
      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.error(
            `Port ${PORT} is already in use. Stop the other process or run: PORT=${Number(PORT) + 1} ./start.sh`
          );
        } else {
          console.error("Server error:", err.message || err);
        }
        process.exit(1);
      });
    })
    .catch((err) => {
      const detail = [err.code, err.message, err.cause?.code, err.cause?.message]
        .filter(Boolean)
        .join(" — ");
      console.error("Failed to start:", detail || err);
      process.exit(1);
    });
}
