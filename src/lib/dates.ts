// All dates are local calendar days as 'YYYY-MM-DD' strings. We never store
// times for readings: a reading belongs to a day, not a moment.

export type DayKey = string; // 'YYYY-MM-DD'
export type WeekKey = string; // 'YYYY-Www' (ISO 8601 week)

const pad = (n: number) => String(n).padStart(2, '0');

export function toDayKey(d: Date): DayKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDayKey(k: DayKey): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today(now: Date = new Date()): DayKey {
  return toDayKey(now);
}

export function addDays(k: DayKey, n: number): DayKey {
  const d = fromDayKey(k);
  d.setDate(d.getDate() + n);
  return toDayKey(d);
}

/** Whole days from a to b (b - a). Safe across DST changes. */
export function daysBetween(a: DayKey, b: DayKey): number {
  const ua = Date.UTC(...ymd(a));
  const ub = Date.UTC(...ymd(b));
  return Math.round((ub - ua) / 86_400_000);
}

function ymd(k: DayKey): [number, number, number] {
  const [y, m, d] = k.split('-').map(Number);
  return [y, m - 1, d];
}

/** Every day from start to end inclusive. */
export function dayRange(start: DayKey, end: DayKey): DayKey[] {
  const out: DayKey[] = [];
  for (let k = start; k <= end; k = addDays(k, 1)) out.push(k);
  return out;
}

export function isoWeek(k: DayKey): WeekKey {
  const [y, m, d] = ymd(k);
  const date = new Date(Date.UTC(y, m, d));
  const dow = date.getUTCDay() || 7; // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - dow); // Thursday decides the year
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((date.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${pad(week)}`;
}

/** Monday of the ISO week containing k. */
export function weekStart(k: DayKey): DayKey {
  const dow = fromDayKey(k).getDay() || 7;
  return addDays(k, 1 - dow);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** '3 Oct 2026' — UK order, unambiguous in print. */
export function formatDay(k: DayKey, withYear = true): string {
  const d = fromDayKey(k);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? ` ${d.getFullYear()}` : ''}`;
}

/** 'Sat 3 Oct' */
export function formatDayShort(k: DayKey): string {
  const d = fromDayKey(k);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
