# Psych 251 experiment template

Everything you need to run a web experiment for your replication project:

- **jsPsych 8** experiment, served for free from **GitHub Pages** straight out of this repo.
- **Firebase Firestore** data logging in a project *you* own (free tier, no credit card).
- Trial-by-trial saving so dropouts leave partial data, client-side **error logging**, and a
  download fallback so no participant's data is ever silently lost.
- **Prolific** integration (URL parameters in, completion redirect out).
- An **export script** to tidy CSV and an **R Markdown** analysis stub.
- An automated **end-to-end test** that plays the experiment against a local Firestore emulator.
- Skill files in `.claude/skills/` so Claude Code (or another agent) can do the fiddly parts.

Start with **[docs/student-guide.md](docs/student-guide.md)**. The short version:

```bash
# 1. Use this template -> create your project repo -> clone it
npm install
npm start          # open http://localhost:8000 : the demo runs in "offline" mode
npm test           # robot participant + emulator; 10 tests, should pass out of the box
                   # (needs Java 17+; downloads a test browser the first time)

# 2. Create a Firebase project (personal Google account), enable Firestore + Anonymous auth,
#    paste the config into firebase-config.js, paste firebase/firestore.rules into the console.
# 3. Settings -> Pages -> deploy from branch main, root. Your experiment is live.
# 4. Edit experiment.js. Keep `npm test` green.
# 5. npm run export -- --experiment <id>   then knit analysis/analysis.Rmd
```

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | Entry point. Loads vendored libraries from `lib/` and runs `experiment.js`. |
| `experiment.js` | **Your experiment.** The timeline and its settings (`EXPERIMENT` object). |
| `src/save.js` | `DataSaver`: anonymous sign-in, chunked trial writes, error logging, offline fallback. |
| `src/experiment.css` | Your styles. |
| `firebase-config.js` | Your project's web config, pasted from the Firebase console. Public by design. |
| `firebase/firestore.rules` | Security rules: participants can only append their own data; nobody can read from the browser. |
| `lib/` | Pinned browser builds of jsPsych, its plugins, and a bundled Firebase SDK (`lib/VERSIONS.json`). |
| `scripts/export.js` | Firestore to CSV via the Admin SDK. |
| `scripts/serve.js` | Local static server (`npm start`). |
| `analysis/analysis.Rmd` | Analysis stub that reads the exported CSVs. |
| `tests/` | Playwright end-to-end test (`npm test`). |
| `.claude/skills/` | Agent skills: building experiments, Firebase setup, deploying, data, and design review. |
| `docs/student-guide.md` | The human walkthrough, including the things that usually go wrong. |

## Data model

```
experiments/{experiment_id}/participants/{uid}            one document per participant
experiments/{experiment_id}/participants/{uid}/trials/…   chunks of jsPsych trial rows
experiments/{experiment_id}/errors/…                      client-side error reports
```

Each page load writes its own participant document, named `<anonymous auth id>-<run id>`, so
a reload or a second run in the same browser can never overwrite an earlier one. The participant document stores start/end times,
completion, condition, Prolific ids, browser info, and (by default) the full jsPsych dataset
as a JSON string. Trials are also written incrementally in chunks (`chunk_size` in
`experiment.js`), so a participant who closes the tab still leaves everything up to that point.

## Versions

See `lib/VERSIONS.json`. To upgrade: change versions in `package.json`, `npm install`,
`npm run vendor && npm run bundle:firebase`, `npm test`.

## License

MIT. The demo experiment is the "Asian disease" framing problem (Tversky & Kahneman, 1981).
