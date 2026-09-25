import { EMPTY_PREP, type Prep } from './types';

// Appointment answers saved by an earlier version, brought up to date on load
// and on restore. Nothing she picked is dropped: each old option maps to the
// new one that now contains it.

/** Questions were combined in pairs (8 → 4). */
const QUESTION_MOVED: Record<string, string> = {
  'q-tests': 'q-cause',
  'q-options': 'q-not-treat',
  'q-watch': 'q-if-worse',
  'q-read': 'q-record',
};

/** The old single medication answer, as the new multi-select. */
const MEDICATION_TO_MEDS: Record<string, string[]> = {
  none: ['none'],
  hrt: ['hrt'],
  other: ['gp'],
  both: ['gp', 'hrt'],
  skip: ['skip'],
};

const unique = (xs: string[]) => [...new Set(xs)];

export function normalizePrep(raw: unknown): Prep {
  const { medication, ...rest } = (raw ?? {}) as Partial<Prep> & { medication?: string };
  const p = { ...EMPTY_PREP, ...rest } as Prep;
  if (medication && !p.meds.length) p.meds = MEDICATION_TO_MEDS[medication] ?? [];
  p.questions = unique(p.questions.map((q) => QUESTION_MOVED[q] ?? q));
  if (p.starQuestion) p.starQuestion = QUESTION_MOVED[p.starQuestion] ?? p.starQuestion;
  return p;
}
