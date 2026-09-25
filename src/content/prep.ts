// Appointment prep options. All taps. These are things she may want to say or
// ask; none of them is advice, and none of them sets her against her GP.
//
// ⚠ Draft wording. Every line here is listed in docs/CONTENT_REVIEW.md and
// needs checking against current NHS guidance and by a clinician before the
// app goes beyond the private beta.

export interface Option {
  id: string;
  label: string;
}

/** A picked option plus the sentence or bullet it becomes in the letter. */
export interface LetterOption extends Option {
  letter: string;
}

// Specific asks first. "Talk through" stays as the general fallback.
// Goals and QUESTIONS don't overlap: tests live only in QUESTIONS, options only in GOALS.
export const GOALS: Option[] = [
  { id: 'treatment', label: 'Discuss treatment options, including HRT' },
  { id: 'cause', label: "Understand what's behind this, and check for other causes" },
  { id: 'sleep-help', label: 'Get help with my sleep' },
  { id: 'mood-help', label: 'Get help with my mood' },
  { id: 'options', label: 'Hear all my options, including not treating it' },
  { id: 'referral', label: 'Ask whether a referral would help' },
  { id: 'review', label: 'Review something I already take' },
  { id: 'plan', label: 'Leave with a clear next step and a follow-up plan' },
  { id: 'talk', label: 'Talk through these symptoms together' },
];

// What the symptoms are costing her: the centre of the letter.
export const IMPACT: LetterOption[] = [
  { id: 'work', label: 'Work', letter: 'my work' },
  { id: 'caring', label: 'Parenting or caring', letter: 'parenting or caring for others' },
  { id: 'relationships', label: 'Relationships', letter: 'my relationships' },
  { id: 'exercise', label: 'Exercise', letter: 'exercise' },
  { id: 'social', label: 'Social life', letter: 'my social life' },
  { id: 'concentration', label: 'Concentration', letter: 'my concentration' },
  { id: 'driving', label: 'Driving', letter: 'driving' },
  { id: 'home', label: 'Looking after myself or home', letter: 'looking after myself and my home' },
  { id: 'enjoy', label: "I've stopped doing things I enjoy", letter: "I've stopped doing things I enjoy" },
];

/** Opens the letter: "I'd like to get back to …". */
export const GET_BACK: LetterOption[] = [
  { id: 'work', label: 'Working well', letter: 'working the way I know I can' },
  { id: 'caring', label: 'Being there for people', letter: 'being there for the people I care for' },
  { id: 'energy', label: 'Having energy', letter: 'having energy for my life' },
  { id: 'thinking', label: 'Thinking clearly', letter: 'thinking clearly' },
  { id: 'sleep', label: 'Sleeping properly', letter: 'sleeping properly' },
  { id: 'enjoy', label: 'Enjoying things', letter: 'enjoying the things I care about' },
  { id: 'myself', label: 'Feeling like myself', letter: 'feeling like myself' },
];

// Optional background. "Prefer not to say" or skipped leaves the line out.
export const DURATION: LetterOption[] = [
  { id: 'lt3', label: 'Under 3 months', letter: 'These symptoms have been going on for less than 3 months.' },
  { id: '3-12', label: '3 to 12 months', letter: 'These symptoms have been going on for between 3 and 12 months.' },
  { id: 'gt12', label: 'Over a year', letter: 'These symptoms have been going on for more than a year.' },
];

export const LAST_PERIOD: LetterOption[] = [
  { id: 'lt3', label: 'In the last 3 months', letter: 'My last period was in the last 3 months.' },
  { id: '3-12', label: '3 to 12 months ago', letter: 'My last period was between 3 and 12 months ago.' },
  { id: 'gt12', label: 'Over a year ago', letter: 'My last period was more than a year ago.' },
  { id: 'none', label: "Coil, implant or no periods to go by", letter: "I don't have periods to go by." },
  { id: 'unsure', label: 'Not sure', letter: "I'm not sure when my last period was." },
  { id: 'skip', label: 'Prefer not to say', letter: '' },
];

export const CONTRACEPTION: LetterOption[] = [
  { id: 'hormonal-coil', label: 'Hormonal coil', letter: 'Contraception: hormonal coil.' },
  { id: 'copper-coil', label: 'Copper coil', letter: 'Contraception: copper coil.' },
  { id: 'implant', label: 'Implant', letter: 'Contraception: implant.' },
  { id: 'pill', label: 'Pill', letter: 'Contraception: the pill.' },
  { id: 'other', label: 'Other method', letter: 'I use contraception.' },
  { id: 'not-using', label: 'Not using any', letter: "I'm not using contraception." },
  { id: 'not-relevant', label: 'Not relevant to me', letter: "Contraception isn't relevant to me." },
  { id: 'skip', label: 'Prefer not to say', letter: '' },
];

export const MEDICATION: LetterOption[] = [
  { id: 'none', label: 'Nothing regular', letter: "I'm not taking any regular medication." },
  { id: 'hrt', label: 'HRT', letter: "I'm currently taking HRT." },
  { id: 'other', label: 'Other medication', letter: 'I take other prescribed medication and have the list with me.' },
  { id: 'both', label: 'HRT and other medication', letter: "I'm taking HRT and other prescribed medication, and have the list with me." },
  { id: 'skip', label: 'Prefer not to say', letter: '' },
];

export const QUESTIONS: Option[] = [
  { id: 'q-cause', label: 'What do you think could be causing this?' },
  // Age-neutral on purpose: NICE NG23 generally diagnoses perimenopause from symptoms over 45, so
  // "would tests help?" can backfire. This works at any age without asking hers. Clinician to confirm.
  { id: 'q-tests', label: 'Would tests help here, or is this assessed from symptoms?' },
  { id: 'q-not-treat', label: "If you don't think this needs treating, could you explain why?" },
  { id: 'q-if-worse', label: "If it doesn't get better, when should I come back?" },
  { id: 'q-watch', label: 'Is there anything I should look out for in the meantime?' },
  { id: 'q-record', label: 'Could you note in my record what we discussed and decided?' },
  { id: 'q-read', label: 'Is there anything I could read about this afterwards?' },
];

// Things that help a neurodivergent patient get a fair appointment. Framed as
// what helps her, not as a diagnosis she has to disclose.
export const NEEDS: Option[] = [
  { id: 'n-written', label: 'I take things in better in writing. Could the plan be written down?' },
  { id: 'n-time', label: 'I may need a moment to answer' },
  { id: 'n-direct', label: 'Plain, direct language helps me' },
  { id: 'n-closed', label: 'Direct questions work better for me than open ones' },
  { id: 'n-check', label: "I'd like to repeat the plan back to check I've understood" },
  { id: 'n-masking', label: "I may not look as unwell or in as much pain as I am" },
  { id: 'n-sensory', label: 'Bright light or noise makes it harder for me to think' },
  { id: 'n-nd', label: "I'm neurodivergent" },
];
