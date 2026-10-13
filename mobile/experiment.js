/*
 * Replication of Feng & Rutledge (2024), "Surprising sounds influence risky decision making",
 * Nature Communications 15, 8027, Experiment 2.
 * PHONE/TABLET-FRIENDLY, ENGLISH/INDONESIAN VERSION (folder mobile/, live at https://psych251.github.io/feng2024/mobile/).
 *
 * Differences from the main (computer-only, English) version; list them in the Differences table
 * if this version is used:
 *   - Participants first choose English or Bahasa Indonesia; every participant-facing text is
 *     shown in that language (field `language`). The Indonesian consent text is a translation of
 *     the course-approved wording and needs the teaching team's approval before use.
 *   - Phones and tablets are allowed (requires_keyboard: false). Choices are made by tapping or
 *     clicking an option box; on a computer the b / n keys also work. Each choice records
 *     `response_method` (key, tap, click or pen); device facts are recorded per participant.
 *   - Headphone screen shortened from 6 trials (pass = 5+) to 2 trials (pass = both correct),
 *     and each set of tones can be replayed (field `replays`), as in the lite version.
 *   - PHQ-8 and GAD-7 removed.
 *
 * Design summary
 *   IV       Tone sequence before each choice, within subjects: common AAAAAA (90 trials) vs
 *            rare AAAAAB / AAAAAC (30 trials). A = 1000 Hz, B = 1500 Hz, C = 500 Hz.
 *   DV       Choice of the 50/50 gamble vs the sure option on every trial: field `chose_risky`
 *            (1/0) on rows with task "choice". Key test: % risky on rare minus common trials,
 *            per participant, two-sided Wilcoxon signed-rank test. Also logged: rt, outcome,
 *            points, `stay` (same choice as the previous trial), response_method.
 *   Trials   120 choice trials (field option_type = gain, mixed or loss). Each: 3-s fixation
 *            while six 100-ms tones play 400 ms apart; options (self-paced); a chosen gamble
 *            resolves after 1.3 s and its outcome shows for 1 s; a chosen sure option shows for
 *            2 s. 500-point starting balance, running total always visible.
 *   Lists    As in the authors' Experiment 2 data: 40 Gain, 40 Mixed, 40 Loss; each multiplier 5
 *            times per type; sure loss always -25; exactly 3 rare in every 12; rare endings B or C
 *            at random; risky side random at the start, swapping every 10 trials.
 *   Checks   Headphone screen (Woods et al., 2017 stimuli, 2 trials, pass = both correct,
 *            replay allowed; failing ends the study). Common-sequence identification: 2 trials with feedback before the
 *            task, 2 without feedback after it. No other exclusions.
 *   After    Demographics, optional comments (pilot only). No PHQ-8 / GAD-7.
 */

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
window.TEMPLATE_VERSION = "0.1.0";

const EXPERIMENT = {
  // Its own id, so this version's data never mix with the main version's:
  // feng2024-mb-pilot-a -> feng2024-mb-pilot-b -> feng2024-mb-final.
  id: "feng2024-mb-pilot-a",
  chunk_size: 10,          // ~140 rows per participant -> ~17 writes each
  save_full_data_at_end: true,
  prolific_completion_code: "",
  // Code for people who fail the headphone screen. Check the Class Prolific Guidelines first.
  prolific_screenout_code: "",
  contact_email: "stanfordpsych251@gmail.com",
  // Phones and tablets are allowed: choices can be made by tapping the option boxes.
  requires_keyboard: false,
};

const TIMING = {
  iti: 3000, tone_lead: 100, tone: 100, tone_soa: 500,
  gamble_delay: 1300, outcome: 1000, safe: 2000, feedback: 1500,
};
const FREQ = { A: 1000, B: 1500, C: 500 };
// Headphone screen length and pass rule (Woods et al. used 6 trials, pass = 5+ correct).
const HP_TRIALS = 2;
const HP_PASS = 2;
const TONE_LEVEL = 0.25;

function hasFinePointer() {
  return !!(window.matchMedia && window.matchMedia("(any-pointer: fine)").matches);
}

const URL_PARAMS = new URLSearchParams(window.location.search);
const USE_EMULATOR = URL_PARAMS.get("emulator") === "1";
const CHUNK_SIZE = Number(URL_PARAMS.get("chunk_size")) || EXPERIMENT.chunk_size;
if (USE_EMULATOR && URL_PARAMS.get("cc")) EXPERIMENT.prolific_completion_code = URL_PARAMS.get("cc");
// Test-only: `?fast=1` shrinks every timing (localhost only).
const FAST = URL_PARAMS.get("fast") === "1" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
const T = (ms) => (FAST ? Math.max(10, Math.round(ms * 0.02)) : ms);

// ---------------------------------------------------------------------------
// Text in both languages. LANG is set on the first screen.
// ---------------------------------------------------------------------------
let LANG = "en";
const TEXT = {
  en: {
    consent_title: "Consent",
    consent: (email) => `By answering the following questions, you are participating in a study being performed by
      cognitive scientists in the Stanford Department of Psychology. If you have questions about
      this research, please contact us at <a href="mailto:${email}">${email}</a>.
      You must be at least 18 years old to participate. Your participation in this research is
      voluntary. You may decline to answer any or all of the following questions. You may decline
      further participation, at any time, without adverse consequences. Your anonymity is assured;
      the researchers who have requested your participation will not receive any personal
      information about you.`,
    agree: "I agree to participate", disagree: "I do not agree",
    next: "Next", previous: "Previous", continue: "Continue", play: "Play", finish: "Finish",
    progress: "Completion Progress",
    welcome: `<h2>Welcome</h2>
      <p>In this study you will play a short decision game while listening to sequences of tones.
      It takes about 20 minutes.</p>
      <p><strong>Please wear headphones</strong> and complete the study in one sitting, in a quiet place.</p>`,
    calibration: (btn) => `<h2>Volume calibration</h2>
      <p>Put on your headphones. Press the button, then turn up the volume on your device until the
      sound is at a loud but comfortable level. Play it as many times as you like.</p>
      <p style="text-align:center">${btn}</p>
      <p>Press Continue when the volume is set.</p>`,
    play_calibration: "Play calibration sound",
    hp_intro: `<h2>Sound check</h2>
      <p>On each of the next 2 screens you will hear three tones, one after another. One of them is
      <strong>quieter</strong> than the other two. After the tones, select the number (1, 2 or 3) of the
      quietest tone. Listen carefully. If you missed it, you can press Replay to hear the set again.</p>`,
    hp_question: "Which tone was the quietest?", hp_listen: "Listen…",
    hp_answer: "Select 1, 2 or 3, or press Replay to hear it again.", replay: "Replay",
    fam: (common, rare) => `<h2>Tone sequences</h2>
      <p>During this experiment, you will hear different tone sequences. Listen carefully to each one.
      Pay attention to which sequences are common and which are rare.</p>
      <div class="fam-row"><strong>COMMON</strong><br>${common}</div>
      <div class="fam-row"><strong>RARE</strong><br>${rare}</div>
      <p>Play each sequence at least once, then press Continue.</p>`,
    check_intro: `<h2>Tone sequences check</h2>
      <p>Let's make sure that you can tell the sequences apart. On the next two screens, play both
      sequences and choose the one that is the common sequence.</p>`,
    check_question: "Listen to both sequences. Which is the more common sequence?",
    left_label: "LEFT", right_label: "RIGHT", left: "Left", right: "Right",
    fb_ok: "Correct: that was the common sequence.",
    fb_no: "Not quite: the other one was the common sequence.",
    task1: (example) => `<h2>Risky decision game: how to play</h2>
      <p>Win as many points as you can. You start with <strong>500 points</strong>.</p>
      <p>On each trial, choose the <strong>safe</strong> option or the <strong>risky</strong> option.
      The risky options are 50/50 gambles, with equal probabilities of getting either outcome.
      Choose wisely!</p>
      <p>To choose, <strong>tap or click</strong> the option you want. On a computer you can also press
      <strong>b</strong> for the left option and <strong>n</strong> for the right option.</p>
      ${example}`,
    risky_label: "Risky gamble (50/50)", safe_label: "Guaranteed prize",
    task2: `<p>Before each choice you will see a cross in the middle of the screen and hear a sequence
      of tones. Just listen to the tones.</p>
      <p>The left and right positions of the risky and safe options may switch during the game,
      so check where each option is before you respond.</p>
      <p>There are 120 choices. Press Next when you are ready to begin.</p>`,
    points: "Points",
    done: (p) => `<h2>Game complete</h2><p>You finished the game with <strong>${p} points</strong>.
      Next come a few short questions.</p>`,
    age: "How old are you?", gender: "What is your gender?",
    genders: ["Woman", "Man", "Non-binary"], other: "Other", prefer_not: "Prefer not to say",
    comments: "Any comments about the study, for example sound problems or anything unclear? (optional)",
    debrief: (email) => `<h2>Debrief</h2>
      <p>Thank you. This study tests whether hearing an unexpected sound changes the decisions people
      make. Most choices followed the common tone sequence, and some followed a rare one. The tones
      had no connection to the gambles: every gamble was a true 50/50 chance, whatever you heard.
      The points did not affect your payment.</p>
      <p>If you have questions about this research, contact <a href="mailto:${email}">${email}</a>.
      Press the button to save your responses and finish.</p>`,
    saving: "Saving your responses…",
    thanks: "Thank you",
    declined: (prolific) => `You chose not to participate. You may close this window${prolific ? " and return the study on Prolific" : ""}.`,
    screened: (code) => `This study needs headphones, and the sound check suggests they may not be in use, so the study ends here. ${code ? `Your code is <strong>${code}</strong>.` : "Please return the study on Prolific."}`,
    returning: "Saved. Returning you to Prolific…",
    all_done: "All done",
    saved: "Your responses were saved. Thank you for participating!",
    code: (c) => `Your completion code is <strong>${c}</strong>.`,
  },
  id: {
    // Translation of the course-approved consent text: needs the teaching team's approval before use.
    consent_title: "Persetujuan",
    consent: (email) => `Dengan menjawab pertanyaan-pertanyaan berikut, Anda berpartisipasi dalam sebuah penelitian
      yang dilakukan oleh para ilmuwan kognitif di Departemen Psikologi Stanford. Jika Anda memiliki
      pertanyaan tentang penelitian ini, silakan hubungi kami di <a href="mailto:${email}">${email}</a>.
      Anda harus berusia minimal 18 tahun untuk berpartisipasi. Partisipasi Anda dalam penelitian ini
      bersifat sukarela. Anda boleh menolak menjawab sebagian atau seluruh pertanyaan berikut. Anda boleh
      berhenti berpartisipasi kapan saja tanpa konsekuensi yang merugikan. Anonimitas Anda terjamin; para
      peneliti yang meminta partisipasi Anda tidak akan menerima informasi pribadi apa pun tentang Anda.`,
    agree: "Saya setuju untuk berpartisipasi", disagree: "Saya tidak setuju",
    next: "Berikutnya", previous: "Sebelumnya", continue: "Lanjutkan", play: "Putar", finish: "Selesai",
    progress: "Kemajuan",
    welcome: `<h2>Selamat datang</h2>
      <p>Dalam penelitian ini, Anda akan memainkan permainan pengambilan keputusan singkat sambil
      mendengarkan rangkaian nada. Penelitian ini memakan waktu sekitar 20 menit.</p>
      <p><strong>Harap gunakan headphone</strong> dan selesaikan penelitian ini dalam satu kali duduk,
      di tempat yang tenang.</p>`,
    calibration: (btn) => `<h2>Kalibrasi volume</h2>
      <p>Pakai headphone Anda. Tekan tombol, lalu naikkan volume perangkat Anda hingga suaranya cukup
      keras tetapi tetap nyaman. Anda boleh memutarnya sesering yang Anda mau.</p>
      <p style="text-align:center">${btn}</p>
      <p>Tekan Lanjutkan setelah volume selesai diatur.</p>`,
    play_calibration: "Putar suara kalibrasi",
    hp_intro: `<h2>Pemeriksaan suara</h2>
      <p>Pada masing-masing dari 2 layar berikutnya, Anda akan mendengar tiga nada secara berurutan.
      Salah satunya <strong>lebih pelan</strong> daripada dua nada lainnya. Setelah nada selesai, pilih
      nomor (1, 2, atau 3) dari nada yang paling pelan. Dengarkan baik-baik. Jika Anda melewatkannya,
      Anda dapat menekan Putar ulang untuk mendengarkan rangkaian nada tersebut lagi.</p>`,
    hp_question: "Nada mana yang paling pelan?", hp_listen: "Dengarkan…",
    hp_answer: "Pilih 1, 2, atau 3, atau tekan Putar ulang untuk mendengarkannya lagi.", replay: "Putar ulang",
    fam: (common, rare) => `<h2>Rangkaian nada</h2>
      <p>Selama penelitian ini, Anda akan mendengar beberapa rangkaian nada yang berbeda. Dengarkan setiap
      rangkaian dengan saksama. Perhatikan rangkaian mana yang sering muncul dan mana yang jarang muncul.</p>
      <div class="fam-row"><strong>SERING</strong><br>${common}</div>
      <div class="fam-row"><strong>JARANG</strong><br>${rare}</div>
      <p>Putar setiap rangkaian minimal satu kali, lalu tekan Lanjutkan.</p>`,
    check_intro: `<h2>Pemeriksaan rangkaian nada</h2>
      <p>Mari pastikan Anda dapat membedakan rangkaian-rangkaian tersebut. Pada dua layar berikutnya,
      putar kedua rangkaian dan pilih rangkaian yang sering muncul.</p>`,
    check_question: "Dengarkan kedua rangkaian. Rangkaian mana yang lebih sering muncul?",
    left_label: "KIRI", right_label: "KANAN", left: "Kiri", right: "Kanan",
    fb_ok: "Benar: itu rangkaian yang sering muncul.",
    fb_no: "Kurang tepat: rangkaian yang satunya adalah rangkaian yang sering muncul.",
    task1: (example) => `<h2>Permainan keputusan berisiko: cara bermain</h2>
      <p>Kumpulkan poin sebanyak mungkin. Anda mulai dengan <strong>500 poin</strong>.</p>
      <p>Pada setiap putaran, pilih opsi <strong>aman</strong> atau opsi <strong>berisiko</strong>.
      Opsi berisiko adalah taruhan 50/50, dengan peluang yang sama untuk mendapatkan salah satu dari
      kedua hasilnya. Pilihlah dengan bijak!</p>
      <p>Untuk memilih, <strong>ketuk atau klik</strong> opsi yang Anda inginkan. Di komputer, Anda juga
      dapat menekan <strong>b</strong> untuk opsi kiri dan <strong>n</strong> untuk opsi kanan.</p>
      ${example}`,
    risky_label: "Taruhan berisiko (50/50)", safe_label: "Hadiah pasti",
    task2: `<p>Sebelum setiap pilihan, Anda akan melihat tanda silang di tengah layar dan mendengar
      serangkaian nada. Cukup dengarkan nada-nadanya.</p>
      <p>Posisi kiri dan kanan untuk opsi berisiko dan opsi aman dapat bertukar selama permainan, jadi
      periksa letak setiap opsi sebelum Anda menjawab.</p>
      <p>Ada 120 pilihan. Tekan Berikutnya jika Anda sudah siap untuk mulai.</p>`,
    points: "Poin",
    done: (p) => `<h2>Permainan selesai</h2><p>Anda menyelesaikan permainan dengan <strong>${p} poin</strong>.
      Selanjutnya ada beberapa pertanyaan singkat.</p>`,
    age: "Berapa usia Anda?", gender: "Apa identitas gender Anda?",
    genders: ["Perempuan", "Laki-laki", "Non-biner"], other: "Lainnya", prefer_not: "Memilih untuk tidak menjawab",
    comments: "Ada komentar tentang penelitian ini, misalnya masalah suara atau hal yang kurang jelas? (opsional)",
    debrief: (email) => `<h2>Penjelasan penelitian</h2>
      <p>Terima kasih. Penelitian ini menguji apakah mendengar suara yang tidak terduga dapat mengubah
      keputusan yang diambil seseorang. Sebagian besar pilihan didahului oleh rangkaian nada yang sering
      muncul, dan sebagian lagi oleh rangkaian yang jarang muncul. Nada-nada tersebut tidak berhubungan
      dengan taruhan: setiap taruhan benar-benar memiliki peluang 50/50, apa pun yang Anda dengar. Poin
      tidak memengaruhi pembayaran Anda.</p>
      <p>Jika Anda memiliki pertanyaan tentang penelitian ini, hubungi <a href="mailto:${email}">${email}</a>.
      Tekan tombol untuk menyimpan jawaban Anda dan menyelesaikan penelitian.</p>`,
    saving: "Menyimpan jawaban Anda…",
    thanks: "Terima kasih",
    declined: (prolific) => `Anda memilih untuk tidak berpartisipasi. Anda boleh menutup jendela ini${prolific ? " dan mengembalikan studi di Prolific" : ""}.`,
    screened: (code) => `Penelitian ini memerlukan headphone, dan hasil pemeriksaan suara menunjukkan bahwa headphone mungkin tidak digunakan, sehingga penelitian berakhir di sini. ${code ? `Kode Anda adalah <strong>${code}</strong>.` : "Silakan kembalikan studi di Prolific."}`,
    returning: "Tersimpan. Mengalihkan Anda kembali ke Prolific…",
    all_done: "Selesai",
    saved: "Jawaban Anda telah tersimpan. Terima kasih atas partisipasi Anda!",
    code: (c) => `Kode penyelesaian Anda adalah <strong>${c}</strong>.`,
  },
};
const t = (key) => TEXT[LANG][key] ?? TEXT.en[key];

// ---------------------------------------------------------------------------
// Sound: pure tones synthesized with the Web Audio API (no audio files).
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

function gambleBox(tr, only) {
  const filler = '<div class="cell blank"></div>';
  const top = only === "loss" ? filler : `<div class="cell ${cls(tr.gamble_win)}">${fmt(tr.gamble_win)}</div>`;
  const bottom = only === "win" ? filler : `<div class="cell ${cls(tr.gamble_loss)}">${fmt(tr.gamble_loss)}</div>`;
  return `<div class="opt gamble${only ? " resolved" : ""}">${top}${bottom}</div>`;
}
function safeBox(tr) {
  return `<div class="opt safe"><div class="cell ${cls(tr.certain)}">${fmt(tr.certain)}</div></div>`;
}
function panel(inner, points, extraClass = "", attrs = "") {
  return `
    <div class="score">${t("points")}: <span class="points">${points}</span></div>
    <div class="task-panel ${extraClass}" ${attrs}>
      <div class="fix">+</div>
      ${inner}
    </div>`;
}
function placed(html, side) {
  return `<div class="slot ${side}" data-side="${side}">${html}</div>`;
}
function playButtons(labels) {
  return labels.map(([id, label]) => `<button type="button" class="jspsych-btn play-btn" data-play="${id}">&#9654; ${label}</button>`).join(" ");
}
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
  const fine = hasFinePointer();
  const deviceSupported = !EXPERIMENT.requires_keyboard || fine;
  const device = {
    device_pointer: fine ? "fine" : "coarse",
    touch_capable: (navigator.maxTouchPoints || 0) > 0,
    screen_width: window.screen ? window.screen.width : null,
    screen_height: window.screen ? window.screen.height : null,
  };

  const saver = await DataSaver.init({
    experiment_id: EXPERIMENT.id,
    chunk_size: CHUNK_SIZE,
    save_full_data_at_end: EXPERIMENT.save_full_data_at_end,
    use_emulator: USE_EMULATOR,
    contact_email: EXPERIMENT.contact_email,
  });
  window.__saver = saver;
  saver.updateParticipant({ device_supported: deviceSupported, requires_keyboard: EXPERIMENT.requires_keyboard, ...device });

  if (!deviceSupported) {
    document.body.innerHTML = '<div id="device-unsupported" class="jspsych-content"><h2>Please use a computer</h2></div>';
    return;
  }

  let screenedOut = false;

  const jsPsych = initJsPsych({
    show_progress_bar: true,
    auto_update_progress_bar: true,
    on_data_update: (trial) => saver.onTrial(trial),
    on_finish: async () => {
      const el = jsPsych.getDisplayElement();
      el.innerHTML = `<div id="finish-message"><p class="thanks">${t("saving")}</p></div>`;
      const result = await saver.finish(jsPsych);
      const consentRow = jsPsych.data.get().filter({ task: "consent" }).values()[0];
      const consented = !consentRow || consentRow.consented !== false;
      const msg = document.getElementById("finish-message");
      const cc = EXPERIMENT.prolific_completion_code, sc = EXPERIMENT.prolific_screenout_code;

      if (!consented) {
        msg.innerHTML = `<h2 class='thanks'>${t("thanks")}</h2><p class='thanks'>${t("declined")(!!cc)}</p>`;
        return;
      }
      if (screenedOut) {
        if (result.ok && sc && !USE_EMULATOR) {
          window.location.href = "https://app.prolific.com/submissions/complete?cc=" + sc;
          return;
        }
        msg.innerHTML = `<h2 class='thanks' id='screened-out'>${t("thanks")}</h2><p class='thanks'>${t("screened")(sc)}</p>`;
        return;
      }
      if (result.ok && cc && !USE_EMULATOR) {
        msg.innerHTML = `<p class='thanks'>${t("returning")}</p>`;
        window.location.href = "https://app.prolific.com/submissions/complete?cc=" + cc;
        return;
      }
      msg.innerHTML = `<h2 class='thanks' id='all-done'>${t("all_done")}</h2>` +
        (result.ok ? `<p class='thanks'>${t("saved")}</p>` : "") +
        (cc ? `<p class='thanks'>${t("code")(cc)}</p>` : "");
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
    ...device,
  });
  saver.updateParticipant({ design: "within-subjects", risky_start_side: list.startSide, fast_mode: FAST });

  const nav = { show_clickable_nav: true, button_label_next: () => t("next"), button_label_previous: () => t("previous") };

  // -------------------------------------------------------------------------
  // 0. Language (shown in both languages)
  // -------------------------------------------------------------------------
  const language = {
    type: jsPsychHtmlButtonResponse,
    stimulus: '<h2 class="lang-title">Choose your language<br><span>Pilih bahasa</span></h2>',
    choices: ["English", "Bahasa Indonesia"],
    data: { task: "language" },
    on_finish: (data) => {
      LANG = data.response === 1 ? "id" : "en";
      data.language = LANG;
      document.documentElement.lang = LANG;
      jsPsych.data.addProperties({ language: LANG });
      saver.updateParticipant({ language: LANG });
      const label = document.querySelector("#jspsych-progressbar-container span");
      if (label) label.textContent = t("progress");
    },
  };

  // -------------------------------------------------------------------------
  // 1. Consent (course-wide text; the Indonesian translation needs approval)
  // -------------------------------------------------------------------------
  const consent = {
    type: jsPsychHtmlButtonResponse,
    stimulus: () => `<div class="consent"><h2>${t("consent_title")}</h2><p>${t("consent")(EXPERIMENT.contact_email)}</p></div>`,
    choices: () => [t("agree"), t("disagree")],
    data: { task: "consent" },
    on_finish: (data) => {
      data.consented = data.response === 0;
      if (!data.consented) jsPsych.abortExperiment();
    },
  };

  const welcome = { type: jsPsychInstructions, pages: () => [t("welcome")], ...nav, data: { task: "instructions", page_set: "welcome" } };

  // -------------------------------------------------------------------------
  // 2. Volume calibration (also unlocks audio, which browsers only allow after a tap or click)
  // -------------------------------------------------------------------------
  let calibrationPlays = 0;
  const calibration = {
    type: jsPsychHtmlButtonResponse,
    stimulus: () => t("calibration")(playButtons([["cal", t("play_calibration")]])),
    choices: () => [t("continue")],
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
  // 3. Headphone screen (Woods et al., 2017)
  // -------------------------------------------------------------------------
  const hpIntro = { type: jsPsychInstructions, pages: () => [t("hp_intro")], ...nav, data: { task: "instructions", page_set: "headphone" } };
  const hpOrders = [...Array(HP_TRIALS)].map(() => {
    const [quiet, anti] = jsPsych.randomization.sampleWithoutReplacement([0, 1, 2], 2);
    return { quiet, anti };
  });
  let hpReady = false;
  let hpReplays = 0;
  let screenCount = 0; // unique data-n per check screen, for the test robot
  const hpTrial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: () => `
      <div class="hp-trial" data-n="${++screenCount}" data-correct="${jsPsych.evaluateTimelineVariable("quiet") + 1}">
        <p>${t("hp_question")}</p>
        <p class="hp-status">${t("hp_listen")}</p>
        <p><button type="button" class="jspsych-btn hp-replay" disabled>&#8635; ${t("replay")}</button></p>
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
        if (status) status.textContent = t("hp_listen");
        Sound.woods(quiet, anti);
        setTimeout(() => {
          hpReady = true;
          refresh();
          replayBtn.disabled = false;
          if (status) status.textContent = t("hp_answer");
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
  // 4. Sequence familiarization and the common-sequence check
  // -------------------------------------------------------------------------
  const familiarization = {
    type: jsPsychHtmlButtonResponse,
    stimulus: () => t("fam")(playButtons([["AAAAAA", t("play")]]), playButtons([["AAAAAB", t("play")], ["AAAAAC", t("play")]])),
    choices: () => [t("continue")],
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
          <p>${t("check_question")}</p>
          <div class="seq-pair">
            <div><strong>${t("left_label")}</strong><br>${playButtons([["left", t("play")]])}</div>
            <div><strong>${t("right_label")}</strong><br>${playButtons([["right", t("play")]])}</div>
          </div>
        </div>`,
      choices: () => [t("left"), t("right")],
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
        ? `<p class="feedback ok">${t("fb_ok")}</p>`
        : `<p class="feedback no">${t("fb_no")}</p>`),
      choices: "NO_KEYS",
      trial_duration: T(TIMING.feedback),
      record_data: false,
    };
    return { timeline: withFeedback ? [check, feedback] : [check], timeline_variables: items };
  }

  const checkIntro = { type: jsPsychInstructions, pages: () => [t("check_intro")], ...nav, data: { task: "instructions", page_set: "sequence_check" } };

  // -------------------------------------------------------------------------
  // 5. Task instructions
  // -------------------------------------------------------------------------
  const example = { gamble_win: 80, gamble_loss: -96, certain: 0 };
  const taskInstructions = {
    type: jsPsychInstructions,
    pages: () => [
      t("task1")(`<div class="example">
         ${panel(placed(gambleBox(example), "left") + placed(safeBox(example), "right"), 500, "example-panel")}
         <div class="example-labels"><span>${t("risky_label")}</span><span>${t("safe_label")}</span></div>
       </div>`),
      t("task2"),
    ],
    ...nav,
    data: { task: "instructions", page_set: "task" },
  };

  // -------------------------------------------------------------------------
  // 6. The 120 choice trials. Tap or click an option box; on a computer b / n also work.
  // -------------------------------------------------------------------------
  let points = 500;
  let previousChoice = null;
  let audioInfo = {};
  let current = null;

  const taskTrials = list.trials.flatMap((tr) => {
    const gambleSide = tr.risky_side;
    const safeSide = gambleSide === "left" ? "right" : "left";

    const iti = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: () => panel("", points),
      choices: "NO_KEYS",
      trial_duration: T(TIMING.iti),
      record_data: false,
      on_load: () => {
        audioInfo = FAST ? { audio_ok: null } : Sound.sequence(tr.sequence, T(TIMING.tone_lead));
      },
    };

    const choice = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: () => panel(
        placed(gambleBox(tr), gambleSide) + placed(safeBox(tr), safeSide),
        points, "choice-screen", `data-risky-side="${gambleSide}" data-trial="${tr.trial_number}"`),
      choices: ["b", "n"],
      save_trial_parameters: { stimulus: false },
      data: {
        task: "choice",
        trial_number: tr.trial_number,
        block12: tr.block12,
        side_block: tr.side_block,
        option_type: tr.trial_type, // "trial_type" is reserved by jsPsych (plugin name)
        certain: tr.certain,
        gamble_win: tr.gamble_win,
        gamble_loss: tr.gamble_loss,
        multiplier: tr.multiplier,
        sequence: tr.sequence,
        rare: tr.rare,
        deviant: tr.rare ? tr.sequence.slice(-1) : null,
        risky_side: gambleSide,
      },
      on_load: () => {
        // Tap / click on an option box ends the trial the same way a key press does.
        const t0 = performance.now();
        let pointerType = null, done = false;
        document.querySelectorAll(".choice-screen .slot").forEach((slot) => {
          slot.addEventListener("pointerdown", (e) => { pointerType = e.pointerType; });
          slot.addEventListener("click", () => {
            if (done) return;
            done = true;
            jsPsych.pluginAPI.cancelAllKeyboardResponses();
            jsPsych.finishTrial({
              rt: Math.round(performance.now() - t0),
              response: slot.dataset.side === "left" ? "b" : "n",
              response_method: pointerType === "touch" ? "tap" : pointerType === "pen" ? "pen" : "click",
            });
          });
        });
      },
      on_finish: (data) => {
        Object.assign(data, audioInfo);
        data.response_method = data.response_method || "key";
        data.chosen_side = data.response === "b" ? "left" : "right";
        data.chose_risky = data.chosen_side === gambleSide ? 1 : 0;
        data.stay = previousChoice === null ? null : (data.chose_risky === previousChoice ? 1 : 0);
        data.points_before = points;
        if (data.chose_risky) {
          data.gamble_won = Math.random() < 0.5 ? 1 : 0;
          data.outcome = data.gamble_won ? tr.gamble_win : tr.gamble_loss;
        } else {
          data.gamble_won = null;
          data.outcome = tr.certain;
        }
        points += data.outcome;
        data.points_after = points;
        previousChoice = data.chose_risky;
        current = data;
      },
    };

    const resolve = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: () => current.chose_risky
        ? panel(placed(gambleBox(tr), gambleSide), current.points_before)
        : panel(placed(safeBox(tr), safeSide), current.points_after),
      choices: "NO_KEYS",
      trial_duration: () => (current.chose_risky ? T(TIMING.gamble_delay) : T(TIMING.safe)),
      record_data: false,
    };

    const outcome = {
      timeline: [{
        type: jsPsychHtmlKeyboardResponse,
        stimulus: () => panel(placed(gambleBox(tr, current.gamble_won ? "win" : "loss"), gambleSide), current.points_after),
        choices: "NO_KEYS",
        trial_duration: T(TIMING.outcome),
        record_data: false,
      }],
      conditional_function: () => current.chose_risky === 1,
    };

    return [iti, choice, resolve, outcome];
  });

  const taskDone = { type: jsPsychInstructions, pages: () => [t("done")(points)], ...nav, data: { task: "instructions", page_set: "task_done" } };

  // -------------------------------------------------------------------------
  // 7. Demographics and comments (no PHQ-8 / GAD-7 in this version)
  // -------------------------------------------------------------------------
  const demographics = {
    type: jsPsychSurvey,
    survey_json: () => ({
      showQuestionNumbers: "off",
      completeText: t("continue"),
      pages: [{
        elements: [
          { type: "text", name: "age", title: t("age"), inputType: "number", min: 18, max: 120 },
          {
            type: "radiogroup", name: "gender", title: t("gender"),
            choices: t("genders"), showOtherItem: true, otherText: t("other"),
            showNoneItem: true, noneText: t("prefer_not"),
          },
        ],
      }],
    }),
    data: { task: "demographics" },
  };

  const comments = {
    type: jsPsychSurveyText,
    questions: () => [{ prompt: t("comments"), name: "comments", rows: 4 }],
    button_label: () => t("continue"),
    data: { task: "comments" },
  };

  // -------------------------------------------------------------------------
  // 8. Debrief
  // -------------------------------------------------------------------------
  const debrief = {
    type: jsPsychHtmlButtonResponse,
    stimulus: () => t("debrief")(EXPERIMENT.contact_email),
    choices: () => [t("finish")],
    data: { task: "debrief" },
  };

  await jsPsych.run([
    language,
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
