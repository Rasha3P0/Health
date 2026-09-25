import { CONTRACEPTION, DURATION, GET_BACK, GOALS, IMPACT, LAST_PERIOD, MEDICATION, NEEDS, QUESTIONS, type LetterOption } from '../content/prep';
import { formatDay, type DayKey } from './dates';
import type { Summary } from './summary';
import type { Period, Prep } from './types';

// Builds a short letter from her own choices. It is a template, not AI: every
// sentence comes from fixed wording here, so nothing can be invented and
// nothing leaves the phone unless she copies, shares or prints it.
//
// It respects the blind: before the reveal date it says a record exists and
// is sealed, and never quotes what's in it.
//
// ⚠ Draft wording, listed in docs/CONTENT_REVIEW.md.

export interface LetterSection {
  heading?: string;
  text?: string;
  bullets?: string[];
}

export interface Letter {
  greeting: string;
  sections: LetterSection[];
  closing: string;
}

const pick = (opts: { id: string; label: string }[], ids: string[]) =>
  opts.filter((o) => ids.includes(o.id)).map((o) => o.label);

function list(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function hasLetterContent(prep: Prep): boolean {
  return prep.goals.length + prep.questions.length + prep.needs.length + prep.impact.length > 0 || !!prep.getBackTo;
}

/** The letter line for a single-pick answer, or nothing if skipped or "prefer not to say". */
const line = (opts: LetterOption[], id: string | undefined) => (id && opts.find((o) => o.id === id)?.letter) || '';

export function buildLetter(args: {
  prep: Prep;
  today: DayKey;
  /** The current or most recent blind period, if any. */
  period?: Period;
  /** Only passed when that period has been revealed. */
  summary?: Summary;
}): Letter {
  const { prep, today, period, summary } = args;
  const sections: LetterSection[] = [];

  // Opening: led by what she wants back, if she picked it.
  const back = line(GET_BACK, prep.getBackTo);
  const opener = back
    ? `I'd like to get back to ${back}. I've booked this appointment because my symptoms are getting in the way of that, and I've written this down so we can make the most of the time.`
    : "I've booked this appointment to talk about how I've been feeling. I've written this down so we can make the most of the time and so I don't forget anything important.";
  sections.push({ text: [opener, line(DURATION, prep.duration)].filter(Boolean).join(' ') });

  // What it's costing her comes before any symptom numbers.
  const impact = IMPACT.filter((o) => prep.impact.includes(o.id)).map((o) => o.letter);
  if (impact.length) {
    const stopped = impact.find((t) => t.startsWith("I've stopped"));
    const areas = impact.filter((t) => t !== stopped);
    const parts: string[] = [];
    if (areas.length) parts.push(`It's affecting ${list(areas)}.`);
    if (stopped) parts.push(`${stopped}.`);
    sections.push({ heading: 'How this is affecting my life', text: parts.join(' ') });
  }

  if (period && summary && summary.daysLogged > 0) {
    const most = summary.mostAffected.map((f) => f.label.toLowerCase());
    let text = `I kept a daily record from ${formatDay(summary.start, false)} to ${formatDay(summary.end)}, filled in on ${summary.daysLogged} of ${summary.totalDays} days.`;
    if (most.length) text += ` The things that affected me most were ${list(most)}.`;
    for (const b of summary.behind) {
      const top = b.reasons.find((r) => r.id !== 'unknown');
      if (top) text += ` ${b.lead}, the reason I noted most often was ${top.label.toLowerCase()} (${top.days} of ${b.problemDays} days).`;
    }
    text += " I've brought the full summary with me.";
    sections.push({ text });
  } else if (period && period.revealOn > today) {
    sections.push({
      text: `I've been keeping a daily symptom record since ${formatDay(period.start)}. It stays sealed until ${formatDay(period.revealOn)} so that I can't steer it, and I'll bring the summary with me.`,
    });
  }

  const background = [line(LAST_PERIOD, prep.lastPeriod), line(CONTRACEPTION, prep.contraception), line(MEDICATION, prep.medication)].filter(Boolean);
  if (background.length) sections.push({ heading: 'Background', bullets: background });

  const goals = pick(GOALS, prep.goals);
  if (goals.length) sections.push({ heading: "What I'd like from this appointment", bullets: goals });

  const questions = pick(QUESTIONS, prep.questions);
  if (questions.length) sections.push({ heading: "Questions I'd like to ask", bullets: questions });

  const needs = pick(NEEDS, prep.needs);
  if (needs.length) sections.push({ heading: 'Things that help me in appointments', bullets: needs });

  sections.push({ text: 'Thank you for your time.' });

  return {
    greeting: period?.kind === 'nurse' ? 'Dear Nurse,' : 'Dear Doctor,',
    sections,
    closing: 'Yours sincerely,',
  };
}

/** Plain text for copying into an online consultation form, email or the NHS App. */
export function letterToText(l: Letter): string {
  const parts = [l.greeting];
  for (const s of l.sections) {
    const block: string[] = [];
    if (s.heading) block.push(`${s.heading}:`);
    if (s.text) block.push(s.text);
    if (s.bullets) block.push(...s.bullets.map((b) => `- ${b}`));
    parts.push(block.join('\n'));
  }
  parts.push(`${l.closing}\n[Your name]`);
  return parts.join('\n\n');
}
