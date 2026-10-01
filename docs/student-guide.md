# Student guide: from template to live experiment

This is the human path from an empty repository to a live web experiment with your data in
hand. Every step also has a skill in `.claude/skills/` that an AI coding agent (Claude Code,
Codex, Cursor and so on) can follow for you: open the repo in the agent and ask it to "set up
Firebase for this experiment" or "deploy this to GitHub Pages". The account steps, where you
click around in a website while signed in, are always yours to do.

Written for a first-year who has not done web development. Where a step introduces a term,
the term is defined the first time it appears; there is also a glossary at the end.

## What you need before you start

| | |
| --- | --- |
| **A GitHub account**, added to the class organization | Ask the course staff if you are not in it yet. |
| **A personal Google account** | *Not* your Stanford account. See "Why a personal Google account?" in section 2. |
| **Node.js 18 or newer** | The program that runs the template's tools. Check with `node --version`. Install from <https://nodejs.org> (the "LTS" download). |
| **Git** | Check with `git --version`. macOS installs it when you first run the command. |
| **Java 17 or newer** | **Required**, not optional: `npm test` runs a local copy of the database to check your experiment, and that copy is a Java program. Get it from <https://adoptium.net>, or on a Mac `brew install --cask temurin`. Do not follow the "install Java" link macOS pops up: it offers Java 8, which is too old. |
| **R and RStudio**, with `tidyverse`, `jsonlite`, `knitr` and `rmarkdown` | For the analysis. RStudio offers to install the missing ones the first time you open the analysis file; say yes. |
| **A laptop or desktop** | You do not need a phone. The demo deliberately refuses to run on one, because its word task needs a keyboard. |

You do **not** need a credit card at any point. Everything here is free.

Three terms used throughout:

- **Agent**: an AI coding assistant working inside your repository, such as Claude Code.
- **Skill**: a file in `.claude/skills/` telling the agent how to do one of these jobs. You
  never write these; they are already in the template.
- **Firestore emulator**: a local practice copy of the Firebase database that runs on your
  own machine, so tests never touch your real data.

---

## 1. Create your repo from the template

1. On the template's GitHub page click **Use this template → Create a new repository**.
   Owner: the class organization. Name: your project shortcite, e.g. `smith2016`.
   Visibility: **Public**. GitHub Pages, which puts your experiment online for free, needs a
   public repository on a free plan.

2. **Clone** it, which means downloading your own copy to work on. On your new repository's
   page click the green **Code** button, choose the **HTTPS** tab, and copy the URL. Then in
   a terminal, in whatever folder you keep projects in:

   ```bash
   git clone https://github.com/psych251/smith2016.git
   cd smith2016
   npm install
   ```

   `npm install` downloads the tools the template uses. It takes a couple of minutes and
   prints a lot; warnings are fine, errors are not.

3. Start the experiment on your own machine and open <http://localhost:8000>:

   ```bash
   npm start
   ```

   You will see a red banner reading "Data is NOT being saved … placeholder values". That is
   correct for now: you have not connected a database yet. Click through the whole demo; at
   the end you get a **Download data (JSON)** button instead of saving. Press `Ctrl+C` in the
   terminal to stop the server.

   You can also open `index.html` by double-clicking it, and the demo will appear to work.
   Don't: once you connect your database in section 2, saving behaves differently when the
   page is opened as a file rather than served, and stimulus files can fail to load. Always
   use `npm start`.

4. Check the automated test, in a second terminal (or after stopping the server):

   ```bash
   npm test
   ```

   A robot participant plays the whole experiment against the local practice database and
   checks that the data arrives. The first run downloads two things, the database emulator
   (about 140 MB) and a test browser (about 150 MB), so it takes a few minutes; later runs
   take about a minute. It should end with **10 passed** before you change anything.

   Run `npm test` again after every change you make, and always before you push.

---

## 2. Create your Firebase project

Firebase is Google's free database service; your experiment writes each participant's data
straight into a **project** that belongs to you. Budget about half an hour the first time.
All screens below were confirmed on a brand-new personal Google account in September 2026.
Google redesigns this console often, so if a screen does not match, look for the same words
rather than the same layout.

### Why a personal Google account?

University Google Workspace accounts usually block creating Firebase projects. With a
Stanford account, the Firebase console greys out **Continue** and offers a "Select parent
resource" button with nothing selectable; the Google Cloud console says *"You must select a
parent organization or folder"* and lists only "No organization", which cannot be chosen.
That is university policy, not a broken page: switch to a personal account. A personal
account also means the project, and your data, stay with you after the course.

### 2.1 Create the project

1. Go to <https://console.firebase.google.com> signed in with your **personal** Google account.
2. On a brand-new account you land on a welcome page ("Hello, \<name\> — Welcome to
   Firebase!"). Click the large card **Get started by setting up a Firebase project**. On an
   account that already has projects this is a **Create a project** button instead.
3. **Name screen.** Type a project name, e.g. `smith2016-replication`. A **project id** like
   `smith2016-replication-a1b2c` is generated underneath; that id is the name Google uses
   internally. Leave it alone.
   - Leave **I accept the Firebase terms** ticked.
   - Turn **off** "Join the Google Developer Program" (on by default; not needed).
   - Click **Continue**.
4. **AI assistance screen.** Turn **off** "Enable Gemini in Firebase" (on by default and
   labelled Recommended; not needed). Click **Continue**.
5. **Google Analytics screen.** Turn **off** "Enable Google Analytics for this project" (on
   by default). Click **Continue**. If you leave it on, an extra screen asks you to pick an
   Analytics account, which you do not want.
6. Wait for "Your Firebase project is ready", then **Continue** to the project overview.
7. You are on the free **Spark** plan by default, shown as a badge next to the project name.
   Never upgrade to Blaze for this course. Ignore the "Next steps with Gemini" cards.

### 2.2 Create the database

1. In the left sidebar click **Databases & Storage**; a flyout opens. Under **NoSQL** click
   **Firestore**. Do not click "Realtime Database", a different product listed just below it.
2. Click **Create database**, ignoring the "Ask Gemini" banner. The wizard has three steps.
3. **Select edition.** Leave **Standard edition** selected and click **Next**. Do not pick
   Enterprise.
4. **Database ID & location.** Leave the Database ID as **(default)**. Pick a location near
   you, e.g. `us-west1 (Oregon)`. This cannot be changed later. Click **Next**.
5. **Configure.** Leave **Start in production mode** selected. The preview shows
   `allow read, write: if false;`, meaning nothing may read or write yet; you fix that in the
   next step. Do **not** choose test mode: it opens your database to everyone and stops
   working after 30 days, which lands in the middle of data collection. Click **Create**.
6. You land on the **Data** tab. Click the **Rules** tab and check it shows the deny-all rules.

### 2.3 Publish the security rules

**Rules** are the file that decides who may read and write your data. The template ships the
right ones; you just publish them.

1. On the **Rules** tab, select everything in the editor and delete it.
2. Open `firebase/firestore.rules` from your repo, copy the whole file, paste it in, and
   click **Publish**. The history panel on the left shows a new entry with today's time.

These rules let a participant add their own data and nothing else. In particular nobody can
read your data from a browser, which is why you export it with a script in section 6. Never
replace them with `allow read, write: if true` to make something work; if writes are failing,
the troubleshooting table at the end of this guide has the real cause.

### 2.4 Enable anonymous sign-in

Each participant is signed in **anonymously**: Firebase gives their browser a random id with
no account, no email and no password, so the rules can tell one participant from another
without collecting anything identifying.

1. In the left sidebar click **Security**, then **Authentication** in the flyout.
2. Click **Get started**. On the **Sign-in method** tab click **Anonymous**.
3. The panel has **two** things labelled Enable. Turn on the **toggle** next to "Anonymous"
   at the top right. Leave the **"Enable Auto clean-up"** checkbox unticked. Click **Save**.
4. Anonymous should now show as **Enabled** in the provider list.

If you skip this step, every write fails and the experiment shows its red banner.

### 2.5 Register a web app and fill in `firebase-config.js`

The **config object** is six lines telling your page which Firebase project to talk to.

1. Click the gear next to **Project Overview** → **Project settings** → **General** tab.
   Scroll to **Your apps** and click the web icon **`</>`**.
2. Nickname: anything. Leave **Firebase Hosting** unticked. Click **Register app**.
3. On the "Add Firebase SDK" step choose **Config**, not npm and not CDN. You get a bare
   object beginning `const firebaseConfig = {`. Copy the six lines **inside** the braces.
4. Open `firebase-config.js`. It is at the top level of the folder you cloned in section 1,
   next to `index.html`; open it in any text editor. Below a block of comments it reads:

   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "PASTE_ME",
     authDomain: "PASTE_ME.firebaseapp.com",
     projectId: "PASTE_ME",
     storageBucket: "PASTE_ME.firebasestorage.app",
     messagingSenderId: "PASTE_ME",
     appId: "PASTE_ME",
   };
   ```

   Replace the six `PASTE_ME` lines with the six lines you copied. **Keep the first line as
   `window.FIREBASE_CONFIG = {`.** If you paste the console's whole block over the whole
   block, the first line becomes `const firebaseConfig = {`, the page silently fails to find
   your settings, and you stay in offline mode with no error explaining why. Leave the
   comments above it untouched. Save.

5. Check your work: `grep '"PASTE_ME' firebase-config.js` should print nothing, and
   `npm test` should still pass. (Match the quote as shown: a plain `grep PASTE_ME` also
   finds the word in the comments above, which stay there on purpose.)
6. Commit and push:

   ```bash
   git add firebase-config.js
   git commit -m "Add Firebase config"
   git push
   ```

   Yes, this file goes into a public repository on purpose. The config is an address, not a
   password: every participant's browser downloads it anyway. The rules you published in 2.3
   are what protect your data.

### 2.6 Check that data arrives

1. `npm start`, then reload <http://localhost:8000>. The red banner should be gone.
2. Run through the whole demo to "All done".
3. In the console sidebar go to **Project shortcuts → Firestore → Data** and click through
   `experiments` → `framing-demo` → `participants` → the one document. It should show
   `completed: true`, a `condition`, and a `trials` subcollection holding one document per
   trial.

Every page load counts as a new participant, so testing repeatedly is fine: each run gets
its own record and never overwrites the last one.

---

## 3. Put it online with GitHub Pages

1. Push everything, then on GitHub go to **Settings → Pages → Build and deployment →
   Source: Deploy from a branch → Branch: `main`, folder: `/ (root)` → Save**.
2. After a minute or two your experiment is live at `https://psych251.github.io/smith2016/`.
   Open it, run through it once, and confirm a new participant appears in Firestore.
3. Every `git push` to `main` republishes within a minute or two. If you see an old version,
   hard-reload the page (`Cmd+Shift+R` / `Ctrl+Shift+R`).

---

## 4. Build your experiment

Edit `experiment.js`. The demo shows every piece you are likely to need: consent,
instructions, a survey page, a between-subjects manipulation with random assignment, a
keyboard reaction-time block, Likert and free-text feedback, and a debrief. jsPsych's own
documentation is at <https://www.jspsych.org/latest/>. Three rules:

- **Consent stays first and the debrief stays last.** The consent wording is the course-wide
  approved text; change only the contact email. The welcome, task instructions and debrief
  text should all be rewritten for your study.
- **Keep `npm test` green.** When you change the flow, update `runThroughExperiment` in
  `tests/experiment.spec.js` so the robot still knows what to click. That test is your
  guarantee that the study still runs and still saves before you send it to real people.
- **Ask the agent.** "Replace the demo with \<your task\>" is exactly what the
  `web-experiment` skill is for.

Settings at the top of `experiment.js`:

| Setting | What to do with it |
| --- | --- |
| `id` | The name of the collection your data lands in. Change it when you move between phases (`smith2016-pilot-a`, `smith2016-pilot-b`, `smith2016-final`) so datasets never mix. |
| `chunk_size` | How many trials are saved per write. 1 saves every trial as it happens. For long reaction-time studies raise it to about 20 to stay inside the free daily limit. Expected writes per participant are roughly trials ÷ `chunk_size` + 3; the free tier allows 20,000 a day. |
| `prolific_completion_code` | From your Prolific study page; see section 5. |
| `requires_keyboard` | Leave `true` if any part of your study is answered with keys. Phones and tablets are then turned away before consent, because they have no keyboard and would otherwise produce sessions that look complete but contain nothing. Set it to `false` only if your study is entirely buttons and typing. |

To add a jsPsych plugin, add it to `package.json` and `scripts/vendor.js`, run
`npm install && npm run vendor`, and add the `<script>` tag to `index.html`. Do not link to
plugins on the internet; the template keeps its own pinned copies in `lib/` so your
experiment cannot change under you mid-study.

---

## 5. Recruit

**Prolific.** Your study URL is your Pages URL with some extra information on the end:

```
https://psych251.github.io/smith2016/?PROLIFIC_PID={{%PROLIFIC_PID%}}&STUDY_ID={{%STUDY_ID%}}&SESSION_ID={{%SESSION_ID%}}
```

Everything after the `?` is how Prolific tells your page who is taking part; each `name=value`
pair is a **query parameter**. Paste the line exactly as written: the `{{%…%}}` parts are
Prolific's own placeholders and Prolific substitutes the real values when it sends someone to
you. Do not type anything in their place. The template stores all three ids with the
participant's data.

Put your **completion code** (from the Prolific study page) into `prolific_completion_code`
in `experiment.js`, and choose "I'll redirect them using a URL" as the completion method.
Once a code is set, a real participant is sent back to Prolific automatically at the end
instead of seeing the "All done" screen. Test runs (`npm test` and anything with
`?emulator=1`) deliberately stay on the page, so setting your code cannot break your tests.

Check the whole thing with Prolific's **Preview** link before publishing the study.

If saving fails for a participant, they do **not** get redirected: they see the completion
code together with a request to download their data and email it to you. That is deliberate,
since they did the work and should be paid, but it means a Prolific submission is not by
itself proof that you have their data. Before approving a batch, compare the number of
completed rows in your export with the number of submissions, and check your inbox for
rescued files.

**Pilot A and Pilot B.** Use a different `EXPERIMENT.id` for each phase, and run the course's
pilot checklists as usual.

---

## 6. Get your data out

Nobody can read your data from a browser, by design. You read it with a script that
authenticates as the project owner using a **service-account key**: a file that proves the
script is you. It is the one real secret in this whole setup.

1. In the **Firebase** console (not GitHub) click the gear next to **Project Overview** →
   **Project settings** → **Service accounts** tab. The panel has a Node.js / Java / Python /
   Go selector that only changes the sample code shown; ignore it. Click **Generate new
   private key**, then **Generate key**. A `.json` file downloads.

2. Move that file **outside** your repository, for example to `~/keys/`. Never commit it,
   never paste its contents anywhere, never send it to anyone. Anyone holding it can read and
   delete everything in your project. If it ever reaches GitHub, delete the key in the Google
   Cloud console immediately and generate a new one. The repository ignores the common key
   filenames as a backstop, but do not rely on that: keep it out of the folder entirely.

3. Export, where `--experiment` is the `id` from the `EXPERIMENT` block in `experiment.js`
   (for the untouched demo that is `framing-demo`):

   ```bash
   npm run export -- --experiment smith2016-final --key ~/keys/smith2016-abc123.json
   ```

   If it reports finding nothing, the `--experiment` value almost certainly does not match
   your `EXPERIMENT.id`.

   This writes into `data/raw/smith2016-final/`:

   | File | What it holds |
   | --- | --- |
   | `participants.csv` | One row per participant: start and end time, whether they finished, condition, browser. |
   | `trials.csv` | One row per trial, **long format** (one row per observation rather than one row per person). Columns holding structured answers are stored as JSON text. |
   | `errors.csv` | JavaScript errors that happened in participants' browsers, with the trial number. Empty is good. |
   | `export.json` | Everything, exactly as stored, for safekeeping. |
   | `identifiers.csv` | Links each participant to their Prolific id. **Gitignored**: use it to approve and pay people, and never commit it. |

   The first four contain no Prolific ids, no URL parameters and no IP addresses, so they are
   safe to commit.

4. Open `analysis/analysis.Rmd` in RStudio. If it prompts you to install `knitr`, `rmarkdown`
   or `jsonlite`, accept. Change two things: `author:` at the top, and `experiment_id` on the
   first line of the first code chunk, which must match what you passed to `--experiment`.
   Then press **Knit** (the Knit button, or `Cmd+Shift+K` / `Ctrl+Shift+K`) to run the whole
   file and produce an HTML report.

   The stub prints an exclusion summary, the confirmatory analysis, and some exploratory
   analyses. With very few participants it will tell you which analyses it skipped and why
   rather than printing nothing. Replace the confirmatory section with the analysis you
   preregistered.

5. **Commit your data and your analysis** so the repository is a complete record. Read the
   free-text columns first and blank anything a participant typed that could identify them.
   Leave `identifiers.csv` where it is.

---

## Devices

The demo requires a physical keyboard, so phones and tablets get a "Please use a computer"
screen before consent, and the visit is recorded with `device_supported: false` so you can
see how many arrived that way. Without this, a phone participant would sail through, fail to
answer every keyboard trial, and be saved as a complete session containing no usable data,
which is far harder to spot than someone who simply gives up. The analysis stub also drops
participants who never responded to a single speeded trial. If your study has no keyboard
trials, set `requires_keyboard: false` in `experiment.js`.

## Things that go wrong, and the fix

| Symptom | Cause | Fix |
| --- | --- | --- |
| Red banner: "placeholder values" | `firebase-config.js` not filled in | Section 2.5 |
| Red banner saying "Enable Anonymous sign-in" (the code reads `admin-restricted-operation` or `operation-not-allowed`) | Anonymous sign-in not enabled | Section 2.4 |
| Red banner saying the database refused the write (`permission-denied`) | Rules never published | Section 2.3 |
| That same banner appearing suddenly, about a month after you created the project, having worked until then | The project was created in test mode and those rules have now expired | Paste `firebase/firestore.rules` on the Rules tab and Publish (section 2.3) |
| Banner is gone but data still does not appear | You pasted over `window.FIREBASE_CONFIG = {` and renamed it | Section 2.5, step 4 |
| `npm test` fails: "Executable doesn't exist" | Test browser not downloaded | `npx playwright install chromium`, then `npm test` |
| `npm test` fails with "command not found" or missing modules | `npm install` has not been run in this clone | `npm install`, then `npm test` |
| `npm test` fails mentioning Java, or "Could not start emulator" | Java missing or too old | Install Java 17+ from <https://adoptium.net>. Not the version macOS suggests. |
| `npm test` fails right after you set your completion code | Should no longer happen; test runs stay on the page | If it does, check you did not remove the `!USE_EMULATOR` condition in `experiment.js` |
| Page is blank on the github.io address but fine locally | A path starting with `/`, or Pages not enabled, or repo is private | Section 3; make every path relative |
| Live page shows an old version | Browser cache | Hard-reload; allow two minutes after pushing |
| Google will not let you create a project | Workspace policy on a university account | Use a personal Google account; section 2 |
| Export says it found nothing | `--experiment` does not match `EXPERIMENT.id` | Section 6, step 3 |
| Writes start failing late in data collection | Free daily write limit | Raise `chunk_size`; writes resume the next day |
| A participant emails you a `.json` file | Their connection dropped and the page offered a download | Put it in `data/raw/<id>/manual/`, read it alongside the CSVs, and commit it: it is part of your data. Do not commit their email. |

A note on the config file in a public repo: GitHub will not warn you about it, and there is
nothing to warn about. Secret scanning does not flag Firebase web configs, and on many
repositories it is switched off entirely. Do not take silence as proof that something *is* a
secret or *is not*; the rule is simply that the config is public by design and the
service-account key from section 6 never goes near the repository.

## What to tell your agent

Agents are good at this stack, but they have habits worth heading off. The template already
tells them all of this in `CLAUDE.md`; repeat it if you see one drifting:

- Never loosen `firebase/firestore.rules` to make something work.
- Never commit a service-account key.
- Never switch to jsPsych 7 syntax or load libraries from the internet.
- Keep consent first and debrief last.
- Run `npm test` before every push.

## Glossary

- **Clone**: make your own local copy of a GitHub repository.
- **Config object**: the six lines naming the Firebase project your page talks to. Public.
- **Firestore**: the Firebase database your data lands in.
- **Anonymous sign-in**: giving each participant's browser a random id, with no account.
- **Rules**: the file deciding who may read and write your data.
- **Production mode / test mode**: starting with everything locked (correct) versus everything
  open and expiring after 30 days (wrong for this course).
- **Service account / private key**: the file letting your export script read your data as you.
- **Long format**: one row per observation, rather than one row per participant.
- **Query parameter**: the `name=value` pairs after a `?` in a URL.
- **Knit**: run an R Markdown file top to bottom and produce a report.
- **Emulator**: a local practice copy of the database, used by `npm test`.
