import { describe, expect, it } from 'vitest';
import { ALL_FIELDS, BLEEDING_FIELD, SCALE_FIELDS } from '../src/content/fields';
import { currentPeriod, isRevealed, nextPeriodStart } from '../src/lib/blind';
import { addDays, dayRange, daysBetween, isoWeek, weekStart } from '../src/lib/dates';
import { buildSummary, MIN_READINGS_FOR_RANKING } from '../src/lib/summary';
import { parseBackup, toBackup } from '../src/lib/backup';
import { buildLetter, hasLetterContent, letterToText } from '../src/lib/letter';
import { normalizePrep } from '../src/lib/prepMigrate';
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

describe('scale wording', () => {
  it('gives every scale five answer words and a question', () => {
    for (const f of SCALE_FIELDS) {
      expect(f.answers).toHaveLength(5);
      expect(f.question.length).toBeGreaterThan(3);
    }
  });
  it('asks what was behind poor sleep and low mood', () => {
    expect(SCALE_FIELDS.find((f) => f.id === 'sleep')?.reasons?.options.length).toBeGreaterThan(3);
    expect(SCALE_FIELDS.find((f) => f.id === 'mood')?.reasons?.options.length).toBeGreaterThan(3);
  });
});

describe('reasons in the summary', () => {
  const sleep = SCALE_FIELDS.filter((f) => f.id === 'sleep');
  it('counts reasons only on problem days, most common first', () => {
    const days: DayEntry[] = [
      { date: '2026-09-07', scales: { sleep: 4 }, reasons: { sleep: ['sweats', 'loo'] }, savedAt: '' },
      { date: '2026-09-08', scales: { sleep: 3 }, reasons: { sleep: ['sweats'] }, savedAt: '' },
      { date: '2026-09-09', scales: { sleep: 1 }, reasons: { sleep: ['racing'] }, savedAt: '' }, // not a problem day
    ];
    const s = buildSummary({ start: '2026-09-07', revealOn: '2026-09-13' }, days, [], sleep);
    expect(s.behind).toEqual([
      { id: 'sleep', label: 'Poor sleep', lead: 'When I slept badly', kind: 'cause', problemDays: 2, reasons: [
        { id: 'sweats', label: 'Hot flushes or night sweats', letter: undefined, days: 2 },
        { id: 'loo', label: 'Needed the loo', letter: undefined, days: 1 },
      ] },
    ]);
  });
});

describe('letter', () => {
  const prep = { ...EMPTY_PREP, goals: ['talk'], questions: ['q-cause'], needs: ['n-written'] };
  const sealed: Period = { id: 'p', start: '2026-09-01', revealOn: '2026-10-01', kind: 'gp' };

  it('is built only from her choices', () => {
    const text = letterToText(buildLetter({ prep, today: '2026-09-10' }));
    expect(text).toContain('Dear Doctor,');
    expect(text).toContain('- Talk through these symptoms together');
    expect(text).toContain('- What do you think could be causing this, and would tests help or is it assessed from symptoms?');
    expect(text).toContain('- I take things in better in writing.');
    expect(hasLetterContent(EMPTY_PREP)).toBe(false);
  });

  it('never quotes a sealed record', () => {
    const l = buildLetter({ prep, today: '2026-09-10', period: sealed });
    const text = letterToText(l);
    expect(text).toContain('stays sealed until 1 Oct 2026');
    expect(text).not.toMatch(/affected me most/);
  });

  it('summarises an opened record', () => {
    const days = dayRange('2026-09-01', '2026-09-10').map((d) => ({
      date: d, scales: { sleep: 4 }, reasons: { sleep: ['sweats'] }, savedAt: '',
    }));
    const opened: Period = { ...sealed, revealOn: '2026-09-10' };
    const summary = buildSummary(opened, days, [], SCALE_FIELDS.filter((f) => f.id === 'sleep'));
    const text = letterToText(buildLetter({ prep, today: '2026-09-10', period: opened, summary }));
    expect(text).toContain('filled in on 10 of 10 days');
    expect(text).toContain('affected me most were poor sleep');
    expect(text).toContain('When I slept badly, the reason I noted most often was hot flushes or night sweats (10 of 10 days).');
  });

  it('greets a nurse as a nurse', () => {
    expect(buildLetter({ prep, today: '2026-09-10', period: { ...sealed, kind: 'nurse' } }).greeting).toBe('Dear Nurse,');
  });
});

describe('letter: whole-person content', () => {
  it('opens with what she wants back, then what it costs her, before any numbers', () => {
    const prep = { ...EMPTY_PREP, getBackTo: 'thinking', duration: 'gt12', impact: ['work', 'caring', 'enjoy'] };
    const text = letterToText(buildLetter({ prep, today: '2026-09-10' }));
    expect(text).toMatch(/^Dear Doctor,\n\nI'd like to get back to thinking clearly\./);
    expect(text).toContain('going on for more than a year.');
    // Bullets, in the self-first list order, whatever order she tapped them in.
    expect(text).toContain("How this is affecting my life:\n- I've stopped doing things I enjoy\n- Work\n- Parenting or caring");
    expect(text.indexOf('How this is affecting my life')).toBeLessThan(text.indexOf('Thank you'));
  });

  it('falls back to a neutral opener', () => {
    expect(letterToText(buildLetter({ prep: { ...EMPTY_PREP, goals: ['talk'] }, today: '2026-09-10' }))).toContain("I've booked this appointment to talk about how I've been feeling.");
  });

  it('leaves background out when skipped or "prefer not to say"', () => {
    const skipped = letterToText(buildLetter({ prep: { ...EMPTY_PREP, goals: ['talk'], contraception: 'skip', lastPeriod: 'skip', meds: ['skip'] }, today: '2026-09-10' }));
    expect(skipped).not.toContain('Background');
    expect(skipped).not.toMatch(/contraception/i);
    const given = letterToText(buildLetter({ prep: { ...EMPTY_PREP, goals: ['talk'], contraception: 'not-relevant', meds: ['hrt'] }, today: '2026-09-10' }));
    expect(given).toContain("- Contraception isn't relevant to me.");
    expect(given).toContain("- I'm currently taking HRT.");
  });
});

describe('letter: family context', () => {
  it("states the mother's age as a fact, and leaves it out when unknown", () => {
    const t = (motherAge: string) => letterToText(buildLetter({ prep: { ...EMPTY_PREP, goals: ['talk'], motherAge }, today: '2026-09-10' }));
    expect(t('40-45')).toContain("- My mother's periods stopped between 40 and 45.");
    expect(t('unknown')).not.toContain('mother');
    expect(t('skip')).not.toContain('mother');
  });
});

describe('letter: symptoms named up front', () => {
  it('names what is bothering her, straight after the opening, even while the record is sealed', () => {
    const sealed: Period = { id: 'p', start: '2026-09-01', revealOn: '2026-10-01', kind: 'gp' };
    const text = letterToText(buildLetter({ prep: { ...EMPTY_PREP, symptoms: ['fog', 'energy', 'sleep'] }, today: '2026-09-10', period: sealed }));
    // Listed in the chip order, whatever order she tapped them in.
    expect(text).toContain("The things bothering me most are low energy, poor sleep and brain fog.");
    expect(text.indexOf('bothering me most')).toBeLessThan(text.indexOf('stays sealed'));
  });
  it('reads naturally with one symptom', () => {
    expect(letterToText(buildLetter({ prep: { ...EMPTY_PREP, symptoms: ['mood'] }, today: '2026-09-10' }))).toContain('The thing bothering me most is low mood.');
  });
});

describe('questions: combined, starred, migrated', () => {
  it('leads with the starred question, then the rest', () => {
    const text = letterToText(buildLetter({ prep: { ...EMPTY_PREP, questions: ['q-cause', 'q-record', 'q-if-worse'], starQuestion: 'q-if-worse' }, today: '2026-09-10' }));
    const star = text.indexOf("My most important question is: If it doesn't get better");
    expect(star).toBeGreaterThan(0);
    expect(star).toBeLessThan(text.indexOf('- What do you think could be causing this'));
    expect(text.match(/If it doesn't get better/g)).toHaveLength(1);
  });
  it('keeps old picks by mapping them into the combined questions', () => {
    const p = normalizePrep({ questions: ['q-tests', 'q-cause', 'q-watch', 'q-read'], starQuestion: 'q-read' });
    expect(p.questions).toEqual(['q-cause', 'q-if-worse', 'q-record']);
    expect(p.starQuestion).toBe('q-record');
    expect(p.symptoms).toEqual([]);
  });
});

describe('letter: medication, supplements, HRT', () => {
  const t = (meds: string[], supplements: string[] = []) =>
    letterToText(buildLetter({ prep: { ...EMPTY_PREP, goals: ['talk'], meds, supplements }, today: '2026-09-10' }));
  it('orders prescribed, then supplements, then HRT on its own line', () => {
    const text = t(['hrt', 'gp', 'private'], ['vitd', 'magnesium', 'sleep']);
    const a = text.indexOf('- My prescribed medication is on my record. Some is prescribed privately and may not be.');
    const b = text.indexOf('- I also take vitamin D, magnesium and an over-the-counter sleep aid or antihistamine. These won\'t be on my record.');
    const c = text.indexOf("- I'm currently taking HRT.");
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
  });
  it('handles private-only, none and prefer-not-to-say', () => {
    expect(t(['private'])).toContain('I take medication prescribed privately, which may not be on my GP record.');
    expect(t(['none'], ['iron'])).toContain("- I take iron. This won't be on my record.");
    expect(t(['skip'], ['iron'])).not.toMatch(/iron|medication/);
  });
  it('converts the old single medication answer', () => {
    expect(normalizePrep({ medication: 'both' }).meds).toEqual(['gp', 'hrt']);
    expect(normalizePrep({ medication: 'hrt', meds: ['none'] }).meds).toEqual(['none']);
  });
});

describe('letter: day to day', () => {
  const t = (lifestyle: Record<string, string>) => letterToText(buildLetter({ prep: { ...EMPTY_PREP, goals: ['talk'], lifestyle }, today: '2026-09-10' }));
  it('reads as one line in the background', () => {
    expect(t({ exercise: 'few', alcohol: 'within', smoking: 'never', caffeine: '1-2', meals: 'skip-meals' })).toContain(
      "- Day to day: I exercise a few times a week, drink within 14 units a week, don't smoke or vape and have 1–2 caffeinated drinks a day. I often skip meals.",
    );
  });
  it('leaves out not sure and prefer not to say', () => {
    expect(t({ alcohol: 'skip', smoking: 'skip' })).not.toContain('Day to day');
    expect(t({ alcohol: 'unsure', meals: 'regular' })).toContain('- Day to day: I eat regular meals.');
  });
});

describe('letter: v3 wording', () => {
  const t = (extra: Partial<typeof EMPTY_PREP>, period?: Period) =>
    letterToText(buildLetter({ prep: { ...EMPTY_PREP, goals: ['talk'], ...extra }, today: '2026-09-10', period }));
  it('merges a coil or implant with no periods into one line', () => {
    const text = t({ lastPeriod: 'none', contraception: 'hormonal-coil' });
    expect(text).toContain("- I have a hormonal coil, so I don't have periods to go by.");
    expect(text).not.toContain('for contraception');
    expect(t({ lastPeriod: 'none', contraception: 'copper-coil' })).toContain("- I don't have periods to go by.\n- I use a copper coil for contraception.");
  });
  it('uses full sentences for contraception', () => {
    expect(t({ contraception: 'pill' })).toContain('- I take the pill for contraception.');
  });
  it('introduces the needs section with the neurodivergent line', () => {
    expect(t({ needs: ['n-nd', 'n-time'] })).toContain("Things that help me in appointments:\nI'm neurodivergent. These things help me in appointments:\n- I may need a moment to answer");
    expect(t({ needs: ['n-nd'] })).toMatch(/Things that help me in appointments:\nI'm neurodivergent\.\n\nThank you/);
  });
  it('explains the seal without "steer"', () => {
    expect(t({}, { id: 'p', start: '2026-09-01', revealOn: '2026-10-01', kind: 'gp' })).toContain("so that seeing it can't influence what I record");
  });
  it('puts background in the self-first order', () => {
    const text = t({ meds: ['gp'], lifestyle: { exercise: 'most' }, motherAge: 'gt45', lastPeriod: 'lt3', contraception: 'pill' });
    const order = ['My prescribed medication', 'Day to day', "My mother's periods", 'My last period', 'the pill'].map((w) => text.indexOf(w));
    expect(order.every((n, i) => n > 0 && (i === 0 || n > order[i - 1]))).toBe(true);
  });
});

describe('pain and where', () => {
  const pain = SCALE_FIELDS.filter((f) => f.id === 'aches');
  it('asks where from Mild upwards, and never offers chest', () => {
    expect(pain[0].reasons?.from).toBe(2);
    expect(pain[0].reasons?.options.map((o) => o.id)).not.toContain('chest');
  });
  it('says where in the letter once the record opens', () => {
    const days: DayEntry[] = dayRange('2026-09-01', '2026-09-10').map((d, i) => ({
      date: d, scales: { aches: i < 8 ? 2 : 1 }, reasons: { aches: i < 5 ? ['back', 'head'] : ['head'] }, savedAt: '',
    }));
    const opened: Period = { id: 'p', start: '2026-09-01', revealOn: '2026-09-10', kind: 'gp' };
    const summary = buildSummary(opened, days, [], pain);
    expect(summary.behind[0].reasons.slice(0, 2).map((r) => [r.id, r.days])).toEqual([['head', 8], ['back', 5]]);
    const text = letterToText(buildLetter({ prep: { ...EMPTY_PREP, goals: ['talk'] }, today: '2026-09-10', period: opened, summary }));
    expect(text).toContain('When I had pain, it was most often in my head (8 of 8 days).');
  });
});
