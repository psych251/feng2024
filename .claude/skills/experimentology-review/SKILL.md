---
name: experimentology-review
description: Review a replication project (experiment code, materials, preregistration, analysis, writeup) against the best practices in the Experimentology textbook and suggest concrete improvements with chapter citations. Use when asked to review, critique, improve, or check a study design, experiment, preregistration, analysis plan, or replication report, or when asked "what would Experimentology say about this".
---

# Experimentology review

You are reviewing a student replication project in the style of Psych 251: a web
experiment (usually jsPsych), a preregistered analysis, and a replication report. The
standard is the textbook *Experimentology* (Frank, Braginsky, Cachia, Coles, Hardwicke,
Hawkins, Mathur & Williams; https://experimentology.io). Reference notes distilled from
the relevant chapters are in `references/`; read the ones you need before writing.

| File | Use it for |
| --- | --- |
| `references/03-replication.md` | what counts as a faithful replication, how to describe deviations and judge outcomes |
| `references/04-ethics.md` | consent, debriefing, participant treatment, data sharing obligations |
| `references/08-measurement.md` | reliability, validity, choice and coding of the dependent measure |
| `references/09-design.md` | manipulations, confounds, within/between, counterbalancing, order effects |
| `references/10-sampling.md` | sample size and power, exclusions, generalizability, stopping rules |
| `references/11-prereg.md` | what a preregistration must fix in advance, researcher degrees of freedom |
| `references/12-collection.md` | pilots, attention and compliance checks, online participant experience, records |
| `references/13-management.md` | repo organization, raw data preservation, naming, documentation, sharing |

## Procedure

1. **Inventory the project.** Read `README`, `experiment.js` (or the experiment source),
   the stimuli folder listing, the data pipeline (`src/save.js`, `scripts/export.js`,
   `.gitignore`, anything under `data/`), the analysis (`analysis/*.Rmd` or similar), and any
   writeup or preregistration (`writeup/`, `original_paper/`, `prereg`). Note what is missing.
   Then decide the **phase** from what exists and from what the student says:
   - *Pre-Pilot A*: no writeup or prereg yet. Review logging, analysis-code readiness,
     consent, and data handling. Skip checklist items marked "needs writeup" and list the
     prereg/power items once under "Should fix" as work to do before Pilot B, not as failures.
   - *Pre-Pilot B / pre-final*: prereg draft exists. Everything applies; a missing power
     justification, stopping rule, or exclusion rule is "Must fix".
   - *Post-collection*: also check that the writeup reports deviations and separates
     confirmatory from exploratory analyses.
2. **Write a study summary** (≤10 lines) before judging anything: original finding being
   replicated; hypothesis; IV(s) and their levels and whether within/between; DV(s) and the
   exact trial fields that record them; planned N and how it was chosen; the key
   confirmatory test; planned exclusions. If you cannot fill a line from the materials, that
   gap is itself a finding.
3. **Walk the checklists** in the reference files, in this order: design (09), measurement
   (08), sampling (10), prereg (11), collection (12), replication fidelity (03), ethics
   (04), management (13). For each item, decide: satisfied, not satisfied, or not
   determinable from the materials. Only report the last two.
4. **Verify claims in the code.** When you say a counterbalancing is missing, cite the
   line where assignment happens; when you say a measure is not saved, show the trial
   definition. Do not infer data-dependent facts (effect sizes, actual exclusion rates)
   from code; say what the code would produce.
5. **Respect deliberate deviations.** If the preregistration or writeup documents a
   deviation from the original study and gives a reason, do not flag it as an error; you
   may comment on whether the reason is sound and whether the deviation is reported where
   the book says it should be.
6. **Citations you did not read are claims, not facts.** Attributing a finding, an
   experiment number, or a statistic to a paper that is not in the repository is the one
   error this review reliably makes, and being wrong in a confident review is worse than
   saying less. Cite only what is in `original_paper/` or the student's own materials.
   Anything else gets "(from memory, verify)" attached to that sentence, and a claim you
   cannot attach to a specific paper and experiment should be cut rather than hedged.
7. **Facts about the original study.** If `original_paper/` (or the paper's text) is in the
   repo, cite it. If it is not, you may use what you know about the original, but mark each
   such fact "(from memory, verify against the paper)" and add "put the original paper in
   `original_paper/`" as a Should-fix item.
7. **Consent text.** `references/consent-text.md` is the canonical course consent. Compare
   it with the study's first screen; only the contact address may differ.

## Output format

```
## Study summary
(the 10 lines from step 2)

## Must fix before data collection
- **<one-line finding>** — why it matters (one sentence). Where: <file:line or section>.
  Fix: <concrete change>. (Experimentology §N.M <section title>)

## Should fix
(same format)

## Consider
(same format; things that would strengthen the study but are optional at course scale)

## What is already good
3–5 bullets, specific, also cited. Students learn from this too.

## Top three
The three changes with the best ratio of scientific value to effort, in one line each.
```

Reference checklists tag some items **[needs writeup]**: skip those when no writeup or
preregistration exists rather than reporting them as "not determinable". Chapters 04 and 12
overlap on consent and debriefing; report each such issue once, citing both.

Pitch it for a first-year. Six precise findings they act on beat twenty they skim: keep the
reasoning to a sentence, cut anything that is a general methods lecture rather than a change
to this project, and put the effort into the "Top three" being genuinely the top three.

Rules for findings: one issue per bullet; concrete and local (a file, a trial, a section
of the writeup); cite the chapter section every time; no generic advice that does not
depend on this project; do not pad. A typical course project yields three to six "must
fix" items, not twenty. If the materials are so incomplete that a review is premature
(no analysis script, no design description), say so in one paragraph and list what to
provide, instead of reviewing what is not there.

## Course-specific expectations (Psych 251)

- The consent text at the start of the study is the course-wide IRB language; check it is
  present and unmodified except for the contact address.
- The project moves through Pilot A (non-naive participants, checks data logging and
  analysis code), Pilot B (a few real participants), and final data collection, which
  requires a preregistration on OSF. Reviews before Pilot A should stress logging and
  analysis-code readiness; reviews before final collection should stress the
  preregistration and power.
- The writeup follows the replication-report template: the key statistical test named in
  advance, a planned sample size with a power justification tied to the original effect,
  and an explicit list of deviations from the original study.
