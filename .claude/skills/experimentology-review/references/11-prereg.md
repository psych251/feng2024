# Chapter 11: Preregistration (Experimentology, Chapter 11)

## Core ideas

- Most research decisions (stopping rule, outliers, subgroups) have many justifiable options, "researcher degrees of freedom"; five decisions with five options each give 3,125 analyses. Choosing after seeing data skews results toward the researcher's preferences. (§11.1 Lost in a garden of forking paths)
- The garden of forking paths is a multiplicity problem, but corrections must account for every path that could have been taken, which is impossible once you explore the garden with the data in hand. Trying paths and reporting only the favorable one is p-hacking. (§11.1 Lost in a garden of forking paths; §11.1.1 Data-dependent analysis)
- HARKing (hypothesizing after results are known) expands the garden by inventing hypotheses that justify post hoc analyses; at minimum, be honest about whether hypotheses preceded the data. (§11.1.2 Hypothesizing after results are known)
- Confirmatory research makes decisions before seeing data; exploratory research makes them after. Confirmation tests hypotheses, exploration generates them; both are valuable if you disclose which is which. (§11.1.2 Hypothesizing after results are known)
- Preregistration declares research decisions in a public registry (the book recommends OSF) before analyzing, and usually before collecting, data. It reduces risk of bias, lets readers calibrate confidence, and improves planning; it requires transparency about what was and was not planned, not that everything be prespecified. (§11.2 Reducing risk of bias, increasing transparency, and calibrating confidence with preregistration)
- Preregistration is "a plan, not a prison": departures are common and acceptable if disclosed, ideally with planned and unplanned analyses both reported as a robustness check and confirmatory and exploratory results kept separate. (§11.3 How to preregister; §11.4 Chapter summary: Preregistration)

## Review checklist

1. Is there a preregistration document, with evidence (OSF registration link, timestamp) that it was registered before data collection or analysis? (§11.3 How to preregister)
2. Does it state whether any data were already collected, and is the main hypothesis explicit enough to be confirmed or disconfirmed? (§11.3 How to preregister, template items 1-2)
3. Are the key dependent variables named with how they are measured, and does the jsPsych code actually record them (matching columns, response types, timing)? (§11.3 How to preregister, template item 3)
4. Are conditions and assignment specified, and does the experiment code implement the same conditions (number, labels, between vs within, randomization)? (§11.3 How to preregister, template item 4)
5. Is the exact analysis for the main hypothesis specified (model, predictors, test, alpha or Bayes Factor threshold), and does the script run that analysis on the prespecified DV without unregistered variants presented as primary? (§11.3 How to preregister, template item 5)
6. Are outlier and exclusion rules precise (thresholds, attention checks, RT cutoffs, incomplete sessions), and does the script implement exactly those with no extra data-dependent filters? (§11.3 How to preregister, template item 6)
7. Is the sample size or stopping rule stated precisely, including what counts as a participant, and does the Prolific setup match it? (§11.3 How to preregister, template item 7)
8. Are secondary and exploratory analyses listed under "Other," with exploratory-only variables flagged? (§11.3 How to preregister, template item 8)
9. Does the writeup separate confirmatory (preregistered) from exploratory (unplanned) analyses, by section or explicit labels? (§11.3 How to preregister)
10. Are all departures from the plan disclosed with reasons (e.g., a deviations table), ideally with the planned analysis also reported as a robustness check? (§11.3 How to preregister) **[needs writeup]**
11. Are hypotheses presented as a priori only if they appear in the preregistration, with post hoc ones labeled as such? (§11.1.2 Hypothesizing after results are known) **[needs writeup]**
12. Does the script avoid the "hot or cold" pattern: no loops over alternative DVs, subgroups, covariates, or exclusion thresholds with only the significant one reported? Unregistered subgroup analyses must be labeled exploratory. (§11.1.1 Data-dependent analysis) **[needs writeup]**
13. Where several analytic choices are equally justifiable (e.g., missing data), is a robustness check or multiverse prespecified rather than chosen after seeing results? (§11.2 depth box: Preregistration and friends)

## Common mistakes the book warns about

- Reporting an analysis chosen from many paths (splitting by usage with covariates) without the simple primary causal effect, as in the Bedtime Math case study. (§11 case study: Undisclosed analytic flexibility?)
- Correcting only for the comparisons reported, when corrections must cover every path that could have been taken. (§11.1 Lost in a garden of forking paths)
- Playing "hot or cold" with analysis decisions until the result is favorable, then reporting only that path (p-hacking). (§11.1.1 Data-dependent analysis)
- Inventing a post hoc explanation to justify an unplanned subgroup analysis and presenting it as predicted (HARKing). (§11.1.2 Hypothesizing after results are known)
- Giving exploratory findings the same confidence as confirmatory ones, or not saying which is which. (§11.2 Reducing risk of bias, increasing transparency, and calibrating confidence with preregistration)
- Silently departing from the preregistered plan instead of disclosing the change. (§11.3 How to preregister)

## Key terms

- Researcher degrees of freedom: the many justifiable choices in designing, analyzing, reporting, and interpreting a study.
- Garden of forking paths: a decision tree of analytic choices, each path ending in a different result.
- p-hacking: trying multiple analysis paths and selectively reporting the desirable result.
- HARKing: selecting or developing a hypothesis after observing the data.
- Confirmatory vs exploratory: decisions made before vs after seeing data; testing vs generating hypotheses.
- Preregistration: declaring research decisions in a public registry before analyzing (often before collecting) data.
- Robustness check (sensitivity analysis): rerunning the analysis under alternative justifiable choices.
- Masked analysis: inspecting data with results-related features disguised (e.g., shuffled condition labels).
