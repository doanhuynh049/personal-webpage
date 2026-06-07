function resolveDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  return normalizeDatabaseUrl(url);
}

/** Runtime override — local Docker when Node cannot reach Neon (see start.sh). */
function resolveRuntimeDatabaseUrl() {
  const runtime =
    process.env.RUNTIME_DATABASE_URL?.trim() ||
    process.env.LOCAL_DATABASE_URL?.trim();
  if (runtime) return normalizeDatabaseUrl(runtime);
  return resolveDatabaseUrl();
}

function isNeonDatabase(url) {
  return url.includes("neon.tech");
}

function normalizeDatabaseUrl(url) {
  if (!url) return url;

  try {
    const parsed = new URL(url.replace(/&channel_binding=require/g, ""));

    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return parsed.toString();
    }

    const sslmode = parsed.searchParams.get("sslmode");

    if (parsed.hostname.includes("neon.tech")) {
      if (sslmode === "require" && !parsed.searchParams.has("uselibpqcompat")) {
        parsed.searchParams.set("uselibpqcompat", "true");
      }
      if (!parsed.searchParams.has("connect_timeout")) {
        parsed.searchParams.set("connect_timeout", "8");
      }
      return parsed.toString();
    }

    if (sslmode === "require" && !parsed.searchParams.has("uselibpqcompat")) {
      parsed.searchParams.set("uselibpqcompat", "true");
    }

    return parsed.toString();
  } catch {
    return url.replace(/&channel_binding=require/g, "");
  }
}

/** Same semantics as stock-webpage: http = Neon HTTPS, pg = TCP, auto = http for Neon locally. */
function getDbDriver() {
  const runtime = resolveRuntimeDatabaseUrl();
  if (runtime.includes("localhost") || runtime.includes("127.0.0.1")) {
    return "pg";
  }
  if (process.env.VERCEL === "1") return "http";
  const raw = (process.env.DB_DRIVER || "http").toLowerCase();
  if (raw === "http" || raw === "serverless") return "http";
  if (raw === "pg" || raw === "tcp") return "pg";
  return isNeonDatabase(runtime) ? "http" : "pg";
}

function usePgDriver() {
  return getDbDriver() === "pg";
}

module.exports = {
  resolveDatabaseUrl,
  resolveRuntimeDatabaseUrl,
  normalizeDatabaseUrl,
  isNeonDatabase,
  getDbDriver,
  usePgDriver,
};
