# Content review register

All health-adjacent copy is **draft** until it has been checked against current NHS guidance **and** reviewed by a clinician. Private beta only until then.

| # | Where | File | What to check | Status |
| --- | --- | --- | --- | --- |
| 1 | Bleeding signpost (always shown next to the bleeding field) | `src/content/copy.ts` → `BLEEDING_SIGNPOST` | Matches current NHS pages on heavy periods and post-menopausal bleeding. Check the 999 wording for heavy bleeding with faintness. Consider adding HRT-related unscheduled bleeding. | Draft |
| 2 | "Need help now?" (every page) | `copy.ts` → `URGENT_HELP` | 111 / 999 / Samaritans numbers and wording. | Draft |
| 3 | "Not medical advice" (every page and on the sheet) | `copy.ts` → `NOT_MEDICAL_ADVICE`, `SHEET_FOOTER` | Legal wording. | Draft |
| 4 | Sheet method statement | `copy.ts` → `SHEET_METHOD` | Accurate and not overclaiming. | Draft |
| 5 | Field labels and hints (10 scales) | `src/content/fields.ts` | Are these the right set for perimenopause in ND women? Is the wording neutral? Is the libido label acceptable? | Draft |
| 6 | Weekly "what else changed" options | `fields.ts` → `WEEKLY_CHANGES` | Are the common confounds covered? | Draft |
| 7 | Appointment goals | `src/content/prep.ts` → `GOALS` | Informs, doesn't advise, doesn't set her against the GP. | Draft |
| 8 | Questions to ask | `prep.ts` → `QUESTIONS` | Same as #7. Especially "If you don't think this needs treating, could you explain why?" | Draft |
| 9 | "What helps me" (ND accommodations) | `prep.ts` → `NEEDS` | Review with ND women as well as a clinician. | Draft |
| 10 | About / privacy text | `src/screens/More.tsx` → `About` | Privacy claims must stay true if analytics or hosting change. | Draft |
| 11 | Welcome screen | `src/screens/Welcome.tsx` | Makes no claims. | Draft |

## Not in this build (still gated)

- "Know what you can ask for" content: needs NHS guidance and clinician review before anything is written.
- Trusted Care finder: needs wording approved entry by entry, plus clinician consent outreach. Exclude the caution tier, `doNotList` entries, entries without a website, and all Right to Choose content. The provider controversy goes behind an expander.
- Right to Choose: the copy is out of date (April 2026 NHS changes).
- Newson listing updates and the Panorama year need checking.
