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
  /** Asked in the check-in, one at a time. Answered "Not at all" … "Very much". */
  question: string;
  /** Short plain-language prompt shown under the label. */
  hint: string;
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
// 1 = not at all, 5 = very much. A reading, not a judgement.
export const SCALE_ANCHORS = { low: 'Not at all', high: 'Very much' } as const;
/** A word for every step, so she never has to decode what "3" means. */
export const SCALE_LABELS: Record<number, string> = { 1: 'Not at all', 2: 'A little', 3: 'Somewhat', 4: 'A lot', 5: 'Very much' };
export const SCALE_VALUES = [1, 2, 3, 4, 5] as const;
/** Readings at or above this count as a "hard day" for that field in the summary. */
export const HARD_DAY_THRESHOLD = 4;

export const SCALE_FIELDS: ScaleField[] = [
  { id: 'sleep', kind: 'scale', contract: 'blind', question: 'Did you sleep badly?', label: 'Poor sleep', hint: 'Last night' },
  { id: 'energy', kind: 'scale', contract: 'blind', question: 'Low on energy?', label: 'Low energy', hint: 'Today, overall' },
  { id: 'mood', kind: 'scale', contract: 'blind', question: 'Low in mood?', label: 'Low mood', hint: 'Today, overall' },
  { id: 'fog', kind: 'scale', contract: 'blind', question: 'Brain fog?', label: 'Brain fog', hint: 'Losing words, focus or thread' },
  { id: 'aches', kind: 'scale', contract: 'blind', question: 'Joint or muscle aches?', label: 'Joint or muscle aches', hint: 'Today, overall' },
  { id: 'overload', kind: 'scale', contract: 'blind', question: 'Sensory or social overload?', label: 'Sensory or social overload', hint: 'Noise, light, people, demands' },
  { id: 'flushes', kind: 'scale', contract: 'blind', question: 'Hot flushes or night sweats?', label: 'Hot flushes or night sweats', hint: 'Last 24 hours' },
  { id: 'anxiety', kind: 'scale', contract: 'blind', question: 'Feeling anxious?', label: 'Anxiety', hint: 'Today, overall', optional: true },
  { id: 'headache', kind: 'scale', contract: 'blind', question: 'Headaches?', label: 'Headaches', hint: 'Today, overall', optional: true },
  { id: 'libido', kind: 'scale', contract: 'blind', question: 'Low sex drive?', label: 'Low sex drive', hint: 'Lately', optional: true },
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
  { id: 'meds', label: 'Medication or HRT change' },
  { id: 'supplement', label: 'New or stopped supplement' },
  { id: 'ill', label: 'Ill or injured' },
  { id: 'travel', label: 'Travel or holiday' },
  { id: 'stress', label: 'Big stress or life event' },
  { id: 'exercise', label: 'Change in exercise' },
  { id: 'alcohol', label: 'Change in alcohol or caffeine' },
  { id: 'sleep-other', label: 'Sleep disturbed by something else' },
  { id: 'routine', label: 'Routine disrupted' },
];
export const WEEKLY_NOTHING = { id: 'nothing', label: 'Nothing notable' };
