# Course-wide consent text (Psych 251)

This is the consent language approved for course replication projects. It must appear on the
first screen of every study. The only permitted edit is the contact address.

> By answering the following questions, you are participating in a study being performed by
> cognitive scientists in the Stanford Department of Psychology. If you have questions about
> this research, please contact us at [CLASS EMAIL ADDRESS]. You must be at least 18 years old
> to participate. Your participation in this research is voluntary. You may decline to answer
> any or all of the following questions. You may decline further participation, at any time,
> without adverse consequences. Your anonymity is assured; the researchers who have requested
> your participation will not receive any personal information about you.

Two consequences to check in the code:

- "You may decline to answer any or all of the following questions": no survey question may
  be required without a decline option (e.g. `isRequired: false`, or a "Prefer not to say"
  choice).
- "Your anonymity is assured": nothing that identifies a participant (Prolific ids, IP
  addresses, free-text names) may be committed to a public repository; see
  `references/13-management.md`.
