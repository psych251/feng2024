#!/usr/bin/env node
/*
 * Put an exported trials.csv into the same columns, in the same order, as the lite pilot export.
 *
 *   node scripts/match-trials.js
 *   node scripts/match-trials.js --in data/raw/feng2024-lite-bots/trials.csv --out data/raw/feng2024-lite-bots/trials_matched.csv
 *   node scripts/match-trials.js --ref data/raw/feng2024-lite-pilot-a/trials.csv   (take the column order from a real export)
 *   node scripts/match-trials.js --exact                                           (drop columns the pilot does not have)
 *
 * Why: `npm run export` puts 8 fixed columns first and then the rest in the order they first
 * appear. Bot sessions carry extra columns (simulated, bot, bot_key, ...), so their export comes
 * out in a slightly different order. This script writes the pilot's 51 columns first, in the
 * pilot's order, then any extra columns at the end (or drops them with --exact). Cell values are
 * copied unchanged and quoted exactly as the export quotes them. The input file is not modified.
 */
const fs = require("fs");
const path = require("path");

// Column order of the lite pilot export (data/raw/feng2024-lite-pilot-a/trials.csv).
const PILOT_COLUMNS = [
  "participant_id", "trial_index", "task", "condition", "trial_type", "rt", "response", "time_elapsed",
  "stimulus", "plugin_version", "experiment_id", "design", "risky_start_side", "consented", "page_set",
  "view_history", "plays", "quiet_position", "antiphase_position", "answer", "correct", "replays",
  "headphone_passed", "headphone_correct", "check_phase", "common_side", "rare_sequence", "trial_number",
  "block12", "side_block", "option_type", "certain", "gamble_win", "gamble_loss", "multiplier", "sequence",
  "rare", "deviant", "risky_side", "rt_key_duration", "audio_ok", "audio_state", "audio_base_latency",
  "audio_output_latency", "chosen_side", "chose_risky", "stay", "points_before", "gamble_won", "outcome",
  "points_after",
];

function arg(name, fallback) {
  const i = process.argv.indexOf("--" + name);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : fallback;
}
const IN = arg("in", path.join("data", "raw", "feng2024-lite-bots", "trials.csv"));
const OUT = arg("out", path.join(path.dirname(IN), "trials_matched.csv"));
const REF = arg("ref", null);
const EXACT = process.argv.includes("--exact");

// RFC 4180 CSV: quoted fields may contain commas, quotes ("") and newlines.
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", i = 0, quoted = false;
  while (i < text.length) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i += 2; continue; }
        quoted = false; i++; continue;
      }
      cell += ch; i++; continue;
    }
    if (ch === '"') { quoted = true; i++; continue; }
    if (ch === ",") { row.push(cell); cell = ""; i++; continue; }
    if (ch === "\n" || ch === "\r") {
      row.push(cell); rows.push(row); row = []; cell = "";
      i += ch === "\r" && text[i + 1] === "\n" ? 2 : 1;
      continue;
    }
    cell += ch; i++;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
// Same quoting rule as scripts/export.js.
const cell = (s) => (/[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s);

function fail(msg) { console.error("match-trials: " + msg); process.exit(1); }
if (!fs.existsSync(IN)) fail(`cannot find ${IN}. Export first: npm run export -- --experiment feng2024-lite-bots`);
if (path.resolve(IN) === path.resolve(OUT)) fail("--out must be a different file from --in");

let target = PILOT_COLUMNS;
if (REF) {
  if (!fs.existsSync(REF)) fail(`cannot find --ref ${REF}`);
  const firstLine = parseCsv(fs.readFileSync(REF, "utf8").split(/\r?\n/)[0])[0];
  target = firstLine;
}

const table = parseCsv(fs.readFileSync(IN, "utf8"));
const header = table[0];
const body = table.slice(1).filter((r) => !(r.length === 1 && r[0] === ""));
const bad = body.findIndex((r) => r.length !== header.length);
if (bad >= 0) fail(`row ${bad + 2} has ${body[bad].length} cells but the header has ${header.length}`);

const index = Object.fromEntries(header.map((c, k) => [c, k]));
const missing = target.filter((c) => !(c in index));
const extra = header.filter((c) => !target.includes(c));
const cols = EXACT ? target : [...target, ...extra];

const lines = [cols.map(cell).join(",")];
for (const r of body) lines.push(cols.map((c) => (c in index ? cell(r[index[c]]) : "")).join(","));
fs.writeFileSync(OUT, lines.join("\n") + "\n");

const ids = new Set(body.map((r) => r[index.participant_id]));
const exp = {};
if ("experiment_id" in index) for (const r of body) exp[r[index.experiment_id]] = (exp[r[index.experiment_id]] || 0) + 1;
console.log(`Wrote ${OUT}`);
console.log(`  ${body.length} rows, ${ids.size} participants, ${cols.length} columns`);
console.log(`  first ${target.length} columns match the ${REF ? "reference file" : "lite pilot export"}, in the same order`);
if (missing.length) console.log(`  not in this export (left blank): ${missing.join(", ")}`);
if (extra.length) console.log(EXACT ? `  dropped (--exact): ${extra.join(", ")}` : `  extra columns moved to the end: ${extra.join(", ")}`);
console.log(`  experiment_id: ${Object.entries(exp).map(([k, n]) => `${k || "(blank)"} (${n} rows)`).join(", ")}`);
