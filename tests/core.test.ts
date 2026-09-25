import { describe, expect, it } from 'vitest';
import { ALL_FIELDS, BLEEDING_FIELD, SCALE_FIELDS } from '../src/content/fields';
import { currentPeriod, isRevealed, nextPeriodStart } from '../src/lib/blind';
import { addDays, dayRange, daysBetween, isoWeek, weekStart } from '../src/lib/dates';
import { buildSummary, MIN_READINGS_FOR_RANKING } from '../src/lib/summary';
import { parseBackup, toBackup } from '../src/lib/backup';
import { DEFAULT_SETTINGS, EMPTY_PREP, type DayEntry, type Period } from '../src/lib/types';

describe('dates', () => {
  it('handles ISO weeks at year boundaries', () => {
    expect(isoWeek('2026-01-01')).toBe('2026-W01');
    expect(isoWeek('2027-01-01')).toBe('2026-W53');
    expect(isoWeek('2024-12-30')).toBe('2025-W01');
  });
  it('adds days across month ends and BST changes', () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(dayRange('2026-02-27', '2026-03-02')).toEqual(['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02']);
  });
  it('finds the Monday of a week', () => {
    expect(weekStart('2026-09-27')).toBe('2026-09-21'); // Sunday
    expect(weekStart('2026-09-21')).toBe('2026-09-21');
  });
});

describe('field contracts (safety)', () => {
  it('never blinds bleeding', () => {
    expect(BLEEDING_FIELD.contract).toBe('visible');
  });
  it('only blinds 1–5 quality-of-life scales', () => {
    for (const f of ALL_FIELDS) {
      if (f.contract === 'blind') expect(f.kind).toBe('scale');
    }
  });
  it('has unique field ids', () => {
    const ids = ALL_FIELDS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('the blind', () => {
  const p: Period = { id: 'a', start: '2026-09-01', revealOn: '2026-10-13', kind: 'gp' };

  it('hides readings before the reveal date', () => {
    expect(isRevealed('2026-09-05', [p], '2026-10-12')).toBe(false);
  });
  it('reveals the whole period on the reveal date', () => {
    expect(isRevealed('2026-09-01', [p], '2026-10-13')).toBe(true);
    expect(isRevealed('2026-10-13', [p], '2026-10-13')).toBe(true);
  });
  it('keeps days outside any revealed period hidden', () => {
    expect(isRevealed('2026-08-31', [p], '2026-12-01')).toBe(false);
    expect(isRevealed('2026-10-14', [p], '2026-12-01')).toBe(false);
  });
  it('treats a period as current until its reveal date', () => {
    expect(currentPeriod([p], '2026-10-12')?.id).toBe('a');
    expect(currentPeriod([p], '2026-10-13')).toBeUndefined();
  });
  it('starts the next period the day after the last reveal, so no day is orphaned', () => {
    expect(nextPeriodStart([p], '2026-08-01', '2026-11-01')).toBe('2026-10-14');
    expect(nextPeriodStart([], '2026-08-01', '2026-11-01')).toBe('2026-08-01');
    expect(nextPeriodStart([], undefined, '2026-11-01')).toBe('2026-11-01');
  });
});

describe('summary', () => {
  const fields = SCALE_FIELDS.filter((f) => ['sleep', 'fog'].includes(f.id));
  const day = (date: string, scales: Record<string, number>, extra: Partial<DayEntry> = {}): DayEntry => ({
    date,
    scales,
    savedAt: `${date}T20:00:00Z`,
    ...extra,
  });

  it('describes only what was recorded, week by week', () => {
    // Mon 7 Sep – Sun 20 Sep 2026: two full ISO weeks.
    const days = [
      ...dayRange('2026-09-07', '2026-09-13').map((d) => day(d, { sleep: 4, fog: 2 })),
      day('2026-09-14', { sleep: 2 }),
      day('2026-09-15', { sleep: 3 }, { late: true, bleeding: 'light' }),
      day('2026-09-16', {}, { bleeding: 'none' }),
      day('2026-10-01', { sleep: 5 }), // outside the period
    ];
    const s = buildSummary({ start: '2026-09-07', revealOn: '2026-09-20' }, days, [
      { week: '2026-W37', changes: ['ill'], savedAt: '' },
      { week: '2026-W38', changes: [], savedAt: '' }, // ticked then unticked
    ], fields);

    expect(s.totalDays).toBe(14);
    expect(s.daysLogged).toBe(10);
    expect(s.lateDays).toBe(1);
    expect(s.weeks.map((w) => w.week)).toEqual(['2026-W37', '2026-W38']);
    expect(s.weeks[0].fields.sleep).toEqual({ average: 4, hardDays: 7, readings: 7 });
    expect(s.weeks[1].fields.sleep).toEqual({ average: 2.5, hardDays: 0, readings: 2 });
    expect(s.weeks[1].fields.fog.average).toBeNull(); // not recorded ≠ zero
    expect(s.weeks[0].changes).toEqual(['ill']);
    expect(s.weeks[1].changes).toBeNull();
    expect(s.bleeding).toEqual([{ date: '2026-09-15', value: 'light' }]);
    expect(s.bleedingNoneDays).toBe(1);
  });

  it('only ranks fields with enough readings', () => {
    const days = dayRange('2026-09-07', '2026-09-20').map((d, i) =>
      day(d, i < MIN_READINGS_FOR_RANKING - 1 ? { sleep: 5, fog: 3 } : { fog: 3 }),
    );
    const s = buildSummary({ start: '2026-09-07', revealOn: '2026-09-20' }, days, [], fields);
    expect(s.mostAffected.map((f) => f.id)).toEqual(['fog']);
  });

  it('clips partial weeks to the period', () => {
    const s = buildSummary({ start: '2026-09-10', revealOn: '2026-09-15' }, [], [], fields);
    expect(s.weeks.map((w) => [w.start, w.end, w.daysInRange])).toEqual([
      ['2026-09-10', '2026-09-13', 4],
      ['2026-09-14', '2026-09-15', 2],
    ]);
  });
});

describe('backup', () => {
  const snap = {
    days: [{ date: '2026-09-01', scales: { sleep: 3 }, savedAt: 'x' }],
    weeks: [{ week: '2026-W36', changes: ['ill'], savedAt: 'x' }],
    periods: [{ id: 'a', start: '2026-09-01', revealOn: '2026-10-01', kind: 'gp' as const }],
    prep: EMPTY_PREP,
    settings: DEFAULT_SETTINGS,
  };
  it('round-trips', () => {
    const back = parseBackup(JSON.stringify(toBackup(snap)));
    expect(back.days).toEqual(snap.days);
    expect(back.settings.onboarded).toBe(true);
  });
  it('rejects other files and bad readings in plain English', () => {
    expect(() => parseBackup('not json')).toThrow(/couldn't be read/);
    expect(() => parseBackup('{"a":1}')).toThrow(/doesn't look like/);
    const bad = toBackup({ ...snap, days: [{ date: '2026-09-01', scales: { sleep: 9 }, savedAt: 'x' }] });
    expect(() => parseBackup(JSON.stringify(bad))).toThrow(/out of range/);
  });
});
