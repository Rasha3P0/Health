// Every field declares which contract it lives under. This is the single most
// important safety decision in the app, so it is explicit per field and
// covered by tests (tests/fields.test.ts):
//
//   'blind'   Slow-moving quality-of-life readings. Hidden until the reveal
//             date, because a daily reading is mostly noise and seeing your
//             own trend makes you log towards it.
//
//   'visible' Anything that could need acting on. Never hidden, always shown
//             with a signpost. Bleeding is here. Anything with a threshold
//             (blood pressure, medication doses, etc.) must go here too.
//
// ⚠ Wording is draft. See docs/CONTENT_REVIEW.md before going public.

export type Contract = 'blind' | 'visible';

export interface ScaleField {
  id: string;
  kind: 'scale';
  contract: 'blind';
  label: string;
  /** Asked in the check-in, one at a time, in plain words. */
  question: string;
  /** Short plain-language prompt shown under the question. */
  hint: string;
  /**
   * Answer words for 1–5, written for this question. Always the same
   * direction: 1 = no problem, 5 = the worst. Stored as the number.
   */
  answers: [string, string, string, string, string];
  /** Optional follow-up tick boxes (what was behind it, or where). Asked from `from` (default REASONS_FROM) upwards. */
  reasons?: {
    question: string;
    /** Opens the letter sentence, e.g. "When I slept badly". */
    lead: string;
    /** 'cause' = "the reason I noted most often was …"; 'place' = "it was most often in …". */
    kind?: 'cause' | 'place';
    from?: number;
    options: { id: string; label: string; /** Letter wording, for 'place' ("in my back"). */ letter?: string }[];
  };
  /** Off by default; she can switch it on in Settings. */
  optional?: boolean;
}

export interface ChoiceField {
  id: string;
  kind: 'choice';
  contract: Contract;
  label: string;
  hint: string;
  options: { value: string; label: string }[];
}

export type Field = ScaleField | ChoiceField;

// One direction for every scale, so there is nothing to decode on a foggy day:
// 1 = no problem, 5 = the worst. Each question words its own answers.
export const SCALE_VALUES = [1, 2, 3, 4, 5] as const;
/** Readings at or above this count as a "hard day" for that field in the summary. */
export const HARD_DAY_THRESHOLD = 4;

/** Answer at or above this and the "what was behind it?" follow-up is asked. */
export const REASONS_FROM = 3;

/** The answer at which this field's follow-up is asked. */
export const reasonsFrom = (f: ScaleField) => f.reasons?.from ?? REASONS_FROM;

const DONT_KNOW = { id: 'unknown', label: "Not sure" };

export const SCALE_FIELDS: ScaleField[] = [
  {
    id: 'sleep', kind: 'scale', contract: 'blind', label: 'Poor sleep',
    question: 'How did you sleep?', hint: 'Last night',
    answers: ['Well', 'OK', 'Not great', 'Badly', 'Barely at all'],
    reasons: {
      question: 'What kept you awake?',
      lead: 'When I slept badly',
      options: [
        { id: 'sweats', label: 'Hot flushes or night sweats' },
        { id: 'loo', label: 'Needed the loo' },
        { id: 'racing', label: 'Racing mind or worry' },
        { id: 'pain', label: 'Pain or aches' },
        { id: 'cant-drop', label: "Couldn't get to sleep" },
        { id: 'early', label: 'Woke too early' },
        { id: 'restless', label: 'Restless legs or body' },
        { id: 'others', label: 'Noise, partner, kids or pets' },
        DONT_KNOW,
      ],
    },
  },
  {
    id: 'energy', kind: 'scale', contract: 'blind', label: 'Low energy',
    question: "How's your energy?", hint: 'Today, overall',
    answers: ['Good', 'Fine', 'A bit low', 'Low', 'Running on empty'],
  },
  {
    id: 'mood', kind: 'scale', contract: 'blind', label: 'Low mood',
    question: "How's your mood?", hint: 'Today, overall',
    answers: ['Good', 'OK', 'A bit low', 'Low', 'Very low'],
    reasons: {
      question: 'Anything behind it?',
      lead: 'When my mood was low',
      options: [
        { id: 'tired', label: 'Tired or slept badly' },
        { id: 'pain', label: 'Pain or feeling unwell' },
        { id: 'overwhelm', label: 'Overwhelmed or overloaded' },
        { id: 'work', label: 'Work' },
        { id: 'home', label: 'Home, family or relationships' },
        { id: 'alone', label: 'Lonely or cut off' },
        { id: 'irritable', label: 'Bursts of anger' },
        { id: 'anxious', label: 'Anxious or on edge' },
        { id: 'no-reason', label: 'Nothing obvious: it just came' },
        DONT_KNOW,
      ],
    },
  },
  {
    id: 'fog', kind: 'scale', contract: 'blind', label: 'Brain fog',
    question: 'How clear is your thinking?', hint: 'Finding words, focus, keeping your thread',
    answers: ['Clear', 'Mostly clear', 'A bit foggy', 'Foggy', 'Very foggy'],
  },
  {
    // Was "Joint or muscle aches". Id kept, so earlier readings carry over as pain readings.
    id: 'aches', kind: 'scale', contract: 'blind', label: 'Pain',
    question: 'Any pain?', hint: 'Anywhere, today',
    answers: ['None', 'Mild', 'Noticeable', 'Bad', 'Severe'],
    reasons: {
      question: 'Where is it?',
      lead: 'When I had pain',
      kind: 'place',
      // Where matters even when it's mild.
      from: 2,
      // Chest is deliberately absent: chest pain can need urgent action, so it would need a
      // visible safety signpost (like bleeding) and clinician-reviewed wording first.
      options: [
        { id: 'head', label: 'Head', letter: 'in my head' },
        { id: 'neck', label: 'Neck or shoulders', letter: 'in my neck or shoulders' },
        { id: 'back', label: 'Back', letter: 'in my back' },
        { id: 'joints', label: 'Joints', letter: 'in my joints' },
        { id: 'muscles', label: 'Muscles', letter: 'in my muscles' },
        { id: 'hands', label: 'Hands or wrists', letter: 'in my hands or wrists' },
        { id: 'legs', label: 'Legs or feet', letter: 'in my legs or feet' },
        { id: 'jaw', label: 'Jaw or face', letter: 'in my jaw or face' },
        { id: 'tummy', label: 'Tummy', letter: 'in my tummy' },
        { id: 'all-over', label: 'All over', letter: 'all over' },
        { id: 'breasts', label: 'Breasts', letter: 'in my breasts' },
        { id: 'pelvis', label: 'Pelvis or period-type pain', letter: 'in my pelvis' },
        { id: 'elsewhere', label: 'Somewhere else', letter: 'somewhere else' },
      ],
    },
  },
  {
    id: 'overload', kind: 'scale', contract: 'blind', label: 'Sensory or social overload',
    question: 'How overloaded do you feel?', hint: 'Noise, light, people, demands',
    answers: ['Not at all', 'A little', 'Somewhat', 'A lot', 'Overwhelmed'],
  },
  {
    id: 'flushes', kind: 'scale', contract: 'blind', label: 'Hot flushes or night sweats',
    question: 'Any hot flushes or night sweats?', hint: 'Last 24 hours',
    answers: ['None', 'One or two', 'A few', 'Lots', 'Almost constant'],
  },
  {
    id: 'anxiety', kind: 'scale', contract: 'blind', label: 'Anxiety', optional: true,
    question: 'How anxious do you feel?', hint: 'Today, overall',
    answers: ['Not at all', 'A little', 'Somewhat', 'Very', 'Extremely'],
  },
  {
    id: 'headache', kind: 'scale', contract: 'blind', label: 'Headaches', optional: true,
    question: 'Any headaches?', hint: 'Today, overall',
    answers: ['None', 'Mild', 'Noticeable', 'Bad', 'Severe'],
  },
  {
    id: 'libido', kind: 'scale', contract: 'blind', label: 'Low sex drive', optional: true,
    question: "How's your sex drive?", hint: 'Lately, compared with what is normal for you',
    answers: ['Normal for me', 'Slightly low', 'Low', 'Very low', 'Gone'],
  },
];

export const BLEEDING_FIELD: ChoiceField = {
  id: 'bleeding',
  kind: 'choice',
  contract: 'visible',
  label: 'Bleeding',
  hint: 'Today',
  options: [
    { value: 'none', label: 'None' },
    { value: 'spotting', label: 'Spotting' },
    { value: 'light', label: 'Light' },
    { value: 'heavy', label: 'Heavy' },
    { value: 'very-heavy', label: 'Very heavy' },
  ],
};

/** Choices that make the bleeding signpost more prominent. It is always shown. */
export const BLEEDING_EMPHASISE = new Set(['heavy', 'very-heavy']);

export const ALL_FIELDS: Field[] = [...SCALE_FIELDS, BLEEDING_FIELD];

export function activeScaleFields(enabledOptional: string[]): ScaleField[] {
  return SCALE_FIELDS.filter((f) => !f.optional || enabledOptional.includes(f.id));
}

// Weekly "what else changed" card. Taps only, captured before the reveal so it
// can't be written to explain a result she has already seen.
export const WEEKLY_CHANGES: { id: string; label: string }[] = [
  // Self first; medication (including HRT) last, so nothing frames the week around it.
  { id: 'ill', label: 'Ill or injured' },
  { id: 'stress', label: 'Big stress or life event' },
  { id: 'sleep-other', label: 'Sleep disturbed by something else' },
  { id: 'routine', label: 'Routine disrupted' },
  { id: 'exercise', label: 'Change in exercise' },
  { id: 'alcohol', label: 'Change in alcohol or caffeine' },
  { id: 'travel', label: 'Travel or holiday' },
  { id: 'supplement', label: 'New or stopped supplement' },
  { id: 'meds', label: 'Medication change (including HRT)' },
];
export const WEEKLY_NOTHING = { id: 'nothing', label: 'Nothing notable' };
