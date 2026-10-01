# Chapter 10: Sampling (Experimentology, Chapter 10)

## Core ideas

- An experiment estimates an effect in a sample, but the claim is about a population: "a causal effect of what, and for whom?" Generic-language titles imply generality the sample rarely licenses. (§10.1 Sampling theory)
- Classical theory assumes probability sampling, but nearly all psychology uses convenience samples (undergraduates, MTurk/Prolific). Stratifying on a characteristic the outcome varies with improves precision even in convenience samples. (§10.1.1 Classical probability sampling; §10.1 depth box: Representative samples and stratified sampling)
- Convenience samples, WEIRD samples, and ad hoc item samples bias estimates only when the effect is heterogeneous; since heterogeneity is usually unknown, reason about it explicitly and qualify claims. (§10.2 Convenience samples, generalizability, and the WEIRD problem)
- Random assignment protects against collider bias (the estimate is valid only for the subselected population), but selective attrition by condition biases estimates even with random assignment and is common online, where closing a browser is dropping out. (§10.3 Biases in the sampling process)
- Collecting until p < 0.05 is optional stopping; the stopping rule must be data-independent and preregistered. Sample size may be justified by power analysis, resource constraints, SESOI, precision, or sequential analysis, but the strategy must be prespecified and justified. (§10.4 Sample size planning)
- Power analysis needs an assumed effect size; single prior studies are inflated by publication bias and pilots are too imprecise, so prefer meta-analytic estimates or a stated expectation. For replications, "small telescopes" (2.5 times the original N) is one conservative rule. (§10.4.2 Power analysis in practice; §10.4 depth box: Sample sizes for replication studies)

## Review checklist

1. Do the preregistration and writeup name the target population and recruitment source (e.g., Prolific, US-based), and does the discussion generalize only to that population? (§10.1 Sampling theory; §10.5 Chapter summary: Sampling)
2. Does the writeup acknowledge the convenience sample and consider whether the effect is likely heterogeneous, instead of implying universality? (§10.2.1 The worst version of the problem; §10.2.2 Reasons for hope and ways forward)
3. If the outcome is expected to vary with a participant characteristic, is recruitment stratified on it (check Prolific screeners against the stated design), or is not stratifying explained? (§10.1 depth box: Representative samples and stratified sampling)
4. Are stimuli described as a sample from a broader item population, and does the analysis script model item variation (e.g., item random effects)? (§10.2.1 The worst version of the problem)
5. Does the jsPsych experiment save data on early exit or incrementally (trial index, timestamps, condition) so dropouts per condition can be counted, not just completers? (§10.3.2 Attrition bias)
6. Does the analysis script compute, and the writeup report, attrition and exclusions per condition and test whether they differ between conditions? (§10.3.2 Attrition bias)
7. Is an explicit, data-independent stopping rule stated (e.g., "collect until N = X complete participants"), with the definition of a countable participant? (§10.4 Sample size planning)
8. Is there no plan to check significance and then collect more? If interim tests are planned, are N checkpoints and p-value corrections, or a Bayes Factor threshold, prespecified? (§10.4 Sample size planning; §10.4.3 Alternative approaches to sample size planning)
9. Is the sample size justified by a named strategy (power, SESOI, precision, resource constraint, sequential), written so a reviewer can follow the logic? (§10.4.3 Alternative approaches to sample size planning)
10. If a power analysis is reported, are alpha, target power (80% minimum; 90-95% for a strong test), effect size, test, and tool (pwr, G*Power, simr) stated, and does N match? (§10.4.1 Power analysis; §10.4.2 Power analysis in practice)
11. Where did the assumed effect size come from? Flag power analyses based on a single prior study or a small pilot; prefer meta-analysis, SESOI, or a stated expectation such as d = 0.5. (§10.4.2 Power analysis in practice)
12. For a replication, does the plan account for the inflated original effect (SESOI, 2.5 times original N, or sequential Bayesian analysis) rather than powering on the original effect size? (§10.4 depth box: Sample sizes for replication studies)
13. Does the power analysis match the primary analysis in the script (same test and design; per-group vs total N)? If concluding for the null is a goal, is equivalence testing or a Bayes Factor planned? (§10.4.2 Power analysis in practice)

## Common mistakes the book warns about

- Stating findings with generic language that implies generality far beyond a small convenience sample. (§10.1 Sampling theory)
- Assuming a convenience or WEIRD sample is unproblematic without considering effect heterogeneity. (§10.2.2 Reasons for hope and ways forward)
- Using a tiny ad hoc stimulus set and analyses that ignore stimulus variation, then generalizing to all stimuli. (§10.2.1 The worst version of the problem)
- Ignoring attrition online, where selective dropout by condition can flip conclusions. (§10.3.2 Attrition bias)
- Optional stopping: collecting data until p < 0.05. (§10.4 Sample size planning)
- Basing power on a pilot's effect size (too imprecise) or a single published effect (likely inflated). (§10.4.2 Power analysis in practice)
- Powering a replication on the original effect and treating significance as the only success criterion. (§10.4 depth box: Sample sizes for replication studies)

## Key terms

- Convenience sample: a non-probability sample of easily recruited individuals.
- Stratified sampling: sampling within subgroups in known proportions to ensure representation and improve precision.
- WEIRD: Western, educated, industrialized, rich, democratic; the overrepresented participant profile.
- Heterogeneity: variation of an effect across individuals or clusters; when present, nonrepresentative samples bias estimates.
- Collider bias: a spurious association from conditioning on a variable that both variables of interest cause.
- Selective attrition: dropout related to the outcome within one condition, biasing estimates despite random assignment.
- Stopping rule: the prespecified, data-independent criterion for ending data collection.
- SESOI: smallest effect size of interest; the target effect for a power analysis.
