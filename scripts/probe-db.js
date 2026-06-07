#!/usr/bin/env node
require("dotenv").config();

const { ensureConnected, formatDbError } = require("../lib/db-connect");

ensureConnected()
  .then(({ driver }) => {
    console.log(`OK — connected via ${driver}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("FAIL —", err.message || formatDbError(err));
    process.exit(1);
  });
