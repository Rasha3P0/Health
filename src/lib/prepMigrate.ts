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

const unique = (xs: string[]) => [...new Set(xs)];

export function normalizePrep(raw: unknown): Prep {
  const p = { ...EMPTY_PREP, ...(raw as Partial<Prep>) } as Prep;
  p.questions = unique(p.questions.map((q) => QUESTION_MOVED[q] ?? q));
  if (p.starQuestion) p.starQuestion = QUESTION_MOVED[p.starQuestion] ?? p.starQuestion;
  return p;
}
