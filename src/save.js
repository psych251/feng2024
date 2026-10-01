/*
 * DataSaver: writes jsPsych data to the student's Firestore project.
 *
 * Usage (see experiment.js):
 *   const saver = await DataSaver.init({ experiment_id: "my-exp", chunk_size: 1, ... });
 *   const jsPsych = initJsPsych({
 *     on_data_update: (trial) => saver.onTrial(trial),
 *     on_finish: async () => { await saver.finish(jsPsych); ... },
 *   });
 *
 * What it does:
 *   - Signs the participant in anonymously (Firebase Auth) so rules can key writes to a uid.
 *   - Creates experiments/<id>/participants/<uid> at start, updates it at the end.
 *   - Appends trials in chunks to experiments/<id>/participants/<uid>/trials/<chunk>.
 *     chunk_size = 1 writes every trial (best for dropouts); larger chunks save quota.
 *   - Logs uncaught JS errors to experiments/<id>/errors so you can debug remote participants.
 *   - Falls back to an "offline" mode (banner + JSON download) if Firebase is unconfigured,
 *     unreachable, or anonymous sign-in is disabled. Data is never silently lost.
 *
 * Modes: "firebase" (live), "emulator" (local Firestore emulator), "offline" (no saving).
 */
(function () {
  "use strict";

  const PLACEHOLDER = "PASTE_ME";
  const MAX_ERRORS_PER_SESSION = 20;
  const AUTH_TIMEOUT_MS = 12000;
  const MAX_FULL_DATA_BYTES = 800000; // stay under Firestore's 1 MiB document limit
  const FINISH_TIMEOUT_MS = 20000; // if writes are still pending after this, offer the download instead of hanging

  function pad(n, width) {
    return String(n).padStart(width, "0");
  }

  // Firestore rejects `undefined`, NaN, and arrays nested directly inside arrays.
  // jsPsych data can contain all three. Clean it without losing information.
  function sanitize(value, insideArray) {
    if (value === undefined || value === null) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "function") return null;
    if (Array.isArray(value)) {
      if (insideArray) return JSON.stringify(value); // array-in-array -> string
      return value.map((v) => sanitize(v, true));
    }
    if (typeof value === "object") {
      const out = {};
      for (const k of Object.keys(value)) {
        const v = sanitize(value[k], false);
        if (v !== undefined) out[k] = v;
      }
      return out;
    }
    return value;
  }

  // A short random id for THIS page load. Combined with the anonymous uid it names the
  // participant document, so a reload or a second run in the same browser always writes a
  // fresh document instead of overwriting the previous one.
  function makeRunId() {
    const c = window.crypto;
    if (c && typeof c.randomUUID === "function") return c.randomUUID().split("-")[0];
    if (c && c.getRandomValues) {
      const a = new Uint8Array(4);
      c.getRandomValues(a);
      return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
    }
    return Math.random().toString(16).slice(2, 10);
  }

  function urlParams() {
    const out = {};
    new URLSearchParams(window.location.search).forEach((v, k) => (out[k] = v));
    return out;
  }

  function showBanner(text, kind) {
    let el = document.getElementById("data-saver-banner");
    if (!el) {
      el = document.createElement("div");
      el.id = "data-saver-banner";
      el.style.cssText =
        "position:fixed;top:0;left:0;right:0;z-index:9999;padding:6px 12px;font:13px/1.4 system-ui,sans-serif;text-align:center;";
      document.body.appendChild(el);
    }
    el.dataset.kind = kind;
    el.style.background = kind === "offline" ? "#7a1f1f" : "#1f4f7a";
    el.style.color = "#fff";
    el.textContent = text;
  }

  function isConfigured(cfg) {
    return cfg && typeof cfg.projectId === "string" && cfg.projectId && cfg.projectId !== PLACEHOLDER
      && cfg.apiKey && cfg.apiKey !== PLACEHOLDER;
  }

  function withTimeout(promise, ms, label) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(label + " timed out after " + ms + "ms")), ms);
      promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
    });
  }

  class DataSaver {
    constructor(opts) {
      this.opts = Object.assign(
        {
          experiment_id: "experiment",
          chunk_size: 1,
          save_full_data_at_end: true,
          use_emulator: false,
          emulator_host: "localhost",
          firebase_config: window.FIREBASE_CONFIG,
          contact_email: null,   // shown in the download-fallback box
          show_banner: true,
        },
        opts || {}
      );
      this.mode = "offline";
      this.reason = "";
      this.uid = null;      // anonymous auth id: the browser
      this.runId = makeRunId(); // this page load
      this.docId = null;    // "<uid>-<runId>": the participant document for this run
      this.db = null;
      this.buffer = [];
      this.chunkIndex = 0;
      this.trialCount = 0;
      this.currentTrialIndex = null;
      this.pending = [];
      this.stats = { writes_ok: 0, writes_failed: 0, errors_logged: 0 };
      this._writeFailureReported = false;
      this.allTrials = [];
      this.params = urlParams();
      this._errorCount = 0;
    }

    static async init(opts) {
      const s = new DataSaver(opts);
      await s._connect();
      s._installErrorHandlers();
      s._installUnloadFlush();
      return s;
    }

    // ---- connection -------------------------------------------------------

    async _connect() {
      const fb = window.firebaseBundle;
      const cfg = this.opts.firebase_config;
      const useEmulator = !!this.opts.use_emulator;

      if (!fb) return this._goOffline("lib/firebase-bundle.js did not load");
      if (!useEmulator && !isConfigured(cfg)) {
        return this._goOffline("firebase-config.js still has placeholder values");
      }
      try {
        const app = fb.initializeApp(
          useEmulator ? { apiKey: "demo-key", projectId: "demo-psych251", authDomain: "localhost" } : cfg
        );
        const auth = fb.getAuth(app);
        const db = fb.getFirestore(app);
        if (useEmulator) {
          fb.connectAuthEmulator(auth, "http://" + this.opts.emulator_host + ":9099", { disableWarnings: true });
          fb.connectFirestoreEmulator(db, this.opts.emulator_host, 8080);
        }
        const cred = await withTimeout(fb.signInAnonymously(auth), AUTH_TIMEOUT_MS, "anonymous sign-in");
        this.uid = cred.user.uid;
        this.docId = this.uid + "-" + this.runId;
        this.db = db;
        this.fb = fb;
        this.mode = useEmulator ? "emulator" : "firebase";
        if (useEmulator && this.opts.show_banner) showBanner("Emulator mode: data goes to the local Firestore emulator.", "emulator");
        await this._createParticipant();
      } catch (e) {
        const msg = (e && e.code) || (e && e.message) || String(e);
        let hint = "";
        if (/operation-not-allowed|admin-restricted/.test(msg)) {
          hint = " Enable Anonymous sign-in: Firebase console -> Security -> Authentication ->" +
                 " Sign-in method -> Anonymous (student guide step 2.4).";
        } else if (/api-key|invalid-api-key/.test(msg)) {
          hint = " Check firebase-config.js against the console.";
        } else if (/network|timed out/.test(msg)) {
          hint = " Network problem reaching Firebase.";
        }
        console.error("[DataSaver] Firebase connection failed:", e);
        this._goOffline("Firebase connection failed (" + msg + ")." + hint);
      }
    }

    _goOffline(reason) {
      this.mode = "offline";
      this.reason = reason;
      this.uid = "offline-" + Math.random().toString(36).slice(2, 10);
      this.docId = this.uid + "-" + this.runId;
      console.warn("[DataSaver] OFFLINE MODE: " + reason);
      if (this.opts.show_banner) showBanner("Data is NOT being saved to Firebase: " + reason, "offline");
    }

    _participantRef() {
      return this.fb.doc(this.db, "experiments", this.opts.experiment_id, "participants", this.docId);
    }

    async _createParticipant() {
      const info = {
        participant_id: this.docId,
        uid: this.uid,
        run_id: this.runId,
        experiment_id: this.opts.experiment_id,
        started_at: this.fb.serverTimestamp(),
        client_started_at: new Date().toISOString(),
        completed: false,
        url_params: sanitize(this.params),
        prolific_pid: this.params.PROLIFIC_PID || null,
        prolific_study_id: this.params.STUDY_ID || null,
        prolific_session_id: this.params.SESSION_ID || null,
        user_agent: navigator.userAgent,
        language: navigator.language,
        screen: { width: window.screen.width, height: window.screen.height },
        viewport: { width: window.innerWidth, height: window.innerHeight },
        page_url: window.location.href.split("?")[0],
        template_version: window.TEMPLATE_VERSION || null,
      };
      await this._track(() => this.fb.setDoc(this._participantRef(), info, { merge: true }), "create participant");
    }

    // ---- public API ---------------------------------------------------------

    /** Merge extra fields (e.g. condition) into the participant document. */
    updateParticipant(fields) {
      if (this.mode === "offline") return Promise.resolve();
      return this._track(() => this.fb.setDoc(this._participantRef(), sanitize(fields), { merge: true }), "update participant");
    }

    /** Call from jsPsych's on_data_update. */
    onTrial(trialData) {
      const clean = sanitize(trialData);
      this.allTrials.push(clean);
      this.trialCount += 1;
      this.currentTrialIndex = clean.trial_index != null ? clean.trial_index : this.trialCount - 1;
      if (this.mode === "offline") return;
      this.buffer.push(clean);
      if (this.buffer.length >= Math.max(1, this.opts.chunk_size)) this.flush();
    }

    /** Write buffered trials as one chunk document. Safe to call any time. */
    flush() {
      if (this.mode === "offline" || this.buffer.length === 0) return Promise.resolve();
      const trials = this.buffer;
      this.buffer = [];
      const idx = this.chunkIndex++;
      const ref = this.fb.doc(this.db, "experiments", this.opts.experiment_id, "participants", this.docId, "trials", "chunk-" + pad(idx, 5));
      const docData = {
        chunk_index: idx,
        n_trials: trials.length,
        first_trial_index: trials[0].trial_index != null ? trials[0].trial_index : null,
        last_trial_index: trials[trials.length - 1].trial_index != null ? trials[trials.length - 1].trial_index : null,
        saved_at: this.fb.serverTimestamp(),
        trials: trials,
      };
      // On final failure the trials are still in this.allTrials, so the JSON fallback has everything.
      return this._track(() => this.fb.setDoc(ref, docData), "write chunk " + idx);
    }

    /**
     * Call from jsPsych's on_finish. Flushes remaining trials, marks the participant
     * complete, waits for all writes, and returns { ok, mode, failed }.
     */
    async finish(jsPsych) {
      const full = jsPsych ? jsPsych.data.get().json() : JSON.stringify(this.allTrials);
      if (this.mode !== "offline") {
        this.flush();
        const update = {
          completed: true,
          ended_at: this.fb.serverTimestamp(),
          client_ended_at: new Date().toISOString(),
          n_trials: this.trialCount,
          n_chunks: this.chunkIndex,
        };
        if (this.opts.save_full_data_at_end) {
          if (full.length < MAX_FULL_DATA_BYTES) update.full_data = full;
          else update.full_data_omitted = "too large (" + full.length + " bytes)";
        }
        this._track(() => this.fb.setDoc(this._participantRef(), update, { merge: true }), "finish participant");
        // Firestore queues writes forever while offline, so do not wait forever: after the
        // timeout, fall through to the download fallback. Queued writes still complete if the
        // connection returns while the page stays open.
        let timedOut = false;
        await Promise.race([
          this._settle(),
          new Promise((r) => setTimeout(() => { timedOut = true; r(); }, FINISH_TIMEOUT_MS)),
        ]);
        if (timedOut) {
          this.stats.writes_timed_out = this.pending.length;
          console.warn("[DataSaver] " + this.pending.length + " write(s) still pending after " + FINISH_TIMEOUT_MS + "ms");
        }
      }
      const failed = this.stats.writes_failed > 0 || (this.stats.writes_timed_out || 0) > 0;
      const ok = this.mode !== "offline" && !failed;
      if (!ok) this._offerDownload(jsPsych, full);
      return { ok: ok, mode: this.mode, failed: failed, uid: this.uid, participant_id: this.docId,
               stats: Object.assign({}, this.stats) };
    }

    /** Report an error to the errors collection (also used for uncaught errors). */
    logError(error, context) {
      this.stats.errors_logged += 1;
      const payload = {
        uid: this.uid,
        message: (error && error.message) || String(error),
        stack: (error && error.stack) || null,
        context: sanitize(context || {}),
        trial_index: this.currentTrialIndex,
        url: window.location.href.split("?")[0], // no query string: it can carry Prolific ids
        user_agent: navigator.userAgent,
        client_time: new Date().toISOString(),
      };
      console.error("[DataSaver] error logged:", payload);
      if (this.mode === "offline" || this._errorCount >= MAX_ERRORS_PER_SESSION) return Promise.resolve();
      this._errorCount += 1;
      payload.at = this.fb.serverTimestamp();
      const col = this.fb.collection(this.db, "experiments", this.opts.experiment_id, "errors");
      return this.fb.addDoc(col, payload).catch((e) => console.error("[DataSaver] could not log error", e));
    }

    /** Wait for every outstanding write. Used by finish() and by tests. */
    _settle() {
      return Promise.allSettled(this.pending.slice());
    }

    // ---- internals -----------------------------------------------------------

    _track(run, label) {
      const attempt = Promise.resolve()
        .then(run)
        .catch((e) => {
          // A permission error will not fix itself; surface it right away with a hint.
          if (e && /permission-denied/.test(e.code || "")) {
            throw new Error("permission-denied on '" + label + "'. Are firebase/firestore.rules published to your project?");
          }
          console.warn("[DataSaver] " + label + " failed, retrying once:", e && e.code, e && e.message);
          return new Promise((r) => setTimeout(r, 1500)).then(run);
        })
        .then(() => { this.stats.writes_ok += 1; })
        .catch((e) => {
          this.stats.writes_failed += 1;
          this._reportWriteFailure(e);
          this.logError(e, { during: label, kind: "write-failure" });
        });
      this.pending.push(attempt);
      attempt.finally(() => {
        const i = this.pending.indexOf(attempt);
        if (i >= 0) this.pending.splice(i, 1);
      });
      return attempt;
    }

    /*
     * Sign-in failures were visible immediately (a banner) but write failures were not: with
     * rules that deny writes, the page looked completely healthy from consent to debrief and
     * only admitted the problem on the final screen. That is the state a student is in if they
     * skip publishing the rules, or once test-mode rules expire mid-collection, so it has to
     * be visible the moment the first write fails.
     */
    _reportWriteFailure(error) {
      if (this._writeFailureReported) return;
      this._writeFailureReported = true;
      const msg = (error && error.message) || String(error);
      let text = "Data is NOT being saved to the server. See the browser console for details.";
      if (/permission-denied/.test(msg)) {
        text =
          "Data is NOT being saved: the database refused the write (permission-denied). " +
          "Researcher: publish firebase/firestore.rules in the Firebase console " +
          "(student guide step 2.3). If the project was created in test mode, those rules " +
          "expire 30 days after the project was created.";
      } else if (/quota|resource-exhausted/i.test(msg)) {
        text = "Data is NOT being saved: this Firebase project has hit its free daily write limit. " +
               "Researcher: raise chunk_size in experiment.js; writes resume tomorrow.";
      }
      if (this.opts.show_banner) showBanner(text, "offline");
    }
    _installErrorHandlers() {
      const self = this;
      window.addEventListener("error", function (ev) {
        if (ev && ev.message && /ResizeObserver loop/.test(ev.message)) return;
        self.logError(ev.error || new Error(ev.message), {
          kind: "uncaught", source: ev.filename, line: ev.lineno, col: ev.colno,
        });
      });
      window.addEventListener("unhandledrejection", function (ev) {
        self.logError(ev.reason || new Error("unhandled rejection"), { kind: "unhandledrejection" });
      });
    }

    _installUnloadFlush() {
      const self = this;
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") self.flush();
      });
      window.addEventListener("pagehide", function () { self.flush(); });
    }

    _offerDownload(jsPsych, fullJson) {
      const target = (jsPsych && jsPsych.getDisplayElement && jsPsych.getDisplayElement()) || document.body;
      const uid = this.docId;
      const box = document.createElement("div");
      box.id = "data-saver-fallback";
      box.style.cssText = "margin:24px auto;max-width:640px;padding:16px;border:2px solid #7a1f1f;border-radius:8px;font:15px/1.5 system-ui,sans-serif;text-align:left;";
      const why = this.mode === "offline" ? this.reason
        : this.stats.writes_timed_out ? "the connection to the server was lost before saving finished"
        : "some writes to Firestore failed (" + this.stats.writes_failed + ")";
      const email = this.opts.contact_email;
      box.innerHTML =
        "<p><strong>Your data was not saved to the server</strong> (" + why + ").</p>" +
        "<p>Please download the file below and send it to the researcher" +
        (email ? " at <a href=\"mailto:" + email + "\">" + email + "</a>" : "") +
        ". You have still completed the study, and you will be paid.</p>";
      const btn = document.createElement("button");
      btn.className = "jspsych-btn";
      btn.textContent = "Download data (JSON)";
      btn.onclick = function () {
        const blob = new Blob([fullJson], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "data-" + uid + ".json";
        a.click();
      };
      box.appendChild(btn);
      target.appendChild(box);
    }
  }

  window.DataSaver = DataSaver;
  window.DataSaver.sanitize = sanitize;
})();
