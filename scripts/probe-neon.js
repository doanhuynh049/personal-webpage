#!/usr/bin/env node
/**
 * Probe Neon only (ignores RUNTIME_DATABASE_URL). Exit 0 if Node can reach Neon.
 */
require("dotenv").config();

const dns = require("dns");
const ws = require("ws");
const { Pool } = require("pg");
const { neon, neonConfig } = require("@neondatabase/serverless");
const {
  resolveDatabaseUrl,
  getDbDriver,
  isNeonDatabase,
} = require("../lib/database-url");

dns.setDefaultResultOrder("ipv4first");
neonConfig.webSocketConstructor = ws;

async function probeHttp(url) {
  const sql = neon(url);
  await sql`SELECT 1`;
  return true;
}

async function probePg(url) {
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 8000,
    ssl: isLocal ? false : { rejectUnauthorized: true },
  });
  try {
    await pool.query("SELECT 1");
    return true;
  } finally {
    await pool.end().catch(() => {});
  }
}

async function main() {
  const url = resolveDatabaseUrl();
  if (!isNeonDatabase(url)) {
    console.log("[probe-neon] Not Neon — skip");
    process.exit(0);
  }

  const driver = getDbDriver();
  const attempts = driver === "http" ? [probeHttp, probePg] : [probePg, probeHttp];
  const errors = [];

  for (const fn of attempts) {
    try {
      await fn(url);
      console.log(`[probe-neon] OK via ${fn.name}`);
      process.exit(0);
    } catch (e) {
      errors.push(`${fn.name}: ${e.message || e.code || "failed"}`);
    }
  }

  console.error("[probe-neon] FAIL\n ", errors.join("\n  "));
  process.exit(1);
}

main();
