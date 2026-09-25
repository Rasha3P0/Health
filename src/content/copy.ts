// Health-adjacent copy that must stay fixed and reviewable in one place.
// ⚠ Draft. Listed in docs/CONTENT_REVIEW.md.

export const NOT_MEDICAL_ADVICE =
  'Not medical advice. This app helps you keep a record and prepare. It does not diagnose or treat anything.';

export const URGENT_HELP = {
  lead: 'If you feel very unwell or are worried right now:',
  lines: [
    { text: 'NHS 111 (call or go online)', href: 'https://111.nhs.uk/' },
    { text: 'In an emergency, call 999', href: 'tel:999' },
    { text: 'Samaritans, any time: 116 123', href: 'tel:116123' },
  ],
};

// Always shown next to the bleeding field. Emphasised when heavy is chosen.
// Based on NHS "see a GP if" guidance for heavy periods and post-menopausal
// bleeding: https://www.nhs.uk/conditions/heavy-periods/ and
// https://www.nhs.uk/conditions/post-menopausal-bleeding/
export const BLEEDING_SIGNPOST = {
  text:
    "The NHS says to see a GP about bleeding that is heavy enough to affect your daily life, bleeding between periods, or any bleeding a year or more after your periods stopped. If you're bleeding heavily and feel faint or dizzy, call 999.",
  links: [
    { text: 'NHS: heavy periods', href: 'https://www.nhs.uk/conditions/heavy-periods/' },
    { text: 'NHS: bleeding after menopause', href: 'https://www.nhs.uk/conditions/post-menopausal-bleeding/' },
  ],
};

export const SHEET_METHOD =
  'I recorded these day by day, at the time, with taps on a 1–5 scale (1 = not at all, 5 = very much). ' +
  'The readings were hidden from me until the date of this appointment, so I could not see or steer the trend while recording.';

export const SHEET_FOOTER =
  "This is my own record, not a medical assessment. Averages and counts are of what I recorded; missing days mean I didn't record, not that I had no symptoms.";
