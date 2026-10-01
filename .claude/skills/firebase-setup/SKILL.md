---
name: firebase-setup
description: Connect this experiment to the student's own Firebase project (Firestore + anonymous auth) and verify data is being saved. Use when asked to set up Firebase, fix the red "data is NOT being saved" banner, publish or debug security rules, or estimate free-tier quota. The student does the console clicks; you verify and troubleshoot.
---

# Firebase setup for this experiment

The template needs one free Firebase (Spark) project per student, on a **personal** Google
account. The browser talks to Firestore directly; there is no server and no build. Nothing
here requires the Firebase CLI to log in, so the student never links accounts.

## What the student must do in the browser

**Do not paraphrase the console steps from memory: the Firebase console changes often and a
wrong click here is where students lose the most time.** Point them at section 2 of
`docs/student-guide.md`, which is written screen by screen and was last confirmed against a
brand-new account in September 2026. Summarise it as the five things they are achieving:

1. Create a project on a **personal** Google account (Spark plan, Analytics off).
2. Create a Firestore database in **production mode** (never test mode: those rules expire
   after 30 days, mid-collection).
3. Publish the contents of `firebase/firestore.rules` on the Rules tab.
4. Enable **Anonymous** sign-in (the provider toggle, not the auto-clean-up checkbox).
5. Register a web app, choose the **Config** view, and replace the six `PASTE_ME` lines in
   `firebase-config.js`.

Two traps worth naming explicitly when you hand this over, because neither produces an error
message:

- The console shows `const firebaseConfig = {`; the file needs `window.FIREBASE_CONFIG = {`.
  Only the six lines inside the braces get replaced. Pasting the whole block silently leaves
  the page in offline mode.
- A **Stanford** (Workspace) account cannot create projects at all: Continue is greyed out
  and the Cloud console asks for a parent organization that does not exist. That is policy,
  not a bug. They need a personal account.

Give them the five headings by name (2.1 Create the project, 2.2 Create the database,
2.3 Publish the security rules, 2.4 Enable anonymous sign-in, 2.5 Register a web app) so they
can follow along, rather than reproducing the click-by-click text, which goes stale. If they
get stuck on one, walk that step inline and say which screen you expect them to be looking
at. Ask them to tell you when all five are done. Everything below is yours.

## What you do

1. **Validate the config file.** `node -e "require('vm').runInNewContext(require('fs').readFileSync('firebase-config.js','utf8'),{window:{}})"`
   must not throw; `projectId`, `apiKey`, `appId`, `authDomain` must be present and not `PASTE_ME`.
   `authDomain` should be `<projectId>.firebaseapp.com`.
2. **Validate the rules locally**: `npm test` starts the emulator with these rules and runs
   the robot; the "security rules" test proves the rules deny reads and cross-participant writes.
   Never edit the rules to `allow read, write: if true`, even temporarily.
3. **Verify the live connection.** A live check writes participant records into a project
   that may already hold real data, so ask first: say how many test runs you will do, and
   afterwards tell the student exactly which documents to delete (they are the ones whose
   `prolific_pid` is empty and whose ids you just reported). Prefer `npm test` against the
   emulator for anything that does not specifically need the live project. `npm start`, then load http://localhost:8000 in a headless
   browser (Playwright is installed) and read `window.__saver.mode` and `window.__saver.reason`
   after `window.__saver.docId` is set. Expect `mode === "firebase"`. Then run through the
   experiment (`tests/experiment.spec.js` shows how) and check `window.__saver.stats.writes_failed === 0`.
   Ask the student to confirm a document appears under **Firestore → Data → experiments**.
   Run it **twice in the same browser session**: each run must produce its own participant
   document (ids look like `<uid>-<runId>`) and neither may report failed writes.
4. **Quota check.** Writes per participant ≈ trials / `chunk_size` + 3. Multiply by the
   planned N per day. If it approaches 20,000, raise `chunk_size` in `experiment.js`.
5. Commit `firebase-config.js`. It is a public identifier, not a secret; explain this if
   GitHub or the student flags it.

## Troubleshooting (banner text or console error → cause → fix)

| Message | Cause | Fix |
| --- | --- | --- |
| `placeholder values` | config not pasted | step 5–6 |
| `auth/operation-not-allowed` or `admin-restricted-operation` | Anonymous sign-in disabled | step 4 |
| `auth/invalid-api-key`, `auth/api-key-not-valid` | typo or config from another project | re-copy step 5 |
| `permission-denied` | rules not published, test-mode rules expired, or path changed | step 3; check `experiments/{id}/participants/{uid}` layout unchanged |
| `unavailable`, `timed out` | network/firewall (some campus or corporate networks block Firestore's long-polling) | try another network; report it |
| `Missing or insufficient permissions` on export | service-account key from a different project | regenerate in the right project |
| Console says project creation blocked | Google Workspace policy | personal Google account |
| Firestore "quota exceeded" | free-tier daily limit | raise `chunk_size`; writes resume next day; `full_data` on completion still lands if under quota |

## Optional: Firebase CLI

The CLI is only needed to deploy rules from the terminal instead of pasting:
`npx firebase login` (opens a browser), create `.firebaserc` with `{"projects":{"default":"<projectId>"}}`,
then `npx firebase deploy --only firestore:rules`. Not required; the console paste is fine.
Do not enable App Check, Cloud Functions, or the Blaze plan for a course project.
