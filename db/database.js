const useSqlite = process.env.USE_SQLITE === "1" || process.env.USE_SQLITE === "true";

if (useSqlite) {
  console.log("Using local SQLite (USE_SQLITE=1). Set DATABASE_URL on Vercel for production.");
  module.exports = require("./sqlite");
} else {
  module.exports = require("./postgres");
}
