/*
 * LITE VERSION of the replication of Feng & Rutledge (2024), "Surprising sounds influence risky
 * decision making", Nature Communications 15, 8027, Experiment 2.
 * Folder lite/, live at https://psych251.github.io/feng2024/lite/.
 *
 * Differences from the main version (list them in the Differences table if this version is used):
 *   - Headphone screen shortened from 6 trials (pass = 5+) to 2 trials (pass = both correct),
 *     and each set of tones can be replayed (the original plays each set once). Replays are
 *     counted in the field `replays`.
 *   - PHQ-8 and GAD-7 removed.
 *   Everything else (120 trials, tones, timings, keys, sequence checks) is identical.
 *
 * Design summary
 *   IV       Tone sequence before each choice, within subjects: common AAAAAA (90 trials) vs
 *            rare AAAAAB / AAAAAC (30 trials). A = 1000 Hz, B = 1500 Hz, C = 500 Hz.
 *   DV       Choice of the 50/50 gamble vs the sure option on every trial: field `chose_risky`
 *            (1/0) on rows with task "choice". Key test: % risky on rare minus common trials,
 *            per participant, two-sided Wilcoxon signed-rank test. Also logged: rt, outcome,
 *            points, `stay` (same choice as the previous trial).
 *   Trials   120 choice trials (field option_type = gain, mixed or loss). Each: 3-s fixation
 *            while six 100-ms tones play 400 ms apart;
 *            options (self-paced, keys b = left, n = right); a chosen gamble resolves after
 *            1.3 s and its outcome shows for 1 s; a chosen sure option shows for 2 s.
 *            500-point starting balance, running total always visible.
 *   Lists    Built to match the authors' Experiment 2 data (OSF, data_csv), which differs from
 *            the paper's Methods text: 40 Gain, 40 Mixed and 40 Loss trials per person; each of
 *            the 8 multipliers appears 5 times per type; for Gain and Mixed each appearance picks
 *            one of the two base amounts at random; Loss trials always use a sure loss of -25.
 *            Rare trials: exactly 3 in every block of 12, positions random; each rare sequence
 *            ends in B or C at random. Risky option side: random start, swaps every 10 trials.
 *   Checks   Headphone screen (Woods et al., 2017 stimuli, shortened to 2 trials, pass = both
 *            correct, replay allowed; failing ends the study; the original used the full
 *            6-trial screen with each set played once).
 *            Common-sequence identification: 2 trials with feedback before the task, 2 without
 *            feedback after it. No other exclusions.
 *   After    Demographics, optional comments (pilot only). The original's PHQ-8 and GAD-7 are
 *            dropped to shorten the session.
 */

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
window.TEMPLATE_VERSION = "0.1.0";

const EXPERIMENT = {
  // Firestore path: experiments/<id>/participants/... New id for every phase so data never mix.
  // "lite" keeps this version's data apart from the main version's:
  // feng2024-lite-pilot-a -> feng2024-lite-pilot-b -> feng2024-lite-final.
  id: "feng2024-lite-pilot-b",

  // Trials per Firestore write. About 135 rows per participant, so 10 gives ~17 writes each,
  // well inside the free tier's 20,000 writes/day.
  chunk_size: 10,

  save_full_data_at_end: true,

  // Prolific: completion code for people who finish. Leave empty for local testing.
  prolific_completion_code: "",
  // Prolific: code for people who fail the headphone screen (screen-outs). Check the Class
  // Prolific Guidelines for how screen-outs should be handled before filling this in.
  prolific_screenout_code: "C1OMEMUH",

  contact_email: "stanfordpsych251@gmail.com",

  // Choices are made with the b and n keys, so a physical keyboard is required.
  requires_keyboard: true,
};

// Timings in milliseconds (from the paper's Methods and Figure 1, checked against the data:
// the response-to-next-trial gap is ~5.0 s after a sure choice and ~5.3 s after a gamble).
const TIMING = {
  iti: 3000,            // fixation cross; the tone sequence plays during it
  tone_lead: 100,       // first tone starts this long after the fixation appears
  tone: 100,            // each tone
  tone_soa: 500,        // onset to onset (100-ms tone + 400 ms between tones)
  gamble_delay: 1300,   // chosen gamble shown before it resolves
  outcome: 1000,        // gamble outcome
  safe: 2000,           // chosen sure option
  feedback: 1500,       // feedback after a sequence-check answer
};
const FREQ = { A: 1000, B: 1500, C: 500 };
// Headphone screen length and pass rule (Woods et al. used 6 trials, pass = 5+ correct).
const HP_TRIALS = 2;
const HP_PASS = 2;
const TONE_LEVEL = 0.25;

// True on anything with a mouse, trackpad, or stylus. False on phones and tablets.
function hasFinePointer() {
  return !!(window.matchMedia && window.matchMedia("(any-pointer: fine)").matches);
}

const URL_PARAMS = new URLSearchParams(window.location.search);
const USE_EMULATOR = URL_PARAMS.get("emulator") === "1";
const CHUNK_SIZE = Number(URL_PARAMS.get("chunk_size")) || EXPERIMENT.chunk_size;
if (USE_EMULATOR && URL_PARAMS.get("cc")) EXPERIMENT.prolific_completion_code = URL_PARAMS.get("cc");
// Test-only: `?fast=1` shrinks every timing so the robot can run 120 trials quickly. Only
// honoured on localhost, so it can never affect a real participant.
const FAST = URL_PARAMS.get("fast") === "1" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
const T = (ms) => (FAST ? Math.max(10, Math.round(ms * 0.02)) : ms);

// ---------------------------------------------------------------------------
// Sound: pure tones synthesized with the Web Audio API, scheduled on the audio clock so their
// timing does not depend on screen refreshes. No audio files are needed.
// ---------------------------------------------------------------------------
const Sound = {
  ctx: null,
  get() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },
  tone(freq, when, durS, level) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const ramp = Math.min(0.005, durS / 4); // 5-ms on/off ramps avoid clicks
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(level, when + ramp);
    g.gain.setValueAtTime(level, when + durS - ramp);
    g.gain.linearRampToValueAtTime(0, when + durS);
    osc.connect(g).connect(ctx.destination);
    osc.start(when);
    osc.stop(when + durS + 0.02);
  },
  // Plays a six-letter pattern such as "AAAAAB". Returns timing information to log.
  sequence(pattern, leadMs) {
    const ctx = this.get();
    if (!ctx) return { audio_ok: false };
    const t0 = ctx.currentTime + leadMs / 1000;
    for (let i = 0; i < pattern.length; i++) {
      this.tone(FREQ[pattern[i]], t0 + (i * T(TIMING.tone_soa)) / 1000, T(TIMING.tone) / 1000, TONE_LEVEL);
    }
    return {
      audio_ok: ctx.state === "running",
      audio_state: ctx.state,
      audio_base_latency: ctx.baseLatency ?? null,
      audio_output_latency: ctx.outputLatency ?? null,
    };
  },
  // Woods et al. (2017) headphone check: three 200-Hz tones, one 6 dB quieter (the correct
  // answer) and one in antiphase between the ears (it sounds quietest over loudspeakers).
  woods(quietIndex, antiIndex) {
    const ctx = this.get();
    if (!ctx) return;
    const rate = ctx.sampleRate;
    const dur = T(1000) / 1000, gap = T(500) / 1000, ramp = Math.min(0.1, dur / 4);
    const n = Math.round(rate * (3 * dur + 2 * gap));
    const buf = ctx.createBuffer(2, n, rate);
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    for (let k = 0; k < 3; k++) {
      const amp = 0.3 * (k === quietIndex ? 0.5 : 1);
      const sign = k === antiIndex ? -1 : 1;
      const start = Math.round(rate * k * (dur + gap));
      const len = Math.round(rate * dur);
      for (let i = 0; i < len; i++) {
        const t = i / rate;
        const env = Math.min(1, t / ramp, (dur - t) / ramp);
        const s = amp * env * Math.sin(2 * Math.PI * 200 * t);
        L[start + i] = s;
        R[start + i] = sign * s;
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(ctx.currentTime + 0.05);
  },
};

// ---------------------------------------------------------------------------
// Trial list (matches the structure of the authors' Experiment 2 data; see header)
// ---------------------------------------------------------------------------
const MULTIPLIERS = {
  gain: [1.64, 1.76, 1.88, 2.0, 2.2, 2.5, 3.0, 4.0],
  mixed: [0.2, 0.4, 0.55, 0.67, 0.8, 1.0, 1.33, 2.0],
};
// Amounts exactly as shown in the original data (note 50 x 2.5 was shown as 126).
const GAIN_WIN = { 25: [41, 44, 47, 50, 55, 63, 75, 100], 50: [82, 88, 94, 100, 110, 126, 150, 200] };
const LOSS_LOSS = [-41, -44, -47, -50, -55, -63, -75, -100]; // sure loss is always -25
const MIXED_LOSS = { 40: [-8, -16, -22, -27, -32, -40, -53, -80], 80: [-16, -32, -44, -54, -64, -80, -106, -160] };

function makeTrialList(jsPsych) {
  const coin = () => Math.random() < 0.5;
  const items = [];
  for (let m = 0; m < 8; m++) {
    for (let rep = 0; rep < 5; rep++) {
      const g = coin() ? 25 : 50;
      items.push({ trial_type: "gain", certain: g, gamble_win: GAIN_WIN[g][m], gamble_loss: 0, multiplier: MULTIPLIERS.gain[m] });
      items.push({ trial_type: "loss", certain: -25, gamble_win: 0, gamble_loss: LOSS_LOSS[m], multiplier: MULTIPLIERS.gain[m] });
      const x = coin() ? 40 : 80;
      items.push({ trial_type: "mixed", certain: 0, gamble_win: x, gamble_loss: MIXED_LOSS[x][m], multiplier: MULTIPLIERS.mixed[m] });
    }
  }
  const order = jsPsych.randomization.shuffle(items);

  // Exactly 3 rare sequences in every block of 12 trials.
  const rare = new Array(order.length).fill(false);
  for (let b = 0; b < order.length / 12; b++) {
    const picks = jsPsych.randomization.sampleWithoutReplacement([...Array(12).keys()], 3);
    for (const p of picks) rare[b * 12 + p] = true;
  }

  const startSide = coin() ? "left" : "right";
  const other = startSide === "left" ? "right" : "left";
  return {
    startSide,
    trials: order.map((it, i) => ({
      ...it,
      trial_number: i + 1,
      block12: Math.floor(i / 12) + 1,
      side_block: Math.floor(i / 10) + 1,
      rare: rare[i],
      sequence: rare[i] ? (coin() ? "AAAAAB" : "AAAAAC") : "AAAAAA",
      risky_side: Math.floor(i / 10) % 2 === 0 ? startSide : other,
    })),
  };
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------
const fmt = (v) => (v > 0 ? "+" + v : String(v));
const cls = (v) => (v > 0 ? "pos" : v < 0 ? "neg" : "zero");

function gambleBox(t, only) {
  // only: undefined = both halves; "win" or "loss" = just the realized half
  const filler = '<div class="cell blank"></div>';
  const top = only === "loss" ? filler : `<div class="cell ${cls(t.gamble_win)}">${fmt(t.gamble_win)}</div>`;
  const bottom = only === "win" ? filler : `<div class="cell ${cls(t.gamble_loss)}">${fmt(t.gamble_loss)}</div>`;
  return `<div class="opt gamble${only ? " resolved" : ""}">${top}${bottom}</div>`;
}
function safeBox(t) {
  return `<div class="opt safe"><div class="cell ${cls(t.certain)}">${fmt(t.certain)}</div></div>`;
}
function panel(inner, points, extraClass = "", attrs = "") {
  return `
    <div class="score">Points: <span class="points">${points}</span></div>
    <div class="task-panel ${extraClass}" ${attrs}>
      <div class="fix">+</div>
      ${inner}
    </div>`;
}
function placed(html, side) {
  return `<div class="slot ${side}">${html}</div>`;
}
function playButtons(labels) {
  return labels.map(([id, label]) => `<button type="button" class="jspsych-btn play-btn" data-play="${id}">&#9654; ${label}</button>`).join(" ");
}
// Disables the plugin's response buttons until `ready()` returns true; call the returned
// function again whenever the condition may have changed.
function lockButtons(ready) {
  const btns = document.querySelectorAll("#jspsych-html-button-response-btngroup button");
  const refresh = () => btns.forEach((b) => (b.disabled = !ready()));
  refresh();
  return refresh;
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
(async function main() {
  const deviceSupported = !EXPERIMENT.requires_keyboard || hasFinePointer();

  const saver = await DataSaver.init({
    experiment_id: EXPERIMENT.id,
    chunk_size: CHUNK_SIZE,
    save_full_data_at_end: EXPERIMENT.save_full_data_at_end,
    use_emulator: USE_EMULATOR,
    contact_email: EXPERIMENT.contact_email,
  });
  window.__saver = saver;
  saver.updateParticipant({ device_supported: deviceSupported, requires_keyboard: EXPERIMENT.requires_keyboard });

  if (!deviceSupported) {
    document.body.innerHTML =
      '<div id="device-unsupported" class="jspsych-content" style="max-width:640px;margin:15vh auto;font:16px/1.6 system-ui,sans-serif;">' +
      "<h2>Please use a computer</h2>" +
      "<p>This study needs a computer with a physical keyboard and headphones, because the choices " +
      "are made by pressing keys. Phones and tablets cannot be used.</p>" +
      "<p>Please reopen this link on a laptop or desktop computer. If you were sent here from " +
      "Prolific, you can return the study and take it later on a computer; nothing has been recorded " +
      "against you.</p>" +
      "<p>Questions: <a href=\"mailto:" + EXPERIMENT.contact_email + "\">" + EXPERIMENT.contact_email + "</a></p></div>";
    return;
  }

  let screenedOut = false;

  const jsPsych = initJsPsych({
    show_progress_bar: true,
    auto_update_progress_bar: true,
    on_data_update: (trial) => saver.onTrial(trial),
    on_finish: async () => {
      const el = jsPsych.getDisplayElement();
      el.innerHTML = '<div id="finish-message"><p class="thanks">Saving your responses…</p></div>';
      const result = await saver.finish(jsPsych);
      const consentRow = jsPsych.data.get().filter({ task: "consent" }).values()[0];
      const consented = !consentRow || consentRow.consented !== false;
      const msg = document.getElementById("finish-message");

      if (!consented) {
        msg.innerHTML = "<h2 class='thanks'>Thank you</h2><p class='thanks'>You chose not to participate. " +
          "You may close this window" + (EXPERIMENT.prolific_completion_code ? " and return the study on Prolific" : "") + ".</p>";
        return;
      }
      if (screenedOut) {
        if (result.ok && EXPERIMENT.prolific_screenout_code && !USE_EMULATOR) {
          window.location.href = "https://app.prolific.com/submissions/complete?cc=" + EXPERIMENT.prolific_screenout_code;
          return;
        }
        msg.innerHTML = "<h2 class='thanks' id='screened-out'>Thank you</h2>" +
          "<p class='thanks'>This study needs headphones, and the sound check suggests they may not be in use, " +
          "so the study ends here. " +
          (EXPERIMENT.prolific_screenout_code
            ? "Your code is <strong>" + EXPERIMENT.prolific_screenout_code + "</strong>."
            : "Please return the study on Prolific.") + "</p>";
        return;
      }
      if (result.ok && EXPERIMENT.prolific_completion_code && !USE_EMULATOR) {
        msg.innerHTML = "<p class='thanks'>Saved. Returning you to Prolific…</p>";
        window.location.href = "https://app.prolific.com/submissions/complete?cc=" + EXPERIMENT.prolific_completion_code;
        return;
      }
      msg.innerHTML =
        "<h2 class='thanks'>All done</h2>" +
        (result.ok ? "<p class='thanks'>Your responses were saved. Thank you for participating!</p>" : "") +
        (EXPERIMENT.prolific_completion_code
          ? "<p class='thanks'>Your completion code is <strong>" + EXPERIMENT.prolific_completion_code + "</strong>.</p>"
          : "");
    },
  });

  window.__jsPsych = jsPsych; // for debugging and the automated test
  const list = makeTrialList(jsPsych);

  jsPsych.data.addProperties({
    participant_id: saver.docId,
    prolific_pid: saver.params.PROLIFIC_PID || null,
    experiment_id: EXPERIMENT.id,
    design: "within-subjects",
    risky_start_side: list.startSide,
  });
  saver.updateParticipant({ design: "within-subjects", risky_start_side: list.startSide, fast_mode: FAST });

  // -------------------------------------------------------------------------
  // 1. Consent (course-wide IRB text; edit only the contact address)
  // -------------------------------------------------------------------------
  const consent = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="consent">
        <h2>Consent</h2>
        <p>By answering the following questions, you are participating in a study being performed by
        cognitive scientists in the Stanford Department of Psychology. If you have questions about
        this research, please contact us at <a href="mailto:${EXPERIMENT.contact_email}">${EXPERIMENT.contact_email}</a>.
        You must be at least 18 years old to participate. Your participation in this research is
        voluntary. You may decline to answer any or all of the following questions. You may decline
        further participation, at any time, without adverse consequences. Your anonymity is assured;
        the researchers who have requested your participation will not receive any personal
        information about you.</p>
      </div>`,
    choices: ["I agree to participate", "I do not agree"],
    data: { task: "consent" },
    on_finish: (data) => {
      data.consented = data.response === 0;
      if (!data.consented) jsPsych.abortExperiment();
    },
  };

  // -------------------------------------------------------------------------
  // 2. Welcome
  // -------------------------------------------------------------------------
  const welcome = {
    type: jsPsychInstructions,
    pages: [
      `<h2>Welcome</h2>
       <p>In this study you will play a short decision game while listening to sequences of tones.
       It takes about 15 to 20 minutes.</p>
       <p><strong>Please wear headphones</strong> and complete the study in one sitting, in a quiet
       place, on a laptop or desktop computer.</p>`,
    ],
    show_clickable_nav: true,
    data: { task: "instructions", page_set: "welcome" },
  };

  // -------------------------------------------------------------------------
  // 3. Volume calibration (also unlocks audio: browsers only allow sound after a click)
  // -------------------------------------------------------------------------
  let calibrationPlays = 0;
  const calibration = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <h2>Volume calibration</h2>
      <p>Put on your headphones. Press the button, then turn up the volume on your computer until
      the sound is at a loud but comfortable level. Play it as many times as you like.</p>
      <p style="text-align:center">${playButtons([["cal", "Play calibration sound"]])}</p>
      <p>Press Continue when the volume is set.</p>`,
    choices: ["Continue"],
    data: { task: "calibration" },
    on_load: () => {
      calibrationPlays = 0;
      const refresh = lockButtons(() => calibrationPlays > 0);
      document.querySelector('[data-play="cal"]').addEventListener("click", () => {
        Sound.sequence("AAAAAB", 50);
        calibrationPlays++;
        refresh();
      });
    },
    on_finish: (data) => { data.plays = calibrationPlays; },
  };

  // -------------------------------------------------------------------------
  // 4. Headphone screen (Woods et al., 2017)
  // -------------------------------------------------------------------------
  const hpIntro = {
    type: jsPsychInstructions,
    pages: [
      `<h2>Sound check</h2>
       <p>On each of the next 2 screens you will hear three tones, one after another. One of them is
       <strong>quieter</strong> than the other two. After the tones, click the number (1, 2 or 3) of the
       quietest tone. Listen carefully. If you missed it, you can press Replay to hear the set again.</p>`,
    ],
    show_clickable_nav: true,
    data: { task: "instructions", page_set: "headphone" },
  };
  const hpOrders = [...Array(HP_TRIALS)].map(() => {
    const [quiet, anti] = jsPsych.randomization.sampleWithoutReplacement([0, 1, 2], 2);
    return { quiet, anti };
  });
  let hpReady = false;
  let hpReplays = 0;
  let screenCount = 0; // gives each check screen a unique data-n, so the test robot can tell them apart
  const hpTrial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: () => `
      <div class="hp-trial" data-n="${++screenCount}" data-correct="${jsPsych.evaluateTimelineVariable("quiet") + 1}">
        <p>Which tone was the quietest?</p>
        <p class="hp-status">Listen…</p>
        <p><button type="button" class="jspsych-btn hp-replay" disabled>&#8635; Replay</button></p>
      </div>`,
    choices: ["1", "2", "3"],
    data: {
      task: "headphone_check",
      quiet_position: () => jsPsych.evaluateTimelineVariable("quiet") + 1,
      antiphase_position: () => jsPsych.evaluateTimelineVariable("anti") + 1,
    },
    on_load: () => {
      hpReady = false;
      hpReplays = 0;
      const refresh = lockButtons(() => hpReady);
      const replayBtn = document.querySelector(".hp-replay");
      const status = document.querySelector(".hp-status");
      const quiet = jsPsych.evaluateTimelineVariable("quiet"), anti = jsPsych.evaluateTimelineVariable("anti");
      // Plays the set; the answer and Replay buttons stay disabled until it has finished.
      const play = () => {
        replayBtn.disabled = true;
        if (status) status.textContent = "Listen…";
        Sound.woods(quiet, anti);
        setTimeout(() => {
          hpReady = true;
          refresh();
          replayBtn.disabled = false;
          if (status) status.textContent = "Click 1, 2 or 3, or press Replay to hear it again.";
        }, T(3 * 1000 + 2 * 500) + 150);
      };
      replayBtn.addEventListener("click", () => { hpReplays++; play(); });
      play();
    },
    on_finish: (data) => {
      data.answer = data.response + 1;
      data.correct = data.answer === data.quiet_position;
      data.replays = hpReplays;
    },
  };
  const headphoneCheck = {
    timeline: [hpTrial],
    timeline_variables: hpOrders,
    on_timeline_finish: () => {
      const nCorrect = jsPsych.data.get().filter({ task: "headphone_check" }).filter({ correct: true }).count();
      const passed = nCorrect >= HP_PASS;
      jsPsych.data.addProperties({ headphone_passed: passed, headphone_correct: nCorrect });
      saver.updateParticipant({ headphone_passed: passed, headphone_correct: nCorrect });
      if (!passed) {
        screenedOut = true;
        jsPsych.abortExperiment();
      }
    },
  };

  // -------------------------------------------------------------------------
  // 5. Sequence familiarization and the common-sequence check
  // -------------------------------------------------------------------------
  const familiarization = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <h2>Tone sequences</h2>
      <p>During this experiment, you will hear different tone sequences. Listen carefully to each one.
      Pay attention to which sequences are common and which are rare.</p>
      <div class="fam-row"><strong>COMMON</strong><br>${playButtons([["AAAAAA", "Play"]])}</div>
      <div class="fam-row"><strong>RARE</strong><br>${playButtons([["AAAAAB", "Play"], ["AAAAAC", "Play"]])}</div>
      <p>Play each sequence at least once, then press Continue.</p>`,
    choices: ["Continue"],
    data: { task: "familiarization" },
    on_load: () => {
      const played = new Set();
      const refresh = lockButtons(() => played.size === 3);
      document.querySelectorAll(".play-btn").forEach((b) =>
        b.addEventListener("click", () => {
          Sound.sequence(b.dataset.play, 50);
          played.add(b.dataset.play);
          refresh();
        }));
    },
  };

  function sequenceCheck(phase, withFeedback) {
    const items = jsPsych.randomization.shuffle(["AAAAAB", "AAAAAC"]).map((rareSeq) => ({
      rareSeq,
      commonSide: jsPsych.randomization.sampleWithoutReplacement(["left", "right"], 1)[0],
    }));
    const check = {
      type: jsPsychHtmlButtonResponse,
      stimulus: () => `
        <div class="seq-check" data-n="${++screenCount}" data-correct="${jsPsych.evaluateTimelineVariable("commonSide")}">
          <p>Listen to both sequences. Which is the more common sequence?</p>
          <div class="seq-pair">
            <div><strong>LEFT</strong><br>${playButtons([["left", "Play"]])}</div>
            <div><strong>RIGHT</strong><br>${playButtons([["right", "Play"]])}</div>
          </div>
        </div>`,
      choices: ["Left", "Right"],
      data: {
        task: "sequence_check",
        check_phase: phase,
        common_side: () => jsPsych.evaluateTimelineVariable("commonSide"),
        rare_sequence: () => jsPsych.evaluateTimelineVariable("rareSeq"),
      },
      on_load: () => {
        const played = new Set();
        const refresh = lockButtons(() => played.size === 2);
        const common = jsPsych.evaluateTimelineVariable("commonSide");
        const rareSeq = jsPsych.evaluateTimelineVariable("rareSeq");
        document.querySelectorAll(".play-btn").forEach((b) =>
          b.addEventListener("click", () => {
            Sound.sequence(b.dataset.play === common ? "AAAAAA" : rareSeq, 50);
            played.add(b.dataset.play);
            refresh();
          }));
      },
      on_finish: (data) => {
        data.answer = data.response === 0 ? "left" : "right";
        data.correct = data.answer === data.common_side;
      },
    };
    const feedback = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: () => (jsPsych.data.getLastTrialData().values()[0].correct
        ? '<p class="feedback ok">Correct: that was the common sequence.</p>'
        : '<p class="feedback no">Not quite: the other one was the common sequence.</p>'),
      choices: "NO_KEYS",
      trial_duration: T(TIMING.feedback),
      record_data: false,
    };
    return { timeline: withFeedback ? [check, feedback] : [check], timeline_variables: items };
  }

  const checkIntro = {
    type: jsPsychInstructions,
    pages: [
      `<h2>Tone sequences check</h2>
       <p>Let's make sure that you can tell the sequences apart. On the next two screens, play both
       sequences and choose the one that is the common sequence.</p>`,
    ],
    show_clickable_nav: true,
    data: { task: "instructions", page_set: "sequence_check" },
  };

  // -------------------------------------------------------------------------
  // 6. Task instructions
  // -------------------------------------------------------------------------
  const example = { gamble_win: 80, gamble_loss: -96, certain: 0 };
  const taskInstructions = {
    type: jsPsychInstructions,
    pages: [
      `<h2>Risky decision game: how to play</h2>
       <p>Win as many points as you can. You start with <strong>500 points</strong>.</p>
       <p>On each trial, choose the <strong>safe</strong> option or the <strong>risky</strong> option.
       The risky options are 50/50 gambles, with equal probabilities of getting either outcome.
       Choose wisely!</p>
       <p>To make your choices, press <strong>b</strong> on your keyboard for the left option and
       <strong>n</strong> for the right option.</p>
       <div class="example">
         ${panel(placed(gambleBox(example), "left") + placed(safeBox(example), "right"), 500, "example-panel")}
         <div class="example-labels"><span>Risky gamble (50/50)</span><span>Guaranteed prize</span></div>
       </div>`,
      `<p>Before each choice you will see a cross in the middle of the screen and hear a sequence
       of tones. Just listen to the tones.</p>
       <p>The left and right positions of the risky and safe options may switch during the game,
       so check where each option is before you respond.</p>
       <p>There are 120 choices. Press Next when you are ready to begin.</p>`,
    ],
    show_clickable_nav: true,
    data: { task: "instructions", page_set: "task" },
  };

  // -------------------------------------------------------------------------
  // 7. The 120 choice trials
  // -------------------------------------------------------------------------
  let points = 500;
  let previousChoice = null;
  let audioInfo = {};
  let current = null; // the last choice row, read by the resolution screens

  const taskTrials = list.trials.flatMap((t) => {
    const gambleSide = t.risky_side;
    const safeSide = gambleSide === "left" ? "right" : "left";

    const iti = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: () => panel("", points),
      choices: "NO_KEYS",
      trial_duration: T(TIMING.iti),
      record_data: false,
      on_load: () => {
        audioInfo = FAST ? { audio_ok: null } : Sound.sequence(t.sequence, T(TIMING.tone_lead));
      },
    };

    const choice = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: () => panel(
        placed(gambleBox(t), gambleSide) + placed(safeBox(t), safeSide),
        points, "choice-screen", `data-risky-side="${gambleSide}" data-trial="${t.trial_number}"`),
      choices: ["b", "n"],
      save_trial_parameters: { stimulus: false },
      data: {
        task: "choice",
        trial_number: t.trial_number,
        block12: t.block12,
        side_block: t.side_block,
        option_type: t.trial_type, // "trial_type" is reserved by jsPsych (plugin name)
        certain: t.certain,
        gamble_win: t.gamble_win,
        gamble_loss: t.gamble_loss,
        multiplier: t.multiplier,
        sequence: t.sequence,
        rare: t.rare,
        deviant: t.rare ? t.sequence.slice(-1) : null,
        risky_side: gambleSide,
      },
      on_finish: (data) => {
        Object.assign(data, audioInfo);
        data.chosen_side = data.response === "b" ? "left" : "right";
        data.chose_risky = data.chosen_side === gambleSide ? 1 : 0;
        data.stay = previousChoice === null ? null : (data.chose_risky === previousChoice ? 1 : 0);
        data.points_before = points;
        if (data.chose_risky) {
          data.gamble_won = Math.random() < 0.5 ? 1 : 0;
          data.outcome = data.gamble_won ? t.gamble_win : t.gamble_loss;
        } else {
          data.gamble_won = null;
          data.outcome = t.certain;
        }
        points += data.outcome;
        data.points_after = points;
        previousChoice = data.chose_risky;
        current = data;
      },
    };

    // Unchosen option disappears; a gamble waits 1.3 s, a sure option stays for 2 s.
    const resolve = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: () => current.chose_risky
        ? panel(placed(gambleBox(t), gambleSide), current.points_before)
        : panel(placed(safeBox(t), safeSide), current.points_after),
      choices: "NO_KEYS",
      trial_duration: () => (current.chose_risky ? T(TIMING.gamble_delay) : T(TIMING.safe)),
      record_data: false,
    };

    const outcome = {
      timeline: [{
        type: jsPsychHtmlKeyboardResponse,
        stimulus: () => panel(placed(gambleBox(t, current.gamble_won ? "win" : "loss"), gambleSide), current.points_after),
        choices: "NO_KEYS",
        trial_duration: T(TIMING.outcome),
        record_data: false,
      }],
      conditional_function: () => current.chose_risky === 1,
    };

    return [iti, choice, resolve, outcome];
  });

  const taskDone = {
    type: jsPsychInstructions,
    pages: () => [`<h2>Game complete</h2><p>You finished the game with <strong>${points} points</strong>.
             Next come a few short questions.</p>`],
    show_clickable_nav: true,
    data: { task: "instructions", page_set: "task_done" },
  };

  // -------------------------------------------------------------------------
  // 8. Demographics and comments (the original's PHQ-8 / GAD-7 are dropped in this version)
  // -------------------------------------------------------------------------
  const demographics = {
    type: jsPsychSurvey,
    survey_json: {
      showQuestionNumbers: "off",
      completeText: "Continue",
      pages: [{
        elements: [
          { type: "text", name: "age", title: "How old are you?", inputType: "number", min: 18, max: 120 },
          {
            type: "radiogroup", name: "gender", title: "What is your gender?",
            choices: ["Woman", "Man", "Non-binary"], showOtherItem: true, showNoneItem: true, noneText: "Prefer not to say",
          },
        ],
      }],
    },
    data: { task: "demographics" },
  };

  // Pilot feedback box. Decide before Pilot B whether to keep it.
  const comments = {
    type: jsPsychSurveyText,
    questions: [{ prompt: "Any comments about the study, for example sound problems or anything unclear? (optional)", name: "comments", rows: 4 }],
    data: { task: "comments" },
  };

  // -------------------------------------------------------------------------
  // 9. Debrief
  // -------------------------------------------------------------------------
  const debrief = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <h2>Debrief</h2>
      <p>Thank you. This study tests whether hearing an unexpected sound changes the decisions people
      make. Most choices followed the common tone sequence, and some followed a rare one. The tones
      had no connection to the gambles: every gamble was a true 50/50 chance, whatever you heard.
      The points did not affect your payment.</p>
      <p>If you have questions about this research, contact
      <a href="mailto:${EXPERIMENT.contact_email}">${EXPERIMENT.contact_email}</a>.
      Press the button to save your responses and finish.</p>`,
    choices: ["Finish"],
    data: { task: "debrief" },
  };

  await jsPsych.run([
    consent,
    welcome,
    calibration,
    hpIntro,
    headphoneCheck,
    familiarization,
    checkIntro,
    sequenceCheck("pre", true),
    taskInstructions,
    ...taskTrials,
    taskDone,
    sequenceCheck("post", false),
    demographics,
    comments,
    debrief,
  ]);
})();
