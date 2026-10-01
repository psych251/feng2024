#!/usr/bin/env node
/*
 * Runs before `npm test`. Playwright needs a Chromium binary, and `npm install` does not
 * fetch one, so on a fresh clone the tests would otherwise fail with a confusing
 * "Executable doesn't exist" error. This checks for a usable browser and installs one only
 * if it is missing.
 *
 * Set PLAYWRIGHT_CHROMIUM_PATH to use a browser you already have (some CI images ship one).
 */
const fs = require("fs");
const { execSync } = require("child_process");

function ok(msg) { console.log("[browsers] " + msg); }

const override = process.env.PLAYWRIGHT_CHROMIUM_PATH;
if (override) {
  if (fs.existsSync(override)) { ok("using PLAYWRIGHT_CHROMIUM_PATH=" + override); process.exit(0); }
  console.error("[browsers] PLAYWRIGHT_CHROMIUM_PATH is set to " + override + " but nothing is there.");
  process.exit(1);
}

let installed = false;
try {
  const { chromium } = require("@playwright/test");
  const p = chromium.executablePath();
  installed = !!p && fs.existsSync(p);
} catch (e) {
  installed = false;
}
if (installed) { ok("Chromium is installed."); process.exit(0); }

ok("Chromium is not installed yet; downloading it once (about 150 MB)…");
try {
  execSync("npx --no-install playwright install chromium", { stdio: "inherit" });
  ok("done.");
} catch (e) {
  console.error(
    "\n[browsers] Could not download Chromium.\n" +
    "  Run this yourself, then try again:   npx playwright install chromium\n" +
    "  If you are offline or behind a proxy that blocks the download, point the tests at a\n" +
    "  browser you already have:            PLAYWRIGHT_CHROMIUM_PATH=/path/to/chrome npm test\n"
  );
  process.exit(1);
}
