import { addDays, type DayKey } from './dates';
import type { Period } from './types';

// The blind. A blind reading for a given day is visible only if that day falls
// inside a period whose reveal date has arrived. Everything else stays hidden,
// including readings logged before any period was set.
//
// Visible-contract fields (bleeding) never pass through here.

export function currentPeriod(periods: Period[], today: DayKey): Period | undefined {
  return periods
    .filter((p) => p.revealOn > today)
    .sort((a, b) => a.revealOn.localeCompare(b.revealOn))[0];
}

export function revealedPeriods(periods: Period[], today: DayKey): Period[] {
  return periods
    .filter((p) => p.revealOn <= today)
    .sort((a, b) => b.revealOn.localeCompare(a.revealOn));
}

export function isRevealed(day: DayKey, periods: Period[], today: DayKey): boolean {
  return periods.some((p) => p.revealOn <= today && p.start <= day && day <= p.revealOn);
}

/**
 * Where a new blind period should start: the day after the last reveal, so no
 * logged day is ever left outside a period; otherwise her first logged day.
 */
export function nextPeriodStart(periods: Period[], firstLogged: DayKey | undefined, today: DayKey): DayKey {
  const last = [...periods].sort((a, b) => b.revealOn.localeCompare(a.revealOn))[0];
  if (last) return addDays(last.revealOn, 1);
  return firstLogged && firstLogged < today ? firstLogged : today;
}

/**
 * She can edit today and yesterday only. Seeing a reading while you enter it is
 * fine; browsing back through old ones is what the blind prevents.
 */
export function isEditable(day: DayKey, today: DayKey, yesterday: DayKey): boolean {
  return day === today || day === yesterday;
}
