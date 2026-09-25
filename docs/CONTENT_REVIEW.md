# Content review register

All health-adjacent copy is **draft** until it has been checked against current NHS guidance **and** reviewed by a clinician. Private beta only until then.

| # | Where | File | What to check | Status |
| --- | --- | --- | --- | --- |
| 1 | Bleeding signpost (always shown next to the bleeding field) | `src/content/copy.ts` → `BLEEDING_SIGNPOST` | Matches current NHS pages on heavy periods and post-menopausal bleeding. Check the 999 wording for heavy bleeding with faintness. Consider adding HRT-related unscheduled bleeding. | Draft |
| 2 | "Need help now?" (every page) | `copy.ts` → `URGENT_HELP` | 111 / 999 / Samaritans numbers and wording. | Draft |
| 3 | "Not medical advice" (every page and on the sheet) | `copy.ts` → `NOT_MEDICAL_ADVICE`, `SHEET_FOOTER` | Legal wording. | Draft |
| 4 | Sheet method statement | `copy.ts` → `SHEET_METHOD` | Accurate and not overclaiming. | Draft |
| 5 | Scale questions, hints and answer words (10 scales) | `src/content/fields.ts` | Are these the right set for perimenopause in ND women? Is the wording neutral? Do the five answers read as one step apart? Is the libido wording acceptable? | Draft |
| 5b | "What was behind it?" reasons for sleep and mood | `fields.ts` → `reasons` | Are the common contributors covered without implying a cause? | Draft |
| 6 | Weekly "what else changed" options | `fields.ts` → `WEEKLY_CHANGES` | Are the common confounds covered? | Draft |
| 6b | "What's bothering you most?" symptom chips and their letter wording | `prep.ts` → `SYMPTOMS` | Her stated concern, not her readings. Is the list complete for the beta group? | Draft |
| 7 | Appointment goals | `src/content/prep.ts` → `GOALS` | Informs, doesn't advise, doesn't set her against the GP. | Draft |
| 8 | Questions to ask (4, combined in pairs) and the double-appointment line | `prep.ts` → `QUESTIONS`, `src/screens/Prep.tsx` | Do the combined questions read naturally aloud? Does "ask your practice for a double appointment" match how UK practices offer longer slots? Same as #7. Especially "If you don't think this needs treating, could you explain why?" The tests question is deliberately age-neutral: **check it against the current NICE NG23 menopause guideline** (symptom-based diagnosis over 45) before going public. | Draft |
| 8b | Impact, "get back to", duration, last period, contraception, medication | `prep.ts` | Contraception must read as a time-saver, not re-centre fertility. "Prefer not to say" leaves the line out. Wording on the periods options. | Draft |
| 8c | Mother's age at menopause | `prep.ts` → `MOTHER_AGE` | Stated as a fact only; the app never interprets it. Age bands and wording. | Draft |
| 9 | "What helps me" (ND accommodations) | `prep.ts` → `NEEDS` | Review with ND women as well as a clinician. | Draft |
| 9b | Letter to the clinician (fixed template) | `src/lib/letter.ts` | Tone is collaborative and not adversarial. Makes no claims. Only quotes the record after it has been opened. | Draft |
| 10 | About / privacy text | `src/screens/More.tsx` → `About` | Privacy claims must stay true if analytics or hosting change. | Draft |
| 11 | Welcome screen | `src/screens/Welcome.tsx` | Makes no claims. | Draft |

## Not in this build (still gated)

- "Know what you can ask for" content: needs NHS guidance and clinician review before anything is written.
- Trusted Care finder: needs wording approved entry by entry, plus clinician consent outreach. Exclude the caution tier, `doNotList` entries, entries without a website, and all Right to Choose content. The provider controversy goes behind an expander.
- Right to Choose: the copy is out of date. **Owner to check** whether the April 2026 NHS changes went ahead as planned, and update this note.
- Newson listing updates and the Panorama year need checking.
