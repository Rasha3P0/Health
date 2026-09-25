import { normalizePrep } from './prepMigrate';
import { DEFAULT_SETTINGS, type Snapshot } from './types';

// Backup file format. A plain JSON file she keeps (Files app, email to
// herself, anywhere). It is the only way data leaves the device, and only
// when she chooses.

export const BACKUP_FORMAT = 'womens-health-record';
export const BACKUP_VERSION = 1;

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  data: Snapshot;
}

export function toBackup(s: Snapshot, now = new Date()): BackupFile {
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now.toISOString(), data: s };
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const WEEK_RE = /^\d{4}-W\d{2}$/;

/** Parses and validates a backup. Throws a plain-English error if it isn't one. */
export function parseBackup(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("This file couldn't be read. Is it a backup from this app?");
  }
  const b = raw as Partial<BackupFile>;
  if (!b || b.format !== BACKUP_FORMAT || !b.data) throw new Error("This doesn't look like a backup from this app.");
  if (typeof b.version !== 'number' || b.version > BACKUP_VERSION) {
    throw new Error('This backup is from a newer version. Reload the app and try again.');
  }
  const d = b.data;
  const days = Array.isArray(d.days) ? d.days : [];
  const weeks = Array.isArray(d.weeks) ? d.weeks : [];
  const periods = Array.isArray(d.periods) ? d.periods : [];
  for (const day of days) {
    if (!DAY_RE.test(day?.date) || typeof day.scales !== 'object') throw new Error('This backup has a damaged day entry.');
    for (const v of Object.values(day.scales)) {
      if (!Number.isInteger(v) || (v as number) < 1 || (v as number) > 5) throw new Error('This backup has a reading out of range.');
    }
  }
  for (const w of weeks) if (!WEEK_RE.test(w?.week) || !Array.isArray(w.changes)) throw new Error('This backup has a damaged week entry.');
  for (const p of periods) if (!DAY_RE.test(p?.start) || !DAY_RE.test(p?.revealOn)) throw new Error('This backup has a damaged reveal date.');
  return {
    days,
    weeks,
    periods,
    prep: normalizePrep(d.prep),
    settings: { ...DEFAULT_SETTINGS, ...d.settings, onboarded: true },
  };
}
