// Tests for the lite version at /lite/. Tests of the shared saving code (chunked writes,
// lost connection, refused writes, security rules, error logging) live in experiment.spec.js,
// which covers the main version; they apply to this folder unchanged.
// End-to-end test: a robot participant runs the whole experiment.
//
// Two modes:
//   - Emulator mode (EMULATOR=1, set automatically by `npm test`): data must land in the
//     local Firestore emulator, the security rules must reject forbidden requests, and
//     client errors must be logged.
//   - Offline mode (plain `npx playwright test`): the experiment must still run to the end
//     and offer the JSON download fallback.
//
// If you change the timeline in experiment.js, update `runThroughExperiment` below so the
// robot still knows which buttons to press. That is a feature: the test documents the flow.

const { test, expect, devices } = require("@playwright/test");

const EMULATOR = process.env.EMULATOR === "1" || !!process.env.FIRESTORE_EMULATOR_HOST;
const PROJECT = "demo-psych251";
const EXPERIMENT_ID = "feng2024-lite-pilot-b";
const FS = `http://localhost:8080/v1/projects/${PROJECT}/databases/(default)/documents`;

// `fast=1` shrinks every timing (localhost only) so 120 trials take seconds, not 15 minutes.
const START = EMULATOR ? "/lite/?emulator=1&fast=1" : "/lite/?fast=1";

async function clickButton(page, name) {
  const b = page.getByRole("button", { name, exact: true });
  await expect(b).toBeEnabled({ timeout: 10000 });
  await b.click();
}

// The robot's choice rule: take the gamble on odd-numbered trials, the sure option on even ones.
const robotTakesGamble = (trial) => trial % 2 === 1;

async function headphoneCheck(page, nWrong) {
  await page.locator("#jspsych-instructions-next").click();
  for (let i = 0; i < 2; i++) {
    const trial = page.locator(".hp-trial");
    await trial.waitFor({ state: "visible" });
    const n = await trial.getAttribute("data-n");
    const correct = Number(await trial.getAttribute("data-correct"));
    const answer = i < nWrong ? (correct % 3) + 1 : correct;
    if (i === 0) {
      // Replay once on the first screen: the button unlocks after the set has played.
      const replay = page.locator(`.hp-trial[data-n="${n}"] .hp-replay`);
      await expect(replay).toBeEnabled({ timeout: 10000 });
      await replay.click();
    }
    await clickButton(page, String(answer));
    await page.locator(`.hp-trial[data-n="${n}"]`).waitFor({ state: "detached" });
  }
}

async function sequenceChecks(page) {
  for (let i = 0; i < 2; i++) {
    const check = page.locator(".seq-check");
    await check.waitFor({ state: "visible" });
    const n = await check.getAttribute("data-n");
    for (const btn of await page.locator(".play-btn").all()) await btn.click();
    const correct = await check.getAttribute("data-correct");
    await clickButton(page, correct === "left" ? "Left" : "Right");
    await page.locator(`.seq-check[data-n="${n}"]`).waitFor({ state: "detached" });
  }
}

async function runUntilDebrief(page) {
  await page.getByRole("button", { name: "I agree to participate" }).click();
  await page.locator("#jspsych-instructions-next").click();              // welcome
  await page.locator('[data-play="cal"]').click();                       // volume calibration
  await clickButton(page, "Continue");
  await headphoneCheck(page, 0);                                         // 2 of 2 right: passes
  for (const btn of await page.locator(".play-btn").all()) await btn.click(); // familiarization
  await clickButton(page, "Continue");
  await page.locator("#jspsych-instructions-next").click();              // check intro
  await sequenceChecks(page);                                            // pre, with feedback
  await page.locator("#jspsych-instructions-next").click();              // task instructions p1
  await page.locator("#jspsych-instructions-next").click();              // task instructions p2

  for (let i = 0; i < 120; i++) {
    const screen = page.locator(".choice-screen");
    await screen.waitFor({ state: "visible", timeout: 10000 });
    const trial = Number(await screen.getAttribute("data-trial"));
    const riskySide = await screen.getAttribute("data-risky-side");
    const side = robotTakesGamble(trial) ? riskySide : (riskySide === "left" ? "right" : "left");
    await page.keyboard.press(side === "left" ? "b" : "n");
    await page.locator(`.choice-screen[data-trial="${trial}"]`).waitFor({ state: "detached" });
  }

  await page.locator("#jspsych-instructions-next").click();              // game complete
  await sequenceChecks(page);                                            // post, no feedback
  await page.locator('input[type="number"]').fill("34");                 // demographics
  await page.getByText("Woman", { exact: true }).click();
  await page.locator('input[value="Continue"]').click();
  await page.locator("textarea").fill("Robot participant says hi.");     // comments
  await page.locator("#jspsych-survey-text-next").click();
}

async function runThroughExperiment(page) {
  await runUntilDebrief(page);
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByText("All done")).toBeVisible({ timeout: 30000 });
}

// Checks that every variable the analysis needs is logged, using the in-page data. Works in
// both emulator and offline mode.
async function checkTaskData(page) {
  const rows = await page.evaluate(() => window.__jsPsych.data.get().values());
  const choices = rows.filter((r) => r.task === "choice");
  expect(choices.length).toBe(120);
  expect(choices.map((r) => r.trial_number)).toEqual([...Array(120)].map((_, i) => i + 1));
  expect(choices.filter((r) => r.rare).length).toBe(30);
  for (let b = 1; b <= 10; b++) expect(choices.filter((r) => r.block12 === b && r.rare).length).toBe(3);
  for (const type of ["gain", "mixed", "loss"]) {
    const ofType = choices.filter((r) => r.option_type === type);
    expect(ofType.length).toBe(40);
    for (const m of new Set(ofType.map((r) => r.multiplier))) expect(ofType.filter((r) => r.multiplier === m).length).toBe(5);
  }
  expect(choices.filter((r) => r.option_type === "loss").every((r) => r.certain === -25)).toBe(true);
  expect(choices.every((r) => (r.rare ? ["AAAAAB", "AAAAAC"] : ["AAAAAA"]).includes(r.sequence))).toBe(true);
  // risky side constant within each block of 10 and swapping between blocks
  for (let b = 1; b <= 12; b++) expect(new Set(choices.filter((r) => r.side_block === b).map((r) => r.risky_side)).size).toBe(1);
  for (let b = 1; b < 12; b++) {
    expect(choices.find((r) => r.side_block === b).risky_side).not.toBe(choices.find((r) => r.side_block === b + 1).risky_side);
  }
  // the robot's choices were recorded correctly, and points add up
  expect(choices.every((r) => r.chose_risky === (r.trial_number % 2 === 1 ? 1 : 0))).toBe(true);
  expect(choices[0].stay).toBe(null);
  expect(choices.slice(1).every((r) => r.stay === 0)).toBe(true);
  expect(choices.every((r) => r.points_after === r.points_before + r.outcome)).toBe(true);
  expect(choices[0].points_before).toBe(500);
  for (const r of choices) {
    if (r.chose_risky) expect(r.outcome).toBe(r.gamble_won ? r.gamble_win : r.gamble_loss);
    else expect(r.outcome).toBe(r.certain);
    expect(typeof r.rt).toBe("number");
  }
  const hp = rows.filter((r) => r.task === "headphone_check");
  expect(hp.length).toBe(2);
  expect(hp.filter((r) => r.correct).length).toBe(2);
  expect(hp.map((r) => r.replays)).toEqual([1, 0]);
  expect(choices[0].headphone_passed).toBe(true);
  const checks = rows.filter((r) => r.task === "sequence_check");
  expect(checks.map((r) => r.check_phase)).toEqual(["pre", "pre", "post", "post"]);
  expect(checks.every((r) => r.correct)).toBe(true);
  expect(rows.filter((r) => r.task === "questionnaires").length).toBe(0); // dropped in this version
  expect(rows.find((r) => r.task === "demographics").response.age).toBe(34);
}

async function fsGet(path) {
  // "Bearer owner" is the emulator's admin token: it bypasses security rules, like the Admin SDK.
  const r = await fetch(`${FS}/${path}`, { headers: { Authorization: "Bearer owner" } });
  return { status: r.status, body: r.status === 200 ? await r.json() : null };
}

// Unwrap Firestore REST "fields" encoding into plain JS.
function decode(v) {
  if (v == null) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("mapValue" in v) return decodeFields(v.mapValue.fields || {});
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(decode);
  return v;
}
function decodeFields(fields) {
  const out = {};
  for (const k of Object.keys(fields)) out[k] = decode(fields[k]);
  return out;
}

test.describe("lite version", () => {
  test("runs to the end and saves data", async ({ page }) => {
    const consoleErrors = [];
    page.on("pageerror", (e) => consoleErrors.push(String(e)));

    await page.goto(EMULATOR ? "/lite/?emulator=1&fast=1&PROLIFIC_PID=robot123&STUDY_ID=s1&SESSION_ID=sess1" : "/lite/?fast=1");
    await page.waitForFunction(() => window.__saver && window.__saver.uid);
    const mode = await page.evaluate(() => window.__saver.mode);
    expect(mode).toBe(EMULATOR ? "emulator" : "offline");

    await runThroughExperiment(page);
    await checkTaskData(page);

    // No uncaught errors from the experiment itself.
    expect(consoleErrors, "uncaught page errors").toEqual([]);

    const uid = await page.evaluate(() => window.__saver.docId);
    const stats = await page.evaluate(() => window.__saver.stats);

    if (!EMULATOR) {
      // Offline: banner + download fallback, nothing else to check.
      await expect(page.locator("#data-saver-banner")).toHaveAttribute("data-kind", "offline");
      await expect(page.locator("#data-saver-fallback")).toBeVisible();
      return;
    }

    expect(stats.writes_failed).toBe(0);
    await expect(page.locator("#data-saver-fallback")).toHaveCount(0);

    // Participant document is complete and carries the design facts + Prolific ids.
    const p = await fsGet(`experiments/${EXPERIMENT_ID}/participants/${uid}`);
    expect(p.status).toBe(200);
    const pdoc = decodeFields(p.body.fields);
    expect(pdoc.completed).toBe(true);
    expect(pdoc.design).toBe("within-subjects");
    expect(["left", "right"]).toContain(pdoc.risky_start_side);
    expect(pdoc.headphone_passed).toBe(true);
    expect(pdoc.prolific_pid).toBe("robot123");
    expect(pdoc.n_trials).toBeGreaterThan(10);
    expect(typeof pdoc.full_data).toBe("string");
    const full = JSON.parse(pdoc.full_data);
    expect(full.length).toBe(pdoc.n_trials);

    // Chunks of EXPERIMENT.chunk_size (10) trials, each carrying the trial data.
    const chunks = await fsGet(`experiments/${EXPERIMENT_ID}/participants/${uid}/trials?pageSize=500`);
    expect(chunks.status).toBe(200);
    const docs = (chunks.body.documents || []).map((d) => decodeFields(d.fields));
    expect(docs.length).toBe(Math.ceil(pdoc.n_trials / 10));
    const trials = docs.flatMap((d) => d.trials);
    expect(trials.length).toBe(pdoc.n_trials);
    const choices = trials.filter((t) => t.task === "choice");
    expect(choices.length).toBe(120);
    expect(choices.filter((t) => t.rare).length).toBe(30);
    const demo = trials.find((t) => t.task === "demographics");
    expect(demo.response.age).toBe(34);

    // Every trial row must carry the same participant id as its participant document,
    // otherwise trials.csv and participants.csv cannot be joined in the analysis.
    expect([...new Set(trials.map((t) => t.participant_id))]).toEqual([uid]);
  });

  test("declining consent ends the study without a thank-you-for-your-data message", async ({ page }) => {
    await page.goto(EMULATOR ? "/lite/?emulator=1" : "/lite/");
    await page.waitForFunction(() => window.__saver && window.__saver.uid);
    await page.getByRole("button", { name: "I do not agree" }).click();
    await expect(page.getByText("You chose not to participate")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Your responses were saved")).toHaveCount(0);
  });

  test("failing the headphone check ends the study before the task", async ({ page }) => {
    await page.goto(START);
    await page.waitForFunction(() => window.__saver && window.__saver.uid);
    await page.getByRole("button", { name: "I agree to participate" }).click();
    await page.locator("#jspsych-instructions-next").click();
    await page.locator('[data-play="cal"]').click();
    await clickButton(page, "Continue");
    await headphoneCheck(page, 1); // 1 of 2 right: fails
    await expect(page.locator("#screened-out")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".choice-screen")).toHaveCount(0);
    const rows = await page.evaluate(() => window.__jsPsych.data.get().values());
    expect(rows.filter((r) => r.task === "choice").length).toBe(0);
    expect(rows.filter((r) => r.task === "headphone_check").length).toBe(2);
  });

  test("setting a Prolific completion code does not break the test run", async ({ page }) => {
    // Regression test for the failure students hit right before launch: with a completion
    // code set, the live page redirects to Prolific, but a test run must stay put so that
    // `npm test` and CI keep passing.
    const navigations = [];
    page.on("framenavigated", (f) => { if (f === page.mainFrame()) navigations.push(f.url()); });

    await page.goto(EMULATOR ? "/lite/?emulator=1&fast=1&cc=QA123CODE" : "/lite/?fast=1&cc=QA123CODE");
    await page.waitForFunction(() => window.__saver && window.__saver.docId);
    await runThroughExperiment(page);

    expect(navigations.some((u) => u.includes("prolific.com")), "must not navigate to Prolific").toBe(false);
    if (EMULATOR) await expect(page.getByText("QA123CODE")).toBeVisible();
  });

  test("phones and tablets are turned away before consent", async ({ browser }) => {
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await context.newPage();
    await page.goto("http://localhost:8017/lite/?emulator=1");
    await expect(page.locator("#device-unsupported")).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole("button", { name: "I agree to participate" })).toHaveCount(0);

    if (EMULATOR) {
      // The turned-away visit is still recorded, so phone traffic is visible in the data.
      await page.waitForFunction(() => window.__saver && window.__saver.docId);
      const docId = await page.evaluate(() => window.__saver.docId);
      await page.evaluate(() => window.__saver._settle());
      const p = await fsGet(`experiments/${EXPERIMENT_ID}/participants/${docId}`);
      const pdoc = decodeFields(p.body.fields);
      expect(pdoc.device_supported).toBe(false);
      expect(pdoc.completed).toBe(false);
    }
    await context.close();
  });

  test("a desktop browser is not turned away", async ({ page }) => {
    await page.goto(EMULATOR ? "/lite/?emulator=1" : "/lite/");
    await expect(page.getByRole("button", { name: "I agree to participate" })).toBeVisible();
    await expect(page.locator("#device-unsupported")).toHaveCount(0);
  });


});
