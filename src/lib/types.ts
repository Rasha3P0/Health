import type { DayKey, WeekKey } from './dates';

export interface DayEntry {
  date: DayKey;
  /** Blind 1–5 readings keyed by field id. Missing = not answered (never "0"). */
  scales: Record<string, number>;
  bleeding?: string;
  /** ISO timestamp of the last edit. Shown on the sheet as evidence of when it was recorded. */
  savedAt: string;
  /** True if first recorded on a later day (she may log yesterday). */
  late?: boolean;
}

export interface WeekEntry {
  week: WeekKey;
  changes: string[];
  savedAt: string;
}

/**
 * A blind period runs from `start` to `revealOn` (inclusive). Readings inside
 * it stay hidden until `revealOn` arrives, which is usually her appointment.
 */
export interface Period {
  id: string;
  start: DayKey;
  revealOn: DayKey;
  /** Free label like "GP, Dr Shah" is deliberately not collected: taps, not prose. */
  kind: 'gp' | 'specialist' | 'nurse' | 'other' | 'review';
}

export interface Prep {
  goals: string[];
  questions: string[];
  needs: string[];
}

export interface Settings {
  enabledOptional: string[];
  onboarded: boolean;
  /** Last time she exported a backup, if ever. */
  lastBackup?: string;
}

export interface Snapshot {
  days: DayEntry[];
  weeks: WeekEntry[];
  periods: Period[];
  prep: Prep;
  settings: Settings;
}

export const EMPTY_PREP: Prep = { goals: [], questions: [], needs: [] };
export const DEFAULT_SETTINGS: Settings = { enabledOptional: [], onboarded: false };
