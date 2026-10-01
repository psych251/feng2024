# Chapter 9: Design (Experimentology, Chapter 9)

## Core ideas
- An experiment manipulates factors, assigns participants to conditions, and measures the effect; the goal is a precise, unbiased causal estimate. Default: manipulate one or two factors, continuously if possible, within participants. (§9.1 Experimental designs)
- Fully-crossed factorial designs let you estimate simple effects, main effects, and interactions, but effects multiply (M^N - 1) and higher-order interactions are hard to estimate; start with one- and two-factor designs. (§9.1.2 Generalized factorial designs)
- Within-participants designs remove between-sample variation and need two to eight times fewer participants; their risks (practice, sensitization, carryover) are mitigated by randomizing or counterbalancing order and modeling order effects. (§9.1.3 Between- vs within-participant designs)
- Multiple trials with multiple items per condition reduce measurement error and license generalization beyond specific stimuli; item samples should be sized like participant samples and modeled with random effects. (§9.1.4 Repeated measures and experimental items)
- A manipulation must validly intervene on the intended construct. Confounds, placebo effects, demand characteristics, and experimenter expectancy threaten internal validity and are removed by elimination, counterbalancing, or randomization. (§9.2.1 Internal validity threats: Confounding; §9.2.2 Internal validity threats: Placebo, demand, and expectancy)
- A finding can replicate at p < 0.05 without supporting the theory if a confound drives it. (§9.1, "Automatic theory of mind?" case study)

## Review checklist
1. How many factors and levels are manipulated? Flag three or more crossed factors or predictions resting on three-way interactions. (§9.1.2 Generalized factorial designs)
2. If two factors are manipulated, are they fully crossed, and does the model include the interaction term? (§9.1.1 A two-factor experiment)
3. Is the key factor within participants? If between, is this justified by practice, sensitization, or carryover concerns? (§9.1.3 Between- vs within-participant designs)
4. In a within design, is condition order randomized or counterbalanced in the jsPsych timeline, and is order (or condition-by-order) modeled in the analysis? (§9.1.3 Between- vs within-participant designs)
5. Does each participant complete multiple trials per condition using multiple items rather than one repeated stimulus? (§9.1.4 Repeated measures and experimental items)
6. Is the item count comparable to the participant count, and does the analysis script fit a mixed-effects model with random intercepts for items and participants? (§9.1.4, "Stimulus-specific effects" accident report)
7. In a replication, has a new sample of items been considered alongside a new sample of participants? (§9.1.4, "Stimulus-specific effects" accident report)
8. In a pre-post design, does the analysis use the pre-measure as a covariate (or at least difference-in-differences) rather than comparing post scores alone? (§9.1.4 Repeated measures and experimental items)
9. Could the manipulation be titrated to ordered or continuous levels for a dose-response estimate, and if two-condition, is that justified? (§9.1.5 Discrete and continuous experimental manipulations)
10. Walking through the experiment step by step, does anything besides the target factor differ across conditions (timing, attention checks, durations, instructions, trial counts)? Each is a confound to eliminate, counterbalance, or randomize. (§9.2.1 Internal validity threats: Confounding)
11. If nuisance variables are randomized in code, does the analysis check their balance across conditions, since small samples can randomize unevenly? (§9.2.1 Internal validity threats: Confounding)
12. Is the control an active control matching contact, effort, and expectations but lacking the active ingredient, not a passive no-treatment baseline? (§9.2.2 Internal validity threats: Placebo, demand, and expectancy)
13. Are instructions delivered uniformly by software across conditions, and is any cover story paired with debriefing? (§9.2.2 Internal validity threats: Placebo, demand, and expectancy)
14. Does the writeup argue for manipulation validity, i.e., how the operationalization maps onto the construct and how broad the resulting claim can be, without the circular "theory is right because the intervention worked" argument? (§9.2.3 External validity of manipulations)

## Common mistakes the book warns about
- Defaulting to between-participants designs to avoid carryover, at a large cost in power and precision. (§9.1.3 Between- vs within-participant designs)
- Piling on manipulations measured with too little precision. (§9.3 Chapter summary: Experimental design)
- Generalizing from a small fixed stimulus set to a whole class of stimuli (the "risky shift" and word-length effects). (§9.1.4, "Stimulus-specific effects" accident report)
- Letting a nuisance variable such as attention-check timing covary with condition, producing a replicable but meaningless effect. (§9.1, "Automatic theory of mind?" case study)
- Comparing treatment to a passive control, confounding effort and expectations with treatment (brain training). (§9.2.2, "Brain training?" accident report)
- Ignoring demand characteristics and experimenter expectancy, which can create phenomena artifactually. (§9.2.2 Internal validity threats: Placebo, demand, and expectancy)
- Consolidating subexperiments with different measures post hoc to obtain a significant interaction. (§9.2.2, "Brain training?" accident report)

## Key terms
- Condition: an intervention state; the common design compares a control condition with an experimental (treatment) condition.
- Factor: a dimension along which manipulations vary; fully crossed means every level of each factor is paired with every level of the others.
- Simple effect / main effect / interaction: effect of one factor at a fixed level of another; average effect of a factor; departure of the combined effect from the sum of simple effects.
- Within- vs between-participants: each participant experiences multiple levels of a factor vs only one.
- Carryover, practice, sensitization effects: earlier conditions altering later responses via lasting effects, learning, or noticing the contrast.
- Experimental confound: a variable created by the design that is causally related to the predictor and potentially to the outcome.
- Counterbalancing vs randomization: varying a nuisance factor systematically so its average effect is zero vs choosing its level at random.
- Dose-response relationship: how the measure changes as the strength of a titrated manipulation varies.
