/*
 * One bot playing the lite experiment. Loaded by bot/play.html, usually inside bot/index.html.
 *
 *   play.html?bot=b01&seed=7          (open on its own to watch one bot; no trial-90 target)
 *
 * What this file does, in order:
 *   1. Hooks that must exist before the experiment starts:
 *      - seeded Math.random, so every bot with the same seed gets the same trials, and a
 *        separate coin per (seed, trial) for gambles, so bots that gamble on the same trial
 *        win or lose together;
 *      - "ears": records the frequency of every tone the page schedules (the bot never reads
 *        the page's `rare` field); audio is kept silent so 11 bots don't beep at once;
 *      - reports a mouse/trackpad, so lite's "please use a computer" gate passes on any device.
 *   2. Loads the CURRENT ../lite/experiment.js and changes two lines in memory only:
 *      fast timings on this page, and tones still scheduled in fast mode. If either line is not
 *      found exactly, it stops with an error instead of running a different experiment.
 *   3. Drives the page like a participant: clicks buttons, presses b / n, reads the screen.
 *
 * Saving: off by default (offline, nothing saved). With &save=1 it loads Firebase and saves the
 * run under experiments/feng2024-lite-bots (FENG_BOT_SETTINGS.firebase_experiment_id), never the
 * pilot collection: lite's EXPERIMENT.id is replaced in the bot copy AND the saver is forced to
 * the bot collection. Every row and the participant document are tagged simulated: true.
 */
(function () {
  "use strict";
  const P = new URLSearchParams(location.search);
  const BOT = (window.FENG_BOTS || []).find((b) => b.key === (P.get("bot") || "b01"));
  const SEED = Math.max(1, Number(P.get("seed")) || 1);
  const RUN = P.get("run") || "solo";
  const SAVE = P.get("save") === "1";
  const TARGET = P.get("target") || null;
  const { check_at: CHECK_AT, test_rare: TEST_RARE, firebase_experiment_id: BOT_EXP, chunk_size: BOT_CHUNK } = window.FENG_BOT_SETTINGS;
  if (!/-bots$/.test(BOT_EXP)) throw new Error("firebase_experiment_id in bot/bots.js must end in -bots");
  // One write for all trials (lite reads chunk_size from the address).
  if (!P.has("chunk_size")) { P.set("chunk_size", String(BOT_CHUNK)); history.replaceState(null, "", "?" + P.toString()); }
  const parentWin = window.parent !== window ? window.parent : null;
  const SLOT = P.get("slot") || (BOT && BOT.key);   // which lane on the page (two players can share a strategy)
  const MODE = P.get("mode") || "solo";              // participants | tournament | solo
  const send = (msg) => { if (parentWin) parentWin.postMessage(Object.assign({ source: "feng-bot", run: RUN, bot: BOT && BOT.key, slot: SLOT }, msg), location.origin); };

  // ---------------------------------------------------------------------------
  // 1. Hooks
  // ---------------------------------------------------------------------------
  const mk = (s0) => { let s = s0 >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const h = (...xs) => xs.reduce((a, x) => Math.imul(a ^ (x >>> 0), 2654435761) >>> 0, 2166136261);
  const mainRng = mk(h(SEED, 1));
  let coinTrial = null;
  const coins = {};
  Math.random = () => {
    if (coinTrial !== null) {      // the next draw after the bot picks a gamble is that gamble's coin
      const k = coinTrial;
      coinTrial = null;
      return (coins[k] = mk(h(SEED, 2, k))());
    }
    return mainRng();
  };

  const heard = [];
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) {
    const origOsc = AC.prototype.createOscillator;
    AC.prototype.createOscillator = function () {
      const osc = origOsc.call(this);
      const rec = { freq: null, when: 0 };
      const desc = Object.getOwnPropertyDescriptor(AudioParam.prototype, "value");
      Object.defineProperty(osc.frequency, "value", {
        configurable: true,
        get() { return desc.get.call(this); },
        set(v) { rec.freq = v; desc.set.call(this, v); },
      });
      const start = osc.start.bind(osc);
      osc.start = (when) => { rec.when = when || 0; heard.push(rec); return start(when); };
      return osc;
    };
    // Silent: keep every context suspended (tones are still scheduled, so the bot still hears them).
    class SilentContext extends AC {
      constructor(...a) { super(...a); try { super.suspend(); } catch (e) {} }
      resume() { return Promise.resolve(); }
    }
    window.AudioContext = SilentContext;
    if (window.webkitAudioContext) window.webkitAudioContext = SilentContext;
  }

  const realMatchMedia = window.matchMedia ? window.matchMedia.bind(window) : null;
  window.matchMedia = (q) => (String(q).includes("any-pointer: fine")
    ? { matches: true, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; } }
    : realMatchMedia(q));

  // The saver always writes to the bot collection, whatever the experiment asks for.
  let lastDecision = null;
  if (window.DataSaver) {
    const origInit = window.DataSaver.init.bind(window.DataSaver);
    window.DataSaver.init = async (opts) => {
      const s = await origInit(Object.assign({}, opts, { experiment_id: BOT_EXP }));
      if (s.opts.experiment_id !== BOT_EXP) throw new Error("bot saver is not pointing at " + BOT_EXP);
      s.updateParticipant({ simulated: true, bot: BOT.name, bot_key: BOT.key, bot_seed: SEED, bot_target: TARGET, bot_mode: MODE, tournament_run: RUN });
      return s;
    };
  }
  // Tag every data row, and add what the bot heard and why it chose to each choice row.
  if (typeof window.initJsPsych === "function") {
    const origJs = window.initJsPsych;
    window.initJsPsych = (opts) => {
      const onData = opts.on_data_update;
      opts.on_data_update = (trial) => {
        if (trial && trial.task === "choice" && lastDecision && lastDecision.trial_number === trial.trial_number) {
          Object.assign(trial, { bot_heard_rare: lastDecision.heard_rare, bot_heard_deviant: lastDecision.heard_deviant, bot_rule: lastDecision.why });
        }
        return onData ? onData(trial) : undefined;
      };
      const j = origJs(opts);
      j.data.addProperties({ simulated: true, bot: BOT.name, bot_key: BOT.key, bot_seed: SEED, bot_target: TARGET });
      return j;
    };
  }

  window.addEventListener("error", (e) => send({ type: "page_error", message: String(e.message || e.error) }));
  window.addEventListener("unhandledrejection", (e) => send({ type: "page_error", message: String(e.reason && e.reason.message || e.reason) }));

  // ---------------------------------------------------------------------------
  // 2. Load the current lite experiment, with two lines changed in memory
  // ---------------------------------------------------------------------------
  const PATCHES = [
    ['const FAST = URL_PARAMS.get("fast") === "1" && ["localhost", "127.0.0.1"].includes(window.location.hostname);',
     "const FAST = true; // bot page only: shortened timings"],
    ["audioInfo = FAST ? { audio_ok: null } : Sound.sequence(t.sequence, T(TIMING.tone_lead));",
     "audioInfo = Sound.sequence(t.sequence, T(TIMING.tone_lead)); // bot page only: tones even in fast mode"],
  ];
  function fail(message) {
    send({ type: "failed", error: message });
    const box = document.createElement("pre");
    box.style.cssText = "white-space:pre-wrap;margin:24px;padding:16px;border:2px solid #b3261e;font:14px/1.5 system-ui,sans-serif";
    box.textContent = "Bot stopped: " + message;
    document.body.prepend(box);
  }
  const loadScript = (src) => new Promise((ok, bad) => {
    const s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = () => bad(new Error("could not load " + src));
    document.head.appendChild(s);
  });
  async function loadLite() {
    if (SAVE) { await loadScript("../lib/firebase-bundle.js"); await loadScript("../firebase-config.js"); }
    const res = await fetch("../lite/experiment.js", { cache: "no-cache" });
    if (!res.ok) throw new Error("could not load ../lite/experiment.js (HTTP " + res.status + ")");
    let src = await res.text();
    for (const [from, to] of PATCHES) {
      if (src.split(from).length !== 2) throw new Error("lite/experiment.js has changed and this line was not found exactly once:\n" + from + "\nUpdate PATCHES in bot/player.js.");
      src = src.replace(from, to);
    }
    // The bot copy uses the bot collection id and never sends anyone to Prolific.
    const idLine = /(const EXPERIMENT = \{[\s\S]*?\n\s*id:\s*)"[^"]*"/;
    if (!idLine.test(src)) throw new Error("could not find EXPERIMENT.id in lite/experiment.js. Update loadLite in bot/player.js.");
    src = src.replace(idLine, '$1"' + BOT_EXP + '"');
    src = src.replace(/(prolific_completion_code:\s*)"[^"]*"/, '$1""').replace(/(prolific_screenout_code:\s*)"[^"]*"/, '$1""');
    const s = document.createElement("script");
    s.text = src + "\n//# sourceURL=lite-experiment.bot-copy.js";
    document.body.appendChild(s);
  }

  // ---------------------------------------------------------------------------
  // 3. Drive the page
  // ---------------------------------------------------------------------------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function until(fn, what, ms = 30000) {
    const t0 = performance.now();
    for (;;) {
      const v = fn();
      if (v) return v;
      if (performance.now() - t0 > ms) throw new Error("timed out waiting for " + what);
      await sleep(8);
    }
  }
  const $ = (s) => document.querySelector(s);
  const jp = () => window.__jsPsych;
  const button = (label) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === label);
  const readyButton = (label) => { const b = button(label); return b && !b.disabled ? b : null; };
  // Where the experiment is: the trial number, plus the page text on multi-page instructions.
  const where = () => {
    const j = jp();
    if (!j || !j.getProgress) return "";
    const n = j.getProgress().current_trial_global;
    return $("#jspsych-instructions-next") ? n + "|" + ($("#jspsych-content").textContent || "").slice(0, 160) : String(n);
  };
  async function step(prepare) {     // wait until the screen is ready, act, then wait for it to move on
    const doIt = await prepare();
    const before = where();
    doIt();
    await until(() => where() !== before || screen() === "end", "the next screen");
  }
  const press = (key) => {
    const root = jp().getDisplayContainerElement();
    root.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    root.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
  };
  const num = (s) => Number(String(s).trim().replace("+", "").replace("\u2212", "-"));

  function screen() {
    if ($("#finish-message h2")) return "end";
    if ($(".choice-screen")) return "choice";
    if ($(".hp-trial")) return "headphone";
    if ($(".seq-check")) return "sequence";
    if ($(".fam-row")) return "familiarization";
    if ($('[data-play="cal"]')) return "calibration";
    if (button("I agree to participate")) return "consent";
    if ($("#jspsych-instructions-next")) return "instructions";
    if ($(".sd-navigation__complete-btn, input[type=button][value=Continue]")) return "demographics";
    if ($("#jspsych-survey-text-next")) return "comments";
    if (button("Finish")) return "debrief";
    return null; // fixation, feedback or outcome screens: nothing to do
  }

  // Strategy state
  const st = { tested: 0, edge: 0, verdict: null, endMove: null, atCheck: null, median: null, pending: null };
  const rng = mk(h(SEED, 77, Number(BOT.key.slice(1))));
  const decisions = [];
  let medianWaiter = null;
  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin || !e.data || e.data.source !== "feng-tournament" || e.data.run !== RUN) return;
    if (e.data.type === "median" && medianWaiter) { medianWaiter(e.data.value); medianWaiter = null; }
  });

  function decide(k, o) {
    const ev = 0.5 * o.win + 0.5 * o.loss;
    if (k > CHECK_AT && st.endMove) return { risky: st.endMove === "chase", why: st.endMove };
    if (BOT.base === "aggressive") return { risky: true, why: "aggressive" };
    if (BOT.base === "random") return { risky: rng() < 0.5, why: "random" };
    if (BOT.sound && o.heardRare) {
      if (st.tested < TEST_RARE) return { risky: true, why: "sound-test" };
      if (st.verdict === "keep") return { risky: true, why: "sound-keep" };
    }
    return { risky: ev > o.certain, why: "ev" };
  }

  async function playChoice() {
    const scr = await until(() => $(".choice-screen"), "a choice screen");
    const k = Number(scr.dataset.trial);
    const cells = [...scr.querySelectorAll(".opt.gamble .cell")].map((c) => num(c.textContent));
    const o = { win: cells[0], loss: cells[1], certain: num(scr.querySelector(".opt.safe .cell").textContent), points: num($(".score .points").textContent) };
    const six = heard.splice(0).filter((r) => r.freq !== null).sort((a, b) => a.when - b.when).map((r) => r.freq).slice(-6);
    o.heardRare = six.length === 6 && six.slice(0, 5).every((f) => f === 1000) && six[5] !== 1000;
    o.heardDeviant = o.heardRare ? (six[5] === 1500 ? "B" : six[5] === 500 ? "C" : "?") : null;

    if (st.pending) {                        // score the last test gamble from the change in points
      st.edge += (o.points - st.pending.pointsBefore) - st.pending.certain;
      st.pending = null;
      if (st.tested === TEST_RARE) st.verdict = st.edge > 0 ? "keep" : "drop";
    }
    if (k === CHECK_AT + 1) {                 // trial-90 checkpoint
      st.atCheck = o.points;
      send({ type: "checkpoint", points: o.points });
      st.median = parentWin ? await new Promise((r) => (medianWaiter = r)) : null;
      if (st.median !== null) {
        if ((BOT.end === "lock" || BOT.end === "both") && o.points > st.median) st.endMove = "lock";
        if ((BOT.end === "chase" || BOT.end === "both") && o.points < st.median) st.endMove = "chase";
      }
    }
    const d = decide(k, o);
    if (d.why === "sound-test") { st.tested++; st.pending = { pointsBefore: o.points, certain: o.certain }; }
    const riskySide = scr.dataset.riskySide;
    const side = d.risky ? riskySide : (riskySide === "left" ? "right" : "left");
    lastDecision = { trial_number: k, heard_tones: six.length, heard_rare: o.heardRare, heard_deviant: o.heardDeviant, why: d.why };
    decisions.push(lastDecision);
    send({ type: "trial", trial: k, points: o.points, heard: o.heardRare ? o.heardDeviant : "A", risky: d.risky, why: d.why, end_move: st.endMove, median: st.median });
    const before = where();
    if (d.risky) coinTrial = k;              // the gamble's coin is the next random draw
    press(side === "left" ? "b" : "n");
    await until(() => where() !== before, "trial " + k + " to finish");
    coinTrial = null;
    if (k === 120 && window.__saver) window.__saver.updateParticipant({ bot_points_at_90: st.atCheck, bot_target_at_90: st.median,
      bot_end_move: st.endMove, bot_sound_edge: BOT.sound ? st.edge : null, bot_sound_verdict: BOT.sound ? st.verdict : null,
      bot_final_points: jp().data.get().filter({ task: "choice" }).values().at(-1).points_after });
  }

  async function drive() {
    await until(() => jp() && $("#jspsych-content"), "the experiment to start");
    for (;;) {
      const s = await until(screen, "a screen the bot recognises", 60000);
      if (s === "end") break;
      if (s === "choice") { await playChoice(); continue; }
      if (s === "consent") await step(async () => { const b = await until(() => readyButton("I agree to participate"), "consent"); return () => b.click(); });
      else if (s === "instructions") { heard.length = 0; await step(async () => () => $("#jspsych-instructions-next").click()); }
      else if (s === "calibration") {
        $('[data-play="cal"]').click();
        await step(async () => { const b = await until(() => readyButton("Continue"), "calibration Continue"); return () => b.click(); });
      } else if (s === "headphone") {      // every bot wears headphones
        const correct = $(".hp-trial").dataset.correct;
        await step(async () => { const b = await until(() => readyButton(correct), "sound check answer"); return () => b.click(); });
      } else if (s === "familiarization") {
        document.querySelectorAll(".play-btn").forEach((b) => b.click());
        await step(async () => { const b = await until(() => readyButton("Continue"), "familiarization Continue"); return () => b.click(); });
      } else if (s === "sequence") {       // the bots learn the common sequence correctly
        const correct = $(".seq-check").dataset.correct;
        document.querySelectorAll(".play-btn").forEach((b) => b.click());
        const label = correct === "left" ? "Left" : "Right";
        await step(async () => { const b = await until(() => readyButton(label), "sequence check answer"); return () => b.click(); });
      } else if (s === "demographics") {   // optional questions: left blank
        await step(async () => () => $(".sd-navigation__complete-btn, input[type=button][value=Continue]").click());
      } else if (s === "comments") await step(async () => () => $("#jspsych-survey-text-next").click());
      else if (s === "debrief") await step(async () => () => button("Finish").click());
    }
    const KEEP = ["trial_number", "block12", "side_block", "option_type", "certain", "gamble_win", "gamble_loss", "multiplier",
      "sequence", "rare", "deviant", "risky_side", "response", "rt", "chosen_side", "chose_risky", "stay", "points_before",
      "gamble_won", "outcome", "points_after", "audio_ok", "audio_state", "risky_start_side", "headphone_passed", "headphone_correct", "time_elapsed", "trial_index"];
    const rows = jp().data.get().filter({ task: "choice" }).values().map((r) => Object.fromEntries(KEEP.map((c) => [c, r[c] === undefined ? null : r[c]])));
    const checks = jp().data.get().filter({ task: "sequence_check" }).values().map((r) => ({ phase: r.check_phase, correct: r.correct }));
    const sv = window.__saver || {};
    const stats = sv.stats || {};
    const saved = { mode: sv.mode || null, participant_id: sv.docId || null, experiment_id: sv.opts ? sv.opts.experiment_id : null,
      ok: sv.mode === "firebase" && !stats.writes_failed && !stats.writes_timed_out };
    send({ type: "done", saved, rows, decisions, coins, checks, state: { at_check: st.atCheck, median: st.median, end_move: st.endMove, sound_edge: BOT.sound ? st.edge : null, sound_verdict: BOT.sound ? st.verdict : null } });
  }

  if (!BOT) { document.addEventListener("DOMContentLoaded", () => fail('unknown bot "' + P.get("bot") + '"')); return; }
  document.title = BOT.name + " (seed " + SEED + ")";
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      await loadLite();
      await drive();
    } catch (e) {
      fail(String(e && e.message || e));
    }
  });
})();
