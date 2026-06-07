require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");
const { initDb } = require("./db/database");
const authRoutes = require("./routes/auth");
const contentRoutes = require("./routes/content");

const app = express();
const PORT = process.env.PORT || 8637;
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

initDb(adminPassword);

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
  },
}));

app.use("/api/auth", authRoutes);
app.use("/api", contentRoutes);

app.use(express.static(path.join(__dirname, "public")));

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

// Start server locally; export app for Vercel serverless
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin panel at http://localhost:${PORT}/admin`);
    console.log(`Default password: ${adminPassword}`);
  });
}
