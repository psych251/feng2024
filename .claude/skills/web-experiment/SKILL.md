---
name: web-experiment
description: Build or modify the jsPsych 8 experiment in this template (experiment.js), from a description of a study or a paper's method section. Use when asked to implement, change, or debug the experiment timeline, stimuli, conditions, or trial-level data. Covers jsPsych 8 patterns, data conventions, adding plugins, and keeping the end-to-end test green.
---

# Building the experiment

This template is jsPsych **8** (check `lib/VERSIONS.json`), served as static files with no
build step. The timeline lives in `experiment.js`; data saving is handled by `DataSaver`
in `src/save.js` and must not be bypassed.

## Procedure

1. **Pin down the design before writing code.** From the paper or the student's description,
   write a five-line summary at the top of your reply and keep it in a comment at the top of
   `experiment.js`: independent variable(s) and whether within- or between-subjects; dependent
   measure(s) and exactly which trial fields record them; trial structure (n trials, blocks,
   timing); randomization and counterbalancing; exclusion criteria and attention checks.
   Everything the analysis needs must be a field in the trial data.
2. **Map each part of the procedure to a plugin.** Plugins already vendored in `lib/`:
   `html-keyboard-response`, `html-button-response`, `instructions`, `survey` (SurveyJS),
   `survey-likert`, `survey-text`. To add one (e.g. `image-keyboard-response`, `preload`,
   `audio-button-response`, `same-different-html`): add `@jspsych/plugin-<name>` to
   `package.json` devDependencies, add a line to `scripts/vendor.js`, run
   `npm install && npm run vendor`, add the `<script>` tag to `index.html`. Never use CDN URLs.
3. **Write the timeline** following the conventions below. Keep the consent trial first and
   the debrief trial last. The consent *text* is fixed (only the contact email changes); the
   welcome instructions, task instructions, and debrief prose must be rewritten for the new
   study.
   - **Between-subjects factor?** Keep the `condition` pattern from the demo. **None?** Delete
     the demo's `condition` assignment, drop the `condition` assertions in the test, and record
     another participant-level fact instead (e.g. `design: "within-subjects"`, key mapping).
     `scripts/export.js` tolerates a missing `condition` column.
   - When replacing the demo entirely, also retarget `analysis/analysis.Rmd`, `README.md`, and
     `docs/student-guide.md`, and `grep -rn framing-demo` to catch stale ids.
4. **Stimuli**: put files in `stimuli/` and load with the `preload` plugin as the first trial
   after consent. Reference them with relative paths (`stimuli/img1.png`, no leading slash)
   because GitHub Pages serves the site under `/<repo>/`. Keep the repo under a few hundred MB;
   do not use Git LFS (Pages does not serve LFS files).
5. **Update the robot** in `tests/experiment.spec.js` (`runThroughExperiment`) so it clicks
   through the new flow, and extend the assertions to check the new trial fields. Robot tips:
   - Put a `data-*` attribute on keyboard-trial stimuli (`<div class="stimulus" data-ink="red">`)
     and read it, instead of parsing text; then `waitFor({ state: "detached" })` before the next trial.
   - SurveyJS: scope locators to the question, `page.locator('[data-name="native_english"]').getByText("Yes").first()`.
     A toggled boolean renders its label twice, so a bare `getByText("Yes")` becomes ambiguous.
   - Make the robot answer at least one trial wrong and let one time out, and assert on the
     resulting `correct` / `timed_out` fields.
6. **Run `npm test`.** It must pass before you tell the student the experiment is done. If
   Java is missing the emulator cannot start; then run `npx playwright test` (offline mode)
   and say so explicitly. In containers that ship their own Chromium set
   `PLAYWRIGHT_CHROMIUM_PATH`. Tests serve the tree on port 8017 and refuse to reuse another
   server, so a "port in use" error means a stale process, not a code problem.
7. **Walk through it yourself** with `npm start` and a Playwright script: at minimum one
   1280x720 screenshot of every new screen type, one timed-out trial, one wrong answer.
   Report anything that looks wrong (timing, layout on a laptop-sized window, typos).

## Conventions in this template

- Every trial has `data: { task: "<name>" }`. Analysis code filters on `task`.
- Derived fields are computed in the trial's `on_finish` (`data.correct`, `data.choice`,
  `data.timed_out`) so they are saved with the trial, not reconstructed later.
- Participant-level facts go on every row via `jsPsych.data.addProperties({...})` **and** on
  the participant document via `saver.updateParticipant({...})` (see `condition` in the demo).
- The participant id is `saver.docId` (`<uid>-<runId>`, one per page load), never `saver.uid`.
  If you set `participant_id` in the data, use `saver.docId`, or `trials.csv` will not join to
  `participants.csv` and the analysis will silently drop everyone.
- If your study has keyboard trials, leave `EXPERIMENT.requires_keyboard` true: phones have no
  keyboard and would otherwise record complete-looking sessions full of timeouts. If you make
  the study button-only, set it to false and say so.
- Never navigate away from the page during an emulator run: the Prolific redirect is
  suppressed under `?emulator=1` so that a completion code cannot break the test suite.
- Between-subjects assignment: `jsPsych.randomization.sampleWithoutReplacement([...], 1)[0]`.
  Exact counterbalancing needs a server; at course sample sizes random assignment is fine.
  Say so in the writeup. If balance matters, derive assignment from `saver.uid` deterministically
  and record it.
- Long or large stimuli HTML: add `save_trial_parameters: { stimulus: false }` to the trial so
  each row stays small. Keep an identifier for the stimulus in `data` instead.
- Firestore quota: expected writes per participant ≈ trials / `chunk_size` + 3. Free tier is
  20,000 writes/day. For 100+ trial tasks set `chunk_size` to 10–20.
- `EXPERIMENT.id` names the Firestore collection. Use a new id for each phase
  (`smith2016-pilot-a`, `-pilot-b`, `-final`).
- Time-critical tasks: use `trial_duration`, `response_ends_trial`, and the `preload` plugin.
  Do not build RT tasks out of the `survey` plugin.

## jsPsych 8 cheat sheet (differences from v7 that agents get wrong)

```js
const jsPsych = initJsPsych({ on_data_update, on_finish, show_progress_bar: true });
await jsPsych.run(timeline);                      // returns a promise

// plugins are globals named jsPsych<PluginName>
{ type: jsPsychHtmlKeyboardResponse, stimulus: "...", choices: ["f", "j"] }
{ type: jsPsychHtmlKeyboardResponse, stimulus: "+", choices: "NO_KEYS", trial_duration: 500 }
{ type: jsPsychHtmlButtonResponse, stimulus: "...", choices: ["A", "B"],
  button_html: (choice) => `<button class="jspsych-btn">${choice}</button>` } // function in v8

// timeline variables
{ timeline: [trial], timeline_variables: items, randomize_order: true, repetitions: 2 }
data: { word: jsPsych.timelineVariable("word") }                 // as a parameter value
stimulus: () => `<p>${jsPsych.evaluateTimelineVariable("word")}</p>` // inside a function

// conditional / looping
{ timeline: [...], conditional_function: () => cond }
{ timeline: [...], loop_function: (data) => data.values()[0].correct === false }

// balanced item lists (shuffled): 4 copies of each congruent item, 2 of each incongruent
const items = jsPsych.randomization.repeat(congruent, 4).concat(jsPsych.randomization.repeat(incongruent, 2));

// per-trial feedback: read the previous trial inside a stimulus *function*
{ type: jsPsychHtmlKeyboardResponse, choices: "NO_KEYS", trial_duration: 800,
  stimulus: () => (jsPsych.data.getLastTrialData().values()[0].correct ? "Correct" : "Incorrect") }

// timeouts: with trial_duration set, no response gives response: null and rt: null;
// keys not in `choices` are ignored.

// data
jsPsych.data.addProperties({ participant_id, condition });
jsPsych.data.get().filter({ task: "test" }).select("rt").mean();
jsPsych.data.getLastTrialData().values()[0];
jsPsych.abortExperiment("<p>Message</p>");   // ends and still runs on_finish

// survey plugin (SurveyJS JSON): question types text, comment, radiogroup, checkbox,
// dropdown, boolean, rating, matrix; each needs a `name`; `isRequired: true`.
{ type: jsPsychSurvey, survey_json: { showQuestionNumbers: "off", pages: [{ elements: [
  { type: "rating", name: "confidence", title: "How confident are you?", rateMin: 1, rateMax: 7 } ] }] } }
// survey plugin response lands as data.response = { confidence: 5, ... } (object)
```

Do not: load plugins from unpkg/jsdelivr; use `jsPsych.init` (v6); use `jsPsych.timelineVariable(x, true)`
(v7 immediate form, removed); write Firestore directly from trial code; put `on_finish` data
saving anywhere except through `DataSaver`.

## Ask before deciding these

They are methodological choices the student has to defend in a writeup, and an agent
rewriting a study will otherwise quietly make all of them:

- dropping or keeping a measure from the demo (the feedback questions, the comments box);
- exclusion criteria and their thresholds;
- counterbalancing and randomization scheme;
- trial counts, timings, and response windows;
- anything that changes what a participant is asked to do.

Propose a default, say what you would pick and why, and wait. Likewise, do not edit
`README.md` or `docs/` unless the task is about them: a timeline change does not license a
documentation rewrite. Retargeting `analysis/analysis.Rmd` and the test **is** part of the
task, because the study will not run or analyse without it.

## Reporting back

Tell the student: what the timeline does now (numbered list of trials), which fields carry
the dependent measures, the expected writes per participant, what you tested and how, and
anything you could not verify (e.g. real timing on their machine, audio autoplay policies).
