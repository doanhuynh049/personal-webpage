const dns = require("dns");
const ws = require("ws");
const { Pool } = require("pg");
const { neon, neonConfig } = require("@neondatabase/serverless");
const {
  resolveRuntimeDatabaseUrl,
  getDbDriver,
  isNeonDatabase,
} = require("./database-url");

dns.setDefaultResultOrder("ipv4first");
neonConfig.webSocketConstructor = ws;

let connectionPromise;
let connection;

function formatDbError(err) {
  const parts = [err.code, err.message, err.cause?.code, err.cause?.message].filter(Boolean);
  return parts.join(" — ") || "unknown error";
}

function createPgPoolConfig() {
  const connectionString = resolveRuntimeDatabaseUrl();
  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1");

  return {
    connectionString,
    max: 5,
    connectionTimeoutMillis: 8000,
    keepAlive: true,
    ssl: isLocal ? false : { rejectUnauthorized: true },
    lookup: (hostname, _opts, cb) => dns.lookup(hostname, { family: 4 }, cb),
  };
}

function createPgSql(pgPool) {
  return async function sqlTag(strings, ...values) {
    let text = strings[0];
    for (let i = 0; i < values.length; i++) {
      text += `$${i + 1}` + strings[i + 1];
    }
    const { rows } = await pgPool.query(text, values);
    return rows;
  };
}

async function openPgPool() {
  const pgPool = new Pool(createPgPoolConfig());
  try {
    await pgPool.query("SELECT 1");
    return pgPool;
  } catch (err) {
    await pgPool.end().catch(() => {});
    throw err;
  }
}

async function openServerlessSql() {
  const connectionString = resolveRuntimeDatabaseUrl();
  if (!isNeonDatabase(connectionString)) {
    throw new Error("Neon HTTP driver requires a neon.tech DATABASE_URL");
  }
  const sqlFn = neon(connectionString);
  await sqlFn`SELECT 1`;
  return sqlFn;
}

async function tryPgConnection() {
  const pgPool = await openPgPool();
  return { driver: "pg", sql: createPgSql(pgPool), pool: pgPool };
}

async function tryHttpConnection() {
  const sqlFn = await openServerlessSql();
  return { driver: "http", sql: sqlFn, pool: null };
}

async function connectDatabase() {
  const driverPref = getDbDriver();
  const errors = [];

  const runtimeUrl = resolveRuntimeDatabaseUrl();
  const isLocal =
    runtimeUrl.includes("localhost") || runtimeUrl.includes("127.0.0.1");

  const attempts = isLocal
    ? [tryPgConnection]
    : driverPref === "http"
      ? [tryHttpConnection, tryPgConnection]
      : [tryPgConnection, tryHttpConnection];

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      console.log(
        `Database: connected via ${result.driver === "pg" ? "pg (TCP)" : "Neon HTTP"} → ${new URL(resolveRuntimeDatabaseUrl()).hostname}`
      );

      if (!result.pool && process.env.DATABASE_URL) {
        try {
          result.pool = await openPgPool();
          console.log("Database: pg pool ready for admin sessions");
        } catch (err) {
          if (process.env.VERCEL === "1") {
            errors.push(`session pg: ${formatDbError(err)}`);
            throw buildConnectError(errors);
          }
          console.warn("Database: pg unavailable for sessions — using memory store (local dev only)");
        }
      }

      return result;
    } catch (err) {
      const label = attempt === tryHttpConnection ? "HTTP" : "pg";
      errors.push(`${label}: ${formatDbError(err)}`);
      if (attempts.length === 1) break;
    }
  }

  throw buildConnectError(errors);
}

function buildConnectError(errors) {
  const detail = errors.length ? errors.join("\n  ") : "no connection methods succeeded";
  const usingLocal = resolveRuntimeDatabaseUrl().includes("localhost");
  const hint = usingLocal
    ? "  Local Postgres failed. Run: docker compose up -d db && ./start.sh"
    : "  Node cannot reach Neon from this network (psql may still work).\n" +
      "  Fix: USE_LOCAL_DB=1 ./start.sh  — or set RUNTIME_DATABASE_URL to local Docker in .env";
  return new Error(`Could not connect to database.\n  ${detail}\n${hint}`);
}

async function ensureConnected() {
  if (connection) return connection;
  if (!connectionPromise) connectionPromise = connectDatabase();
  connection = await connectionPromise;
  return connection;
}

function getSql() {
  if (!connection?.sql) {
    throw new Error("Database not connected — call ensureConnected() first");
  }
  return connection.sql;
}

function getPgPool() {
  return connection?.pool || null;
}

function getActiveDriver() {
  return connection?.driver || null;
}

module.exports = {
  ensureConnected,
  getSql,
  getPgPool,
  getActiveDriver,
  createPgPoolConfig,
  formatDbError,
};
