---
name: experiment-data
description: Export data from Firestore to CSV, load and tidy it in R, triage client error reports, and prepare data for the replication report. Use when asked to download, export, inspect, clean, or analyze experiment data, or to handle a participant's downloaded JSON fallback file.
---

# Working with the data

## Data model (what the export sees)

```
experiments/{id}/participants/{pid}             start/end, completed, condition, Prolific ids,
                                                browser info, full_data (JSON string of all trials)
experiments/{id}/participants/{pid}/trials/…    chunks; each has trials: [ ...jsPsych rows ]
experiments/{id}/errors/…                       uncaught JS errors with uid + trial_index
```

`{pid}` is `<anonymous auth uid>-<run id>`: the browser, then this page load. One page load
writes one participant document, so a reload or a second run in the same browser produces a
second, separate record rather than overwriting the first. The `uid` field is the browser
part, so rows sharing a `uid` came from the same browser (a reload, or a student testing).
Use `identifiers.csv` (Prolific id) to reconcile a participant across records.

## Export

1. Student creates a service-account key: **Project settings → Service accounts → Generate
   new private key**, saved outside the repo (e.g. `~/keys/<project>-service-account.json`).
   Never copy it into the repo, never print its contents, never paste it in chat. If it is
   ever committed, tell the student to delete the key in the Google Cloud console immediately.

   **Ask for the path; do not go looking for it.** Do not list, glob, grep or read
   `~/keys/` or any other directory hunting for a key, and do not open one you stumble
   across: it may belong to a different project, or to someone else's work. Wait for the
   student to give you the path, then check that the key's `project_id` matches the
   `projectId` in `firebase-config.js` before exporting, and say so if it does not.
2. Run:
   ```bash
   npm run export -- --experiment <EXPERIMENT.id> --key <path-to-key>
   ```
   Output in `data/raw/<id>/`: `participants.csv`, `trials.csv` (long: one row per jsPsych
   trial), `errors.csv`, `export.json` (verbatim dump), and `identifiers.csv` (participant id
   to Prolific ids; gitignored, never commit, never paste in chat). The committed files contain
   no Prolific ids, URL parameters, or IP addresses.
3. Sanity-check the export: number of participants vs. Prolific's count; `completed` rate;
   `n_trials` per participant equal to the timeline length; `trials_source` should be
   `chunks` (if it is `full_data`, incremental writes failed for that participant, worth a look
   in `errors.csv`). Check `participants.csv` and `trials.csv` join on `participant_id`: if
   they do not, every participant will be silently excluded from the analysis.
   Also check `device_supported`: rows where it is false are phone visits turned away before
   consent, and rows where every speeded trial timed out should be excluded.
4. Against the emulator (for testing analysis code before real data exists):
   `npm run emulators` in one terminal, `npx playwright test` a few times in another, then
   `npm run export -- --experiment framing-demo --emulator`.

## Tidying in R

`trials.csv` columns that hold objects are JSON strings (e.g. the survey plugin's `response`).
Parse them with `jsonlite::fromJSON`, as `analysis/analysis.Rmd` shows. Logical columns
come through as `TRUE`/`FALSE` text; coerce with `as.logical`. `rt` is milliseconds; a
`null` response means the trial timed out.

Build the analysis around the `task` column: one `filter(task == "...")` per measure.
Keep the preregistered confirmatory analysis in its own section, exploratory analyses in
another, and print the exclusion funnel (started → completed → passed checks) as a table.

## Participants' fallback files

If Firebase was unreachable, the page offered the participant a `data-<uid>.json` download.
It is a jsPsych JSON array (same rows as `full_data`). Put such files in
`data/raw/<id>/manual/` and read them in the Rmd with `jsonlite::fromJSON` and `bind_rows`
after the CSV; tag them `trials_source = "manual"`.

## Deleting pilot data

Use a different `EXPERIMENT.id` per phase so pilot data never needs deleting. If a
collection must be removed, the student does it in the console (Firestore → Data → the
collection's menu → Delete collection) or with `npx firebase firestore:delete -r experiments/<id>`
after `npx firebase login`. Never delete anything without the student naming the exact path.

## Before committing data

- Read every free-text column (`comments`, "other" answers) for names, emails, or anything
  identifying; blank those cells and note it in the README.
- The CSVs contain no IP addresses; `user_agent` is kept for exclusions (mobile devices) and
  is not identifying. Prolific ids live only in the gitignored `identifiers.csv`.
- Commit `data/raw/<id>/` and the analysis. `export.json` is redundant with the CSVs; commit it
  too unless it is very large.
