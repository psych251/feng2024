/*
 * Psych 251 experiment template: demo experiment.
 *
 * This file is the one you edit. It builds a jsPsych 8 timeline and wires it to DataSaver
 * (src/save.js), which writes to your Firebase project. Everything below is a working
 * example you can replace piece by piece:
 *
 *   1. consent           course-wide consent text (required at the start of every study)
 *   2. instructions
 *   3. demographics      a multi-question survey page (jsPsych "survey" plugin, SurveyJS)
 *   4. framing task      a between-subjects manipulation with random assignment
 *   5. lexical decision  a short keyboard reaction-time block (trial-level data)
 *   6. feedback          Likert + free text
 *   7. debrief           saves data, then shows thanks or redirects to Prolific
 *
 * The example manipulation is the classic "Asian disease" framing problem
 * (Tversky & Kahneman, 1981): people are risk-averse for gains and risk-seeking for losses.
 */

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
window.TEMPLATE_VERSION = "0.1.0";

const EXPERIMENT = {
  // Firestore path: experiments/<id>/participants/... Change it when you start a new study
  // so pilot data and real data never mix (e.g. "smith2016-pilot-a", "smith2016-final").
  id: "framing-demo",

  // Trials per Firestore write. 1 = save every trial the moment it finishes (dropouts leave
  // partial data). The free tier allows 20,000 writes/day: with 200 participants x 100 trials
  // you would exceed it, so raise this for long trial-based tasks (e.g. 20).
  chunk_size: 1,

  // Also store the complete jsPsych dataset on the participant document at the end.
  // Costs one extra write and makes export robust; turn off if trials are very large.
  save_full_data_at_end: true,

  // Prolific: if set, participants are redirected to Prolific when they finish.
  // Leave empty for local testing or non-Prolific samples.
  prolific_completion_code: "",

  // Contact shown in consent and debrief.
  contact_email: "stanfordpsych251@gmail.com",

  // Does this study need a physical keyboard? The demo does (the word task uses F and J).
  // On a phone or tablet no keyboard appears, so a participant cannot answer those trials;
  // they would time out silently and the session would still look complete. When true, such
  // devices are turned away before consent. Set to false if your study is buttons/touch only.
  requires_keyboard: true,
};

// True on anything with a mouse, trackpad, or stylus, including laptops with touchscreens.
// False on phones and tablets without a pointing device, which are also the devices with no
// physical keyboard. See docs/student-guide.md "Devices".
function hasFinePointer() {
  return !!(window.matchMedia && window.matchMedia("(any-pointer: fine)").matches);
}

// `?emulator=1` in the URL sends data to the local emulator instead of the real project.
// Used by `npm test`; handy for development too (start it with `npm run emulators`).
const URL_PARAMS = new URLSearchParams(window.location.search);
const USE_EMULATOR = URL_PARAMS.get("emulator") === "1";
// `?chunk_size=N` overrides the setting above; used by the test suite to exercise chunked writes.
const CHUNK_SIZE = Number(URL_PARAMS.get("chunk_size")) || EXPERIMENT.chunk_size;
// Test-only: `?cc=CODE` sets a Prolific completion code during emulator runs, so the test
// suite can check the screen a participant sees once you have set yours. Ignored in live runs.
if (USE_EMULATOR && URL_PARAMS.get("cc")) EXPERIMENT.prolific_completion_code = URL_PARAMS.get("cc");

// ---------------------------------------------------------------------------
// Boot: connect the saver first so even a crash in the first trial gets logged.
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
  window.__saver = saver; // for debugging and the automated test

  // Record the device verdict on the participant document before anything else, so a
  // participant turned away below is still visible in the data rather than simply absent.
  saver.updateParticipant({ device_supported: deviceSupported, requires_keyboard: EXPERIMENT.requires_keyboard });

  if (!deviceSupported) {
    document.body.innerHTML =
      '<div id="device-unsupported" class="jspsych-content" style="max-width:640px;margin:15vh auto;font:16px/1.6 system-ui,sans-serif;">' +
      "<h2>Please use a computer</h2>" +
      "<p>This study needs a computer with a physical keyboard, because part of it is answered " +
      "by pressing keys. Phones and tablets cannot be used.</p>" +
      "<p>Please reopen this link on a laptop or desktop computer. If you were sent here from " +
      "Prolific, you can return the study and take it later on a computer; nothing has been recorded " +
      "against you.</p>" +
      "<p>Questions: <a href=\"mailto:" + EXPERIMENT.contact_email + "\">" + EXPERIMENT.contact_email + "</a></p></div>";
    return;
  }

  const jsPsych = initJsPsych({
    show_progress_bar: true,
    auto_update_progress_bar: true,
    on_data_update: (trial) => saver.onTrial(trial),
    on_finish: async () => {
      const el = jsPsych.getDisplayElement();
      el.innerHTML = '<div id="finish-message"><p class="thanks">Saving your responses…</p></div>';
      // finish() flushes remaining trials, marks the participant complete, and (only if
      // saving failed) appends a download-fallback box to the display element.
      const result = await saver.finish(jsPsych);
      const consentRow = jsPsych.data.get().filter({ task: "consent" }).values()[0];
      const consented = !consentRow || consentRow.consented !== false;
      const msg = document.getElementById("finish-message");

      if (!consented) {
        msg.innerHTML = "<h2 class='thanks'>Thank you</h2><p class='thanks'>You chose not to participate. " +
          "You may close this window" + (EXPERIMENT.prolific_completion_code ? " and return the study on Prolific" : "") + ".</p>";
        return;
      }
      if (result.ok && EXPERIMENT.prolific_completion_code && !USE_EMULATOR) {
        msg.innerHTML = "<p class='thanks'>Saved. Returning you to Prolific…</p>";
        window.location.href =
          "https://app.prolific.com/submissions/complete?cc=" + EXPERIMENT.prolific_completion_code;
        return;
      }
      // In emulator/test runs we stay on the page instead of navigating to Prolific, so that
      // setting a completion code can never turn `npm test` or CI red. Live runs redirect above.
      msg.innerHTML =
        "<h2 class='thanks'>All done</h2>" +
        (result.ok ? "<p class='thanks'>Your responses were saved. Thank you for participating!</p>" : "") +
        (EXPERIMENT.prolific_completion_code
          ? "<p class='thanks'>Your completion code is <strong>" + EXPERIMENT.prolific_completion_code + "</strong>.</p>"
          : "");
    },
  });

  // Record the participant id and URL parameters on every trial row.
  jsPsych.data.addProperties({
    // Must be the run-scoped document id, so trial rows join to participants.csv on export.
    participant_id: saver.docId,
    prolific_pid: saver.params.PROLIFIC_PID || null,
    experiment_id: EXPERIMENT.id,
  });

  // Random assignment to a between-subjects condition, recorded on every trial and on the
  // participant document. (For exact counterbalancing you would need a server; random
  // assignment is fine at course sample sizes.)
  const condition = jsPsych.randomization.sampleWithoutReplacement(["gain", "loss"], 1)[0];
  jsPsych.data.addProperties({ condition: condition });
  saver.updateParticipant({ condition: condition });

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
      if (!data.consented) {
        // No end message here: jsPsych would paint it over the screen that on_finish renders.
        jsPsych.abortExperiment();
      }
    },
  };

  // -------------------------------------------------------------------------
  // 2. Instructions
  // -------------------------------------------------------------------------
  const instructions = {
    type: jsPsychInstructions,
    pages: [
      `<h2>Welcome</h2>
       <p>This short study has three parts: a few questions about you, one decision problem,
       and a quick word task. It takes about three minutes.</p>`,
      `<p>Please complete the study in one sitting, in a quiet place, on a laptop or desktop
       computer. Use the buttons or the arrow keys to move between pages.</p>`,
    ],
    show_clickable_nav: true,
    data: { task: "instructions" },
  };

  // -------------------------------------------------------------------------
  // 3. Demographics (survey plugin: one page, several question types)
  // -------------------------------------------------------------------------
  const demographics = {
    type: jsPsychSurvey,
    survey_json: {
      showQuestionNumbers: "off",
      completeText: "Continue",
      pages: [
        {
          elements: [
            // The consent text promises participants may decline any question, so nothing here is required.
            { type: "text", name: "age", title: "How old are you?", inputType: "number", min: 18, max: 120 },
            {
              type: "radiogroup", name: "gender", title: "What is your gender?",
              choices: ["Woman", "Man", "Non-binary"], showOtherItem: true, showNoneItem: true, noneText: "Prefer not to say",
            },
            { type: "boolean", name: "native_english", title: "Is English your first language?", labelTrue: "Yes", labelFalse: "No" },
          ],
        },
      ],
    },
    data: { task: "demographics" },
  };

  // -------------------------------------------------------------------------
  // 4. Framing problem (between-subjects: gain vs loss frame)
  // -------------------------------------------------------------------------
  const framingText = {
    gain: {
      a: "If Program A is adopted, 200 people will be saved.",
      b: "If Program B is adopted, there is a one-third probability that 600 people will be saved, and a two-thirds probability that no people will be saved.",
    },
    loss: {
      a: "If Program A is adopted, 400 people will die.",
      b: "If Program B is adopted, there is a one-third probability that nobody will die, and a two-thirds probability that 600 people will die.",
    },
  };
  const framing = {
    type: jsPsychHtmlButtonResponse,
    stimulus: () => `
      <div class="framing">
        <p>Imagine that the country is preparing for the outbreak of an unusual disease, which is
        expected to kill 600 people. Two alternative programs to combat the disease have been
        proposed. Assume that the exact scientific estimates of the consequences of the programs
        are as follows:</p>
        <ul class="programs">
          <li>${framingText[condition].a}</li>
          <li>${framingText[condition].b}</li>
        </ul>
        <p>Which of the two programs would you favor?</p>
      </div>`,
    choices: ["Program A", "Program B"],
    data: { task: "framing" },
    on_finish: (data) => {
      // Program A is the certain option in both frames; B is the risky gamble.
      data.choice = data.response === 0 ? "certain" : "risky";
    },
  };

  // -------------------------------------------------------------------------
  // 5. Lexical decision (short RT block with trial-level logging)
  // -------------------------------------------------------------------------
  const ldInstructions = {
    type: jsPsychInstructions,
    pages: [
      `<h2>Word task</h2>
       <p>You will see a string of letters. Press <strong>F</strong> if it is a real English word
       and <strong>J</strong> if it is not. Respond as quickly and accurately as you can.
       Place your fingers on F and J now.</p>`,
    ],
    show_clickable_nav: true,
    data: { task: "instructions" },
  };
  const ldItems = [
    { word: "TABLE", is_word: true }, { word: "GARDEN", is_word: true },
    { word: "PLANET", is_word: true }, { word: "SILVER", is_word: true },
    { word: "FLIRP", is_word: false }, { word: "MANTOR", is_word: false },
    { word: "BRENDLE", is_word: false }, { word: "TOSKIN", is_word: false },
  ];
  const fixation = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<div class="fixation">+</div>',
    choices: "NO_KEYS",
    trial_duration: 500,
    data: { task: "fixation" },
  };
  const ldTrial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: () => `<div class="stimulus">${jsPsych.evaluateTimelineVariable("word")}</div>`,
    choices: ["f", "j"],
    trial_duration: 3000,
    data: {
      task: "lexical_decision",
      word: jsPsych.timelineVariable("word"),
      is_word: jsPsych.timelineVariable("is_word"),
    },
    on_finish: (data) => {
      const expected = data.is_word ? "f" : "j";
      data.correct = data.response === expected;
      data.timed_out = data.response === null;
    },
  };
  const lexicalDecision = {
    timeline: [fixation, ldTrial],
    timeline_variables: ldItems,
    randomize_order: true,
  };

  // -------------------------------------------------------------------------
  // 6. Feedback
  // -------------------------------------------------------------------------
  const feedback = {
    type: jsPsychSurveyLikert,
    questions: [
      {
        prompt: "How clear were the instructions?", name: "instructions_clear", required: false,
        labels: ["Very unclear", "Unclear", "Neutral", "Clear", "Very clear"],
      },
    ],
    data: { task: "feedback_likert" },
  };
  const comments = {
    type: jsPsychSurveyText,
    questions: [{ prompt: "Any comments about the study? (optional)", name: "comments", rows: 4 }],
    data: { task: "feedback_text" },
  };

  // -------------------------------------------------------------------------
  // 7. Debrief
  // -------------------------------------------------------------------------
  const debrief = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <h2>Debrief</h2>
      <p>Thank you. In this study we tested whether describing the same outcomes as lives saved or
      as lives lost changes which program people choose. Different participants saw different
      wordings. If you have questions about this research, contact
      <a href="mailto:${EXPERIMENT.contact_email}">${EXPERIMENT.contact_email}</a>.
      Press the button to save your responses and finish.</p>`,
    choices: ["Finish"],
    data: { task: "debrief" },
  };

  await jsPsych.run([
    consent,
    instructions,
    demographics,
    framing,
    ldInstructions,
    lexicalDecision,
    feedback,
    comments,
    debrief,
  ]);
})();
