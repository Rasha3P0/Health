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

// Standing directive: her own health and life come first in every list; caring
// for others and reproductive items come lower. Never removed, only placed lower.

// Specific asks first. "Talk through" stays as the general fallback.
// Goals and QUESTIONS don't overlap: tests live only in QUESTIONS, options only in GOALS.
export const GOALS: Option[] = [
  { id: 'treatment', label: 'Discuss treatment options' },
  { id: 'cause', label: "Understand what's behind this, and check for other causes" },
  { id: 'sleep-help', label: 'Get help with my sleep' },
  { id: 'mood-help', label: 'Get help with my mood' },
  { id: 'options', label: 'Hear all my options, including not treating it' },
  { id: 'referral', label: 'Ask whether a referral would help' },
  { id: 'review', label: 'Review something I already take' },
  { id: 'plan', label: 'Leave with a clear next step and a follow-up plan' },
  // Lower on purpose: naming HRT up front frames everything as menopause before other causes are considered.
  { id: 'hrt', label: 'Discuss HRT specifically' },
  { id: 'talk', label: 'Talk through these symptoms together' },
];

// What the symptoms are costing her: the centre of the letter.
export const IMPACT: LetterOption[] = [
  { id: 'home', label: 'Looking after myself or home', letter: 'looking after myself and my home' },
  { id: 'concentration', label: 'Concentration', letter: 'my concentration' },
  { id: 'exercise', label: 'Exercise', letter: 'exercise' },
  { id: 'enjoy', label: "I've stopped doing things I enjoy", letter: "I've stopped doing things I enjoy" },
  { id: 'social', label: 'Social life', letter: 'my social life' },
  { id: 'driving', label: 'Driving', letter: 'driving' },
  { id: 'work', label: 'Work', letter: 'my work' },
  { id: 'relationships', label: 'Relationships', letter: 'my relationships' },
  { id: 'caring', label: 'Parenting or caring', letter: 'parenting or caring for others' },
];

/**
 * What she wants to talk about. Her stated concern, not her readings, so it can
 * name symptoms in the letter without breaking the seal.
 */
export const SYMPTOMS: LetterOption[] = [
  { id: 'energy', label: 'Energy', letter: 'low energy' },
  { id: 'sleep', label: 'Sleep', letter: 'poor sleep' },
  { id: 'fog', label: 'Thinking clearly or brain fog', letter: 'brain fog' },
  { id: 'mood', label: 'Mood', letter: 'low mood' },
  { id: 'anxiety', label: 'Anxiety', letter: 'anxiety' },
  { id: 'aches', label: 'Pain', letter: 'pain' },
  { id: 'flushes', label: 'Hot flushes or night sweats', letter: 'hot flushes or night sweats' },
  { id: 'headaches', label: 'Headaches', letter: 'headaches' },
  { id: 'overload', label: 'Feeling overloaded', letter: 'feeling overloaded' },
  { id: 'libido', label: 'Sex drive', letter: 'low sex drive' },
  { id: 'bleeding', label: 'Bleeding', letter: 'bleeding' },
];
export const SYMPTOMS_MAX = 3;

/** Opens the letter: "I'd like to get back to …". */
export const GET_BACK: LetterOption[] = [
  { id: 'myself', label: 'Feeling like myself', letter: 'feeling like myself' },
  { id: 'energy', label: 'Having energy', letter: 'having energy for my daily life' },
  { id: 'thinking', label: 'Thinking clearly', letter: 'thinking clearly' },
  { id: 'sleep', label: 'Sleeping properly', letter: 'sleeping properly' },
  { id: 'enjoy', label: 'Enjoying things', letter: 'enjoying the things I care about' },
  { id: 'work', label: 'Working well', letter: 'working the way I know I can' },
  { id: 'caring', label: 'Being there for people', letter: 'being there for the people I care for' },
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
  { id: 'hormonal-coil', label: 'Hormonal coil', letter: 'I use a hormonal coil for contraception.' },
  { id: 'copper-coil', label: 'Copper coil', letter: 'I use a copper coil for contraception.' },
  { id: 'implant', label: 'Implant', letter: 'I use an implant for contraception.' },
  { id: 'pill', label: 'Pill', letter: 'I take the pill for contraception.' },
  { id: 'other', label: 'Other method', letter: 'I use contraception.' },
  { id: 'not-using', label: 'Not using any', letter: "I'm not using contraception." },
  { id: 'not-relevant', label: 'Not relevant to me', letter: "Contraception isn't relevant to me." },
  { id: 'skip', label: 'Prefer not to say', letter: '' },
];

// Day to day. The GP will usually ask, so answering up front saves the
// appointment for cause. Letter text is a fragment after "I …".
// Deliberately NOT asked: weight, BMI, calories or food diaries (disordered-eating
// risk; the GP can measure in the room if needed). Do not add them.
export type LifestyleKey = 'exercise' | 'alcohol' | 'smoking' | 'caffeine' | 'meals';
export const LIFESTYLE: { key: LifestyleKey; label: string; options: LetterOption[] }[] = [
  {
    key: 'exercise',
    label: 'Exercise',
    options: [
      { id: 'most', label: 'Most days', letter: 'exercise most days' },
      { id: 'few', label: 'A few times a week', letter: 'exercise a few times a week' },
      { id: 'rarely', label: 'Rarely', letter: 'rarely exercise' },
      { id: 'not-now', label: 'Not at the moment', letter: "am not exercising at the moment" },
    ],
  },
  {
    key: 'alcohol',
    label: 'Alcohol',
    options: [
      { id: 'none', label: 'None', letter: "don't drink alcohol" },
      { id: 'within', label: 'Within 14 units a week', letter: 'drink within 14 units a week' },
      { id: 'more', label: 'More than 14 units a week', letter: 'drink more than 14 units a week' },
      { id: 'unsure', label: 'Not sure', letter: '' },
      { id: 'skip', label: 'Prefer not to say', letter: '' },
    ],
  },
  {
    key: 'smoking',
    label: 'Smoking or vaping',
    options: [
      { id: 'never', label: 'Never', letter: "don't smoke or vape" },
      { id: 'used-to', label: 'Used to', letter: 'used to smoke or vape' },
      { id: 'current', label: 'Currently', letter: 'smoke or vape' },
      { id: 'skip', label: 'Prefer not to say', letter: '' },
    ],
  },
  {
    key: 'caffeine',
    label: 'Caffeine',
    options: [
      { id: 'none', label: 'None', letter: "don't have caffeine" },
      { id: '1-2', label: '1–2 drinks a day', letter: 'have 1–2 caffeinated drinks a day' },
      { id: '3+', label: '3 or more a day', letter: 'have 3 or more caffeinated drinks a day' },
    ],
  },
  {
    // Meals get their own sentence, so a skipped-meals answer reads plainly.
    key: 'meals',
    label: 'Meals',
    options: [
      { id: 'regular', label: 'Regular meals', letter: 'I eat regular meals.' },
      { id: 'skip-meals', label: 'Often skip meals', letter: 'I often skip meals.' },
      { id: 'varies', label: 'It varies', letter: 'My meals vary.' },
      { id: 'skip', label: 'Prefer not to say', letter: '' },
    ],
  },
];

// Family context, stated as a fact. The app never says what it might mean.
export const MOTHER_AGE: LetterOption[] = [
  { id: 'lt40', label: 'Before 40', letter: "My mother's periods stopped before 40." },
  { id: '40-45', label: '40 to 45', letter: "My mother's periods stopped between 40 and 45." },
  { id: 'gt45', label: 'After 45', letter: "My mother's periods stopped after 45." },
  { id: 'unknown', label: "Don't know", letter: '' },
  { id: 'skip', label: 'Prefer not to say', letter: '' },
];

// Multi-select. HRT is listed after other medication on purpose: leading with it
// frames everything as menopause before the GP has considered other causes.
// "Nothing regular" and "Prefer not to say" each clear the others.
export const MEDS: Option[] = [
  { id: 'none', label: 'Nothing regular' },
  { id: 'gp', label: 'Prescribed medication (on my GP record)' },
  { id: 'private', label: 'Prescribed privately (may not be on my GP record)' },
  { id: 'hrt', label: 'HRT' },
  { id: 'skip', label: 'Prefer not to say' },
];
export const MEDS_EXCLUSIVE = ['none', 'skip'];

// Not on her GP record, so worth stating. Informational only: the app never
// comments on interactions or suitability.
export const SUPPLEMENTS: LetterOption[] = [
  { id: 'none', label: 'None', letter: '' },
  { id: 'vitd', label: 'Vitamin D', letter: 'vitamin D' },
  { id: 'iron', label: 'Iron', letter: 'iron' },
  { id: 'magnesium', label: 'Magnesium', letter: 'magnesium' },
  { id: 'vitamins', label: 'Other vitamins or minerals', letter: 'other vitamins or minerals' },
  { id: 'herbal', label: 'Herbal remedies', letter: 'herbal remedies' },
  { id: 'sleep', label: 'Sleep aids or antihistamines', letter: 'an over-the-counter sleep aid or antihistamine' },
  { id: 'painkillers', label: 'Painkillers most days', letter: 'painkillers most days' },
  { id: 'other', label: 'Other', letter: 'other things bought over the counter' },
  { id: 'skip', label: 'Prefer not to say', letter: '' },
];
export const SUPPLEMENTS_EXCLUSIVE = ['none', 'skip'];

// Combined in natural pairs so she can cover more in fewer, fuller questions.
export const QUESTIONS: Option[] = [
  // Tests half is age-neutral on purpose: NICE NG23 generally diagnoses perimenopause from symptoms
  // over 45, so "would tests help?" alone can backfire. Clinician to confirm.
  { id: 'q-cause', label: 'What do you think could be causing this, and would tests help or is it assessed from symptoms?' },
  { id: 'q-not-treat', label: "What are my options, including not treating it? If you don't think it needs treating, could you explain why?" },
  { id: 'q-if-worse', label: "If it doesn't get better, when should I come back, and what should I look out for in the meantime?" },
  { id: 'q-record', label: 'Could you note in my record what we discussed and decided, and is there anything I could read afterwards?' },
];
/** From this many picked, suggest a longer appointment. Never blocks. */
export const QUESTIONS_PLENTY = 3;

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
