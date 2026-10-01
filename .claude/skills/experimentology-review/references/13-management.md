# Chapter 13: Project management (Experimentology, Chapter 13)

## Core ideas

- Good project management prevents errors for your future self and enables computational reproducibility: the analytic chain from raw data through processed data and code to reported results must stay traceable (§13 Project management).
- Four principles: one definitive copy of each document, named for what it contains; each file in a folder that uniquely identifies its function; the whole project in the cloud for collaborators; and revision history archived for data, code, and manuscript (§13.1 Principles of project management).
- Name files for what they contain; let the repository structure and version control carry context like author, date, and stage (§13.1.3 File names).
- Data management: save raw data unaltered, document the collection process, organize data as rectangular plain-text tables with consistent names and cells, and document them with a codebook (§13.2 Data management).
- Sharing is limited mainly by participant privacy; data containing only anonymous IDs and no identifiers can typically be shared, but crowdsourcing worker IDs are not anonymous (§13.3.1 What you can and can't share).
- Shared products should be FAIR (findable, accessible, interoperable, reusable): an archival repository with a DOI such as OSF, plus a license (§13.3.2 Where and how to share: the FAIR principles).

## Review checklist

1. Does the repository have a top-level README describing the project and its folders (materials, data, analysis, writing)? (§13.1.1 Organizing your project)
2. Is there exactly one definitive copy of each file, with no duplicates like analysis-FINAL-v2? (§13.1 Principles of project management)
3. Are files named for their contents and placed in folders that identify their function (e.g., data/raw, data/processed, analysis)? (§13.1.3 File names)
4. Is the project under Git with a hosted remote, with data, code, and writeup all tracked? (§13.1.2 Versioning)
5. Are raw data stored unaltered and separate from processed data, with any corrections made to a copy and documented? (§13.2.1 Save your raw data)
6. If raw data contain identifiers (Prolific or MTurk IDs, IP addresses), are they kept out of the public repository (e.g., raw/ in .gitignore) and the commit history, with a secret mapping to anonymized IDs? (§13.2.1 Save your raw data; §13.3.1 What you can and can't share)
7. Can the reported results be reproduced from the shared processed data even if raw data are withheld? (§13.2.1 Save your raw data)
8. Are participant IDs anonymous, unique, and unlinked to identity (not initials, birth dates, or test dates)? (§13.2.1 Save your raw data)
9. Is the experiment source (jsPsych code, stimuli) archived, with a record linking each data file to the materials version and date used to collect it? (§13.2.2 Document your data collection process)
10. Are data files rectangular: one header row, one observation per row, no merged cells, notes, blank rows, or side tables? (§13.2.3 Organize your data for later analysis: Spreadsheets)
11. Are variable names consistent, readable, and unit-bearing (subject_id, rt_ms) rather than software defaults like Q21? (§13.2.3 Organize your data for later analysis: Spreadsheets)
12. Does each column hold one kind of value, with missing data as NA (not blank or "missing") and dates in YYYY-MM-DD? (§13.2.3 Organize your data for later analysis: Spreadsheets)
13. Are data saved as plain-text CSV, with no analysis done in a spreadsheet program? (§13.2.3 Organize your data for later analysis: Spreadsheets)
14. Is there a codebook listing every variable with type, possible values, units, and meaning of codes? (§13.2.5 Document the format of your data)
15. Does the repository include a license (CC0 or CC-BY) and a plan to archive on a FAIR repository such as OSF with a DOI linked from the writeup? (§13.3.2 Where and how to share: the FAIR principles)

## Common mistakes the book warns about

- Keeping the only copy of data on one laptop or drive that fails or whose owner becomes unreachable (§13 Project management).
- Per-file format changes (renamed columns, changed units, merged templates) that break a shared pipeline and force costly data validation (§13 Project management, ManyBabies case study).
- Obscure variable names like Q21 hiding an assignment error that changed a paper's conclusions (§13.2.3 Organize your data for later analysis: Spreadsheets, accident report).
- Altering original raw data files instead of copying and documenting the change (§13.2.1 Save your raw data).
- Letting Excel reinterpret cells as dates, or relying on highlighting and bold as data (§13.2.3 Organize your data for later analysis: Spreadsheets).
- Treating MTurk IDs as anonymous; participants found their IDs on GitHub and they had to be scrubbed from commit histories (§13.3.1 What you can and can't share, accident report).
- Assuming de-identification suffices when an ID key is retained (fails GDPR) or rich data allow statistical reidentification (§13.3.1 What you can and can't share).
- Sharing via personal sites, GitHub alone, or journal supplements, which lack DOIs and persistence guarantees (§13.3.2 Where and how to share: the FAIR principles).

## Key terms

- Metadata: information documenting data and products, including READMEs, codebooks, and licenses.
- Codebook (data dictionary): a listing of each variable with type, possible values, units, and explanation.
- Provenance: the traceable chain from raw data through processing to a reported result.
- Repository, commit, branch, merge: a Git-tracked directory, a snapshot of its state, a parallel history, and combining histories.
- Born open: doing all project work in a publicly hosted repository from the start.
- Data validation: checking that data files conform to a shared standard before analysis.
- Anonymization (de-identification): removing identifiers like names, emails, and birth dates; under GDPR the ID key must also be destroyed.
- FAIR: findable (persistent identifier, metadata), accessible (preserved, retrievable), interoperable (standard formats), reusable (documented, licensed).
