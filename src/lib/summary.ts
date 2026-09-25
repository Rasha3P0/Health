import { HARD_DAY_THRESHOLD, REASONS_FROM, type ScaleField } from '../content/fields';
import { addDays, dayRange, isoWeek, type DayKey, type WeekKey } from './dates';
import type { DayEntry, Period, WeekEntry } from './types';

// Builds the appointment sheet. Strictly descriptive: counts and averages of
// what she recorded. It never interprets, diagnoses or suggests a cause.

export interface FieldStat {
  id: string;
  label: string;
  readings: number;
  average: number | null;
  hardDays: number;
}

export interface WeekRow {
  week: WeekKey;
  start: DayKey;
  end: DayKey;
  daysInRange: number;
  daysLogged: number;
  fields: Record<string, { average: number | null; hardDays: number; readings: number }>;
  /** null = the weekly card wasn't answered that week (which is fine). */
  changes: string[] | null;
}

export interface Summary {
  start: DayKey;
  end: DayKey;
  totalDays: number;
  daysLogged: number;
  lateDays: number;
  fields: FieldStat[];
  weeks: WeekRow[];
  /** Highest-average fields, only among those with enough readings to mean anything. */
  mostAffected: FieldStat[];
  bleeding: { date: DayKey; value: string }[];
  bleedingNoneDays: number;
  /** For fields with a "what was behind it?" follow-up: how often she ticked each reason. */
  behind: {
    id: string;
    label: string;
    lead: string;
    /** Days the answer was at or above REASONS_FROM. */
    problemDays: number;
    reasons: { id: string; label: string; days: number }[];
  }[];
}

/** Fewer readings than this and a field is left out of "most affected". */
export const MIN_READINGS_FOR_RANKING = 7;

const round1 = (n: number) => Math.round(n * 10) / 10;

function stat(values: number[]) {
  if (values.length === 0) return { average: null, hardDays: 0, readings: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    average: round1(sum / values.length),
    hardDays: values.filter((v) => v >= HARD_DAY_THRESHOLD).length,
    readings: values.length,
  };
}

export function buildSummary(
  period: Pick<Period, 'start' | 'revealOn'>,
  days: DayEntry[],
  weeks: WeekEntry[],
  fields: ScaleField[],
): Summary {
  const start = period.start;
  const end = period.revealOn;
  const inRange = days
    .filter((d) => d.date >= start && d.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date));
  const byDate = new Map(inRange.map((d) => [d.date, d]));
  const logged = inRange.filter((d) => Object.keys(d.scales).length > 0 || d.bleeding);

  const fieldStats: FieldStat[] = fields.map((f) => {
    const values = inRange.map((d) => d.scales[f.id]).filter((v): v is number => typeof v === 'number');
    const s = stat(values);
    return { id: f.id, label: f.label, readings: s.readings, average: s.average, hardDays: s.hardDays };
  });

  const weekMap = new Map(weeks.map((w) => [w.week, w]));
  const allDays = dayRange(start, end);
  const weekRows: WeekRow[] = [];
  for (const day of allDays) {
    const wk = isoWeek(day);
    let row = weekRows[weekRows.length - 1];
    if (!row || row.week !== wk) {
      row = { week: wk, start: day, end: day, daysInRange: 0, daysLogged: 0, fields: {}, changes: weekMap.get(wk)?.changes.length ? weekMap.get(wk)!.changes : null };
      weekRows.push(row);
    }
    row.end = day;
    row.daysInRange++;
    const entry = byDate.get(day);
    if (entry && (Object.keys(entry.scales).length > 0 || entry.bleeding)) row.daysLogged++;
  }
  for (const row of weekRows) {
    for (const f of fields) {
      const values = dayRange(row.start, row.end)
        .map((d) => byDate.get(d)?.scales[f.id])
        .filter((v): v is number => typeof v === 'number');
      row.fields[f.id] = stat(values);
    }
  }

  const mostAffected = fieldStats
    .filter((f) => f.readings >= MIN_READINGS_FOR_RANKING && f.average !== null && f.average >= 2)
    .sort((a, b) => (b.average! - a.average!) || (b.hardDays - a.hardDays))
    .slice(0, 3);

  const bleeding = inRange
    .filter((d) => d.bleeding && d.bleeding !== 'none')
    .map((d) => ({ date: d.date, value: d.bleeding! }));

  const behind = fields
    .filter((f) => f.reasons)
    .map((f) => {
      const problem = inRange.filter((d) => (d.scales[f.id] ?? 0) >= REASONS_FROM);
      const reasons = f.reasons!.options
        .map((o) => ({ id: o.id, label: o.label, days: problem.filter((d) => d.reasons?.[f.id]?.includes(o.id)).length }))
        .filter((r) => r.days > 0)
        .sort((a, b) => b.days - a.days);
      return { id: f.id, label: f.label, lead: f.reasons!.lead, problemDays: problem.length, reasons };
    })
    .filter((b) => b.reasons.length > 0);

  return {
    behind,
    start,
    end,
    totalDays: allDays.length,
    daysLogged: logged.length,
    lateDays: logged.filter((d) => d.late).length,
    fields: fieldStats,
    weeks: weekRows,
    mostAffected,
    bleeding,
    bleedingNoneDays: inRange.filter((d) => d.bleeding === 'none').length,
  };
}

/** Default blind period: starts today, reveals in six weeks. */
export function defaultRevealDate(today: DayKey): DayKey {
  return addDays(today, 42);
}
