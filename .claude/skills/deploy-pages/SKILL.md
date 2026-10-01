---
name: deploy-pages
description: Put the experiment online with GitHub Pages and verify the live site, including the Prolific study URL. Use when asked to deploy, publish, "make it live", fix a blank or stale page on github.io, or build the link for participants.
---

# Deploying to GitHub Pages

The repo root **is** the site. `index.html` loads everything from relative paths, and
`.nojekyll` stops GitHub from mangling the files. There is no build step and no workflow to
deploy; pushing to `main` is the deploy.

## Steps

1. Make sure `npm test` passes and `firebase-config.js` is filled in, then push to `main`.
2. **The student enables Pages, not you.** Even if you hold a token that could do it through
   the GitHub API, do not: it is an account setting on a repository they own, it can fire
   against the wrong repository, and the point of this template is that the student's GitHub
   and Google accounts never have to be wired to anything. Give them this and wait:
   **repo → Settings → Pages → Build and deployment → Source: Deploy from a branch →
   Branch `main`, folder `/ (root)` → Save.** The repo must be public
   (private repos need a paid plan for Pages). Ask them to paste the URL Pages shows,
   normally `https://<org>.github.io/<repo>/`.
3. Verify from the terminal:
   ```bash
   curl -sI https://<org>.github.io/<repo>/ | head -1            # expect 200
   curl -s https://<org>.github.io/<repo>/ | grep -c 'lib/jspsych.js'   # expect 1
   curl -sI https://<org>.github.io/<repo>/lib/firebase-bundle.js | head -1   # expect 200
   ```
   Then load the live URL in headless Chromium and check `window.__saver.mode === "firebase"`.
   Run through the experiment once from the live URL and confirm with the student that a
   participant document appeared in Firestore.
4. Deploys take one to two minutes. Progress is visible under the repo's **Actions** tab as
   "pages build and deployment". A 404 right after enabling is normal; wait and retry.

## Prolific URL

Study URL for Prolific (replace org and repo):

```
https://<org>.github.io/<repo>/?PROLIFIC_PID={{%PROLIFIC_PID%}}&STUDY_ID={{%STUDY_ID%}}&SESSION_ID={{%SESSION_ID%}}
```

Set `prolific_completion_code` in `experiment.js` to the code Prolific shows, choose
"I'll redirect them using a URL" as the completion method, and test with Prolific's preview
link. `DataSaver` stores the three ids on the participant document and on every trial row.

## Things that go wrong

- **Blank page on Pages, works locally**: an absolute path (`/lib/...`) somewhere; project
  sites live under `/<repo>/`, so every path must be relative. Also check the branch/folder
  setting and that the repo is public.
- **Old version keeps showing**: browser cache. Hard reload; the server sends normal caching
  headers. Bump `window.TEMPLATE_VERSION` if you need to confirm which version is live.
- **Org blocks Pages**: an org owner must allow Pages for members
  (Organization settings → Pages). Report this to the course staff rather than working around it.
- **Large stimuli**: single files must be under 100 MB and the site under 1 GB. Do not use
  Git LFS; Pages serves LFS pointers, not files.
- **Public means public**: anyone with the link can take the study and read the materials.
  Do not put copyrighted stimuli you are not allowed to redistribute in the repo; do not
  put answer keys or the analysis of a participant's data in files the site serves.
- Cross-check the consent text and contact email on the live page before sharing the link.
