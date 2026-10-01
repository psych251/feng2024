# Chapter 12: Data collection (Experimentology, Chapter 12)

## Core ideas

- Experimenters must respect participant autonomy: inform participants of risks and benefits, obtain consent, and debrief afterward. The consent form should center the participant's experience of the study, not the research question; study goals belong in debriefing (§12.1.1 Getting consent).
- Consent requires competence, comprehension, and voluntariness. Stating that participation is voluntary is not enough; avoid structural coercion such as compensation so high that low-income participants cannot withdraw (§12.1.2 Prerequisites of consent).
- Debriefing has four parts: gratitude with commensurate compensation, discussion of goals, explanation of any deception, and questions and clarification (§12.1.3 Debriefing participants).
- For minimal-risk experiments, the participant's user experience (UX) determines whether the study succeeds ethically and scientifically; confusing or frustrating experiments produce dropout and poor data (§12.2 Designing the "research experience").
- Browser-based tools like jsPsych aid transparency because readers can share the participant's experience via a link, and well-designed online studies are as reliable as in-lab ones except for sub-50 ms stimulus presentation (§12.2.3 When to collect data online?).
- High-quality data are uncontaminated by misunderstanding, fatigue, or neglect of the task; the tools are systematic piloting, compliance checks used as preregistered exclusion criteria, and consistent metadata records (§12.3 Ensuring high-quality data).

## Review checklist

1. Does the experiment open with a consent statement naming the researchers, giving contact information, stating that participation is voluntary and can stop at any time without adverse consequences, stating any age requirement, and describing anonymity? (§12.2.2 Ensuring good experiences for online participants)
2. Does consent describe what participants will do, how long it takes, and payment, rather than the hypothesis, and is any deception justified and disclosed at debriefing? (§12.1.1 Getting consent)
3. Does the experiment end with a debriefing that thanks participants, explains the goals in plain language, reveals any deception, and prominently gives contact information? (§12.1.3 Debriefing participants; §12.2.2 Ensuring good experiences for online participants)
4. Is compensation commensurate with time and effort, ideally at or above the applicable minimum wage, and clearly stated? (§12.1.4 Special considerations for vulnerable populations)
5. Is the policy to always pay participants who complete the experiment, handling noncompliance with check trials and preregistered exclusions rather than nonpayment or rejection? (§12.2.2 Ensuring good experiences for online participants)
6. Does the interface respond to every keypress or click, show progress through trials, and include practice trials before critical blocks in a speeded paradigm? (§12.2.2 Ensuring good experiences for online participants)
7. Does the data file log every variable of interest per trial, most critically condition assignment, plus participant ID, trial number, stimulus, and response? (§12.3.1 Conduct effective pilot studies)
8. Does the writeup report a non-naive pilot whose data were actually analyzed, and a naive pilot (10-20 people for a short online study) recruited through the planned channel and debriefed about their experience? (§12.3.1 Conduct effective pilot studies)
9. Were pilots used only to check procedure viability (crashes, confusing instructions, dropout, logging), not to estimate an effect size? (§12.3.1 Conduct effective pilot studies)
10. Are passive compliance measures (total and per-page completion times) recorded, and do comprehension checks on the instructions loop participants back until they answer correctly? (§12.3.2 Measure participant compliance)
11. Are exclusions based on passive measures and comprehension checks preregistered, and does the analysis script report exclusion rates and check they are low and uniform across conditions? (§12.3.2 Measure participant compliance)
12. If a manipulation check is included, is it analyzed separately from the dependent variable? (§12.3.2 Measure participant compliance)
13. Are attention and compliance checks identical across conditions? (§12.3.2 Measure participant compliance)
14. Does the analysis script avoid entering any check score as a covariate in the analytic model? (§12.3.2 Measure participant compliance)
15. Is there a run log recording metadata for each data collection run (date, sample, experiment version, personnel) so pilot and main files can be told apart? (§12.3.3 Keep consistent data collection records)

## Common mistakes the book warns about

- Failing to log the condition variable, discovered only after full data collection; an analyzed pilot would have caught it (§12.3.1 Conduct effective pilot studies).
- Using pilot data to check whether the effect is present or to estimate effect size for power analysis (§12.3.1 Conduct effective pilot studies).
- Withholding payment or rejecting online workers based on performance, which damages their platform reputation (§12.1.4 Special considerations for vulnerable populations).
- Including compliance checks as covariates, which conditions on a post-treatment variable and biases the causal estimate (§12.3.2 Measure participant compliance).
- Attention checks that differ across conditions, which can themselves create an experimental effect (§12.3.2 Measure participant compliance).
- Trick attention checks that push participants into an adversarial stance and trade representativeness for compliance (§12.3.2 Measure participant compliance).
- Over-fitting the design to small differences in pilot data instead of treating piloting like fixing typos (§12.3.1 Conduct effective pilot studies).
- Files named run1.csv, run2.csv with no record of which protocol produced each (§12.3.3 Keep consistent data collection records).

## Key terms

- Consent form: document explaining the study's procedures, risks and benefits, and asking for explicit voluntary consent.
- Assent: informal agreement from someone who cannot legally consent, obtained alongside guardian consent.
- Structural coercion: features of the study environment, such as high compensation, that make withdrawal hard.
- Deception: withholding or misrepresenting study information; allowed only with ethics approval, low risk, and full debriefing.
- Pilot study: small pre-launch study that checks procedures and logging, not effects.
- Comprehension check: question verifying the participant understood the instructions or materials.
- Manipulation check: measure of a prerequisite difference between conditions confirming the manipulation worked, distinct from the key effect.
- Attention check: trial with an obvious or embedded correct answer that catches participants ignoring the text.
