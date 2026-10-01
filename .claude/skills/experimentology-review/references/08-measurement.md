# Chapter 8: Measurement (Experimentology, Chapter 8)

## Core ideas
- Measures are manifest operationalizations of latent constructs. Two properties matter: **reliability** (signal relative to noise; a property of the instrument) and **validity** (whether the measure captures the intended construct). (§8.1 Reliability; §8.2 Validity)
- Reliability is the share of observed-score variance due to true-score variance, estimated by test-retest correlation or internal consistency (split-half, Cronbach's alpha). It is relative to the variability of the sample and items. (§8.1.2 Measuring reliability)
- Low reliability caps detectable effects: the maximal observable correlation between two measures is the square root of the product of their reliabilities, and lower reliability means larger required samples. (§8.1.3 Practical advice for computing reliability)
- Validity is an argument built from several kinds of evidence (face, ecological, internal, convergent, predictive, divergent), not a single test. (§8.2 Validity)
- Prefer a preexisting measure with known reliability and validity; if you invent one, you must estimate its reliability and argue for its validity. Simple, explicit behaviors are the best starting point. (§8.3 How to select a good measure?)
- The best experiment shows a simple, valid manipulation affecting a single reliable, valid measure; extra measures risk fatigue, carryover, hedged bets, circular interpretation, and selective reporting. (§8.4 The temptation to measure lots of things)

## Review checklist
1. Is the construct defined, and is the measure justified as an operationalization of it? (§8.2.2 Avoid questionable measurement practices!)
2. Was the measure taken from the literature (ideally the original study) or created from scratch? If new, is there a plan to estimate reliability and argue validity? (§8.3 How to select a good measure?)
3. Does the preregistration or analysis script fix the scoring of the measure (items used, transforms, thresholds, composites) before data collection? (§8.2.2 Avoid questionable measurement practices!)
4. Are modifications to the original measure (dropped items, rescaled responses, reworded items) described and dated as pre- or post-data collection? (§8.2.2 Avoid questionable measurement practices!)
5. Do the summary statistics fit the scale type: mode for nominal, median for ordinal, mean/SD for interval? (§8.1.1 Measurement scales)
6. If Likert data are treated as interval (means, linear regression), does the analysis inspect raw item distributions or use ordinal regression instead? (§8.4, "Survey measures" depth box)
7. Do Likert scales use seven points if bipolar, five if unipolar, with every point verbally labeled? (§8.4, "Survey measures" depth box)
8. Does the survey avoid sliders/visual analog scales, "I don't know"/"other" options, and double-barreled questions? (§8.4, "Survey measures" depth box)
9. Are there multiple items or trials per condition, and does the analysis check item-level distributions for floor and ceiling effects and for items unrelated to the others? (§8.1.3 Practical advice for computing reliability)
10. For multi-item instruments, does the script compute a reliability estimate, with alpha interpreted only as a lower bound rather than proof of unidimensionality? (§8.1.2 Measuring reliability)
11. If responses are hand-coded, is the coding scheme fixed in advance with inter-rater reliability (Cohen's kappa or ICC) planned? (§8.1.2 Measuring reliability)
12. If both accuracy and reaction time are collected, is one designated primary, with the speed-accuracy trade-off acknowledged? (§8.3.2 Implicit vs explicit behaviors)
13. If several outcome measures are included, is there a strong prediction for each, a primary endpoint, a plan for inconsistent results, and a commitment to report all of them? (§8.4 The temptation to measure lots of things)
14. Does the analysis compare absolute values (accuracies, RTs) to the original paper as a sanity check? (§8.3 How to select a good measure?)

## Common mistakes the book warns about
- Inventing ad hoc measures without justifying them in terms of reliability and validity. (§8.2.2 Avoid questionable measurement practices!)
- Changing scoring rules after seeing data without disclosure, which resembles p-hacking (the CRTT's 157 quantification strategies). (§8.2.2 Avoid questionable measurement practices!)
- Ignoring reliability and wasting effort on effects that could not be detected at the sample size used. (§8.1.3 Practical advice for computing reliability)
- Treating Cronbach's alpha as evidence of internal consistency or dimensionality. (§8.1.2 Measuring reliability)
- Adding measures to hedge bets, then calling the one with the bigger effect the "better measure," which is circular. (§8.4 The temptation to measure lots of things)
- Using sliders, "I don't know" options, or long unengaging surveys that invite satisficing and straight-lining. (§8.4, "Survey measures" depth box)
- Relying on complex, open-ended behaviors that are hard to repeat and vulnerable to demand characteristics. (§8.3.1 Simple vs complex behaviors)

## Key terms
- Reliability: ratio of true-score variance to observed-score variance; signal relative to noise.
- Validity (construct validity): the relationship between a measure and the construct it is meant to measure.
- Test-retest reliability: correlation between two parallel administrations; the most conservative practical estimate.
- Cronbach's alpha: split-half reliability averaged over all splits; a lower bound on reliability.
- Floor and ceiling effects: responses bunched at the bottom or top of a scale, limiting an item's usefulness.
- Scale types (nominal, ordinal, interval, ratio): Stevens's hierarchy; only ratio scales have a true zero, and each licenses different statistics.
- Double-barreled question: an item asking about two things at once.
- Satisficing: giving good-enough survey answers without real thought, e.g., straight-lining.
