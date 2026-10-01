# Chapter 3: Replication (Experimentology, Chapter 3)

## Core ideas
- A finding is **reproducible** if the same data and analysis give the same result, **replicable** if new data collected with the same methods give the same result, and **robust** if a different analysis of the same data agrees. "Same" is always a matter of degree (§3.1 Reproducibility).
- Reported numbers need provenance: the full analysis pipeline from raw data to paper. Without shared code and data, errors are common and usually undetectable; about half of psychology papers contain an inconsistent p-value and only about a third of open-data papers were fully reproducible without author help (§3.1 Reproducibility).
- The key challenge of replication is **invariance**: which features of procedure and sample an effect should be constant over. Theory tells you what matters, so replication depends on theory and theory depends on replication (§3.2.1 Conceptual frameworks for replication; §3.4.1 Reciprocity between replication and theory).
- Published findings replicate far less often than hoped (roughly 56% for well-powered replications of typical experiments), and success should be judged by comparing effect estimates, not by binary significance. Publication bias and analytic flexibility (data-dependent decision-making, undisclosed flexibility, p-hacking) are the best-supported drivers of low replicability; context sensitivity and experimenter expertise have not held up empirically (§3.3 Causes of replication failure).
- Open science (sharing materials, data, code, sampling and analysis plans, preregistration) enables reproducibility checks and close replications, reduces p-hacking, and separates confirmatory from exploratory findings (§3.4.3 Open science).

## Review checklist
1. Does the repository contain the raw data plus a script that regenerates every reported number and figure, so the pipeline's provenance is traceable end to end? (§3.1 Reproducibility)
2. Is the analysis fully scripted rather than described in prose or done by hand? (§3.1 Reproducibility; §3.4.3 Open science)
3. Are reported statistics internally consistent (test statistic, degrees of freedom, p-value agree), and do writeup numbers match script output? (§3.1 Reproducibility) **[needs writeup]**
4. Does the writeup state the replication goal (verification, precision, replicate-and-extend) and whether it is direct or conceptual, without calling a different operationalization a "replication"? (§3.2 Replication; §3.2.1 Conceptual frameworks for replication) **[needs writeup]**
5. Does the project reuse the original materials where available and document every deviation in stimuli, instructions, procedure, and sample (online vs. lab, language, population) as a possible invariance violation? (§3.2.1; §3.4.3 Open science) **[needs writeup]**
6. Are exclusion criteria and preprocessing specified in advance and implemented in the script exactly as preregistered? (§3.4.3 Open science)
7. Does the preregistration fix dependent measures, conditions, covariates, and stopping rule so that dropping measures or conditions, optional stopping, and conditional covariates cannot happen silently? ("Analytic flexibility" accident report, §3.3)
8. Is the sample size justified relative to the original effect, so the study is not a "small telescope" that could not see the effect either way? ("Small Telescopes" accident report, §3.2.1)
9. Does the success criterion compare effect sizes (with intervals) rather than only whether p < 0.05 in the same direction? ("Small Telescopes" accident report, §3.2.1)
10. If the replication fails, does the writeup treat context sensitivity, hidden moderators, or expertise as hypotheses needing evidence rather than as default explanations? ("Context, moderators, and expertise" depth box, §3.3) **[needs writeup]**
11. Does the discussion weigh the total evidence across original and replication (time-reversal heuristic) rather than giving the original precedence? ("Small Telescopes" accident report, §3.2.1) **[needs writeup]**
12. Is critique aimed at the design and analysis, not the original authors, with no language assuming negative intent? ("Consequences for the study, consequences for the person" accident report, §3.2.2) **[needs writeup]**
13. Are materials, data, and code shared so others can reproduce and replicate this project? (§3.4.3 Open science)

## Common mistakes the book warns about
- Reporting a test statistic, degrees of freedom, and p-value that do not agree; decision-changing errors tend to favor the authors' hypotheses (§3.1 Reproducibility).
- Sharing no code or data, or data that are inaccessible, incomplete, or incomprehensible (§3.1 Reproducibility).
- Declaring a replication "successful" or "failed" from significance alone when the original was underpowered or the effect sizes tell a different story ("Small Telescopes" accident report, §3.2.1).
- Trying many analyses after seeing the data and reporting only the one that "worked": dropping measures or conditions, testing extra participants after a null result, adding covariates conditionally ("Analytic flexibility" accident report, §3.3).
- Letting whether p < 0.05 determine whether a result is reported (§3.3 Causes of replication failure).
- Accepting context sensitivity or expertise as explanations for failure without empirical evaluation ("Context, moderators, and expertise" depth box, §3.3).

## Key terms
- Reproducible: same data, same analysis, same result (analytic or computational reproducibility).
- Replicable: new data with the same methods and analysis, same result.
- Analysis pipeline: the chain of steps from raw data to reported numbers; its provenance must be traceable.
- Invariance: the procedural and sample features over which an effect is expected to stay constant.
- Direct vs. conceptual replication: reproducing all salient features up to presumed invariances, versus testing the same hypothesis with different operationalizations.
- Analytic flexibility / p-hacking: data-dependent decision-making and undisclosed flexibility, trying many analyses and reporting some.
- Publication bias: preference for studies that "work" (p < 0.05), leaving negative results in the file drawer.
- Open science: practices and policies organized around transparency and verifiability ("nullius in verba").
