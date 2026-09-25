import { useState } from 'preact/hooks';
import { SHEET_FOOTER, SHEET_METHOD } from '../content/copy';
import { activeScaleFields, BLEEDING_FIELD, SCALE_FIELDS, WEEKLY_CHANGES, WEEKLY_NOTHING } from '../content/fields';
import { GOALS, NEEDS, QUESTIONS } from '../content/prep';
import { currentPeriod, revealedPeriods } from '../lib/blind';
import { dayRange, formatDay, fromDayKey } from '../lib/dates';
import { buildSummary, type Summary } from '../lib/summary';
import type { Period } from '../lib/types';
import { useStore } from '../store';

const KIND_LABEL: Record<Period['kind'], string> = {
  gp: 'GP appointment',
  nurse: 'Nurse appointment',
  specialist: 'Specialist appointment',
  other: 'Appointment',
  review: 'Review',
};

export function Record() {
  const { snap, today } = useStore();
  const revealed = revealedPeriods(snap.periods, today);
  const [openId, setOpenId] = useState<string | null>(revealed[0]?.id ?? null);
  const open = revealed.find((p) => p.id === openId) ?? revealed[0];

  return (
    <main class="wrap" id="main">
      <h1 class="no-print">Your record</h1>
      <Blinded />
      {revealed.length > 1 && (
        <div class="chips no-print" role="group" aria-label="Revealed records">
          {revealed.map((p) => (
            <button key={p.id} class={`chip${p.id === open?.id ? ' on' : ''}`} aria-pressed={p.id === open?.id} onClick={() => setOpenId(p.id)}>
              {formatDay(p.revealOn)}
            </button>
          ))}
        </div>
      )}
      {open && <Sheet period={open} />}
    </main>
  );
}

// While blind she sees only that days were recorded, never the values.
function Blinded() {
  const { snap, today } = useStore();
  const period = currentPeriod(snap.periods, today);
  if (!period) {
    if (revealedPeriods(snap.periods, today).length) return null;
    return (
      <p class="notice no-print">
        Nothing revealed yet. <a href="#/prep">Set your appointment date</a> and your summary appears here on that day.
      </p>
    );
  }
  const logged = new Set(snap.days.filter((d) => Object.keys(d.scales).length > 0).map((d) => d.date));
  const days = dayRange(period.start, period.revealOn);
  const lead = (fromDayKey(period.start).getDay() + 6) % 7; // blanks before a Monday start
  return (
    <section class="card no-print" aria-labelledby="blind-h">
      <h2 id="blind-h">Hidden until {formatDay(period.revealOn)}</h2>
      <p class="quiet">
        Dots show days you recorded. Not what you recorded: that's the point. Gaps are normal and change nothing.
      </p>
      <div class="dots" role="img" aria-label={`${[...logged].filter((d) => d >= period.start && d <= today).length} days recorded so far`}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={`h${i}`} class="dot-h">{d}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} />)}
        {days.map((d) => (
          <span key={d} class={`dot${logged.has(d) ? ' on' : ''}${d === today ? ' today' : ''}${d > today ? ' future' : ''}`} />
        ))}
      </div>
    </section>
  );
}

function Sheet({ period }: { period: Period }) {
  const { snap } = useStore();
  // Include any optional field that has readings in range, even if since switched off.
  const withData = new Set(snap.days.filter((d) => d.date >= period.start && d.date <= period.revealOn).flatMap((d) => Object.keys(d.scales)));
  const fields = SCALE_FIELDS.filter((f) => withData.has(f.id) || activeScaleFields(snap.settings.enabledOptional).includes(f));
  const s = buildSummary(period, snap.days, snap.weeks, fields);
  const { prep } = snap;
  const pick = <T extends { id: string }>(opts: T[], ids: string[]) => opts.filter((o) => ids.includes(o.id));

  return (
    <article class="sheet" aria-label="Summary sheet">
      <div class="sheet-actions no-print">
        <button class="primary" onClick={() => window.print()}>Print or save as PDF</button>
        <p class="quiet">On iPhone, the print screen can also save it as a PDF to Files, or you can show it on screen.</p>
      </div>

      <header>
        <p class="eyebrow">{KIND_LABEL[period.kind]} · {formatDay(period.revealOn)}</p>
        <h2>My symptom record, {formatDay(s.start, false)} to {formatDay(s.end)}</h2>
        <p class="method">{SHEET_METHOD}</p>
        <p class="coverage">
          Recorded on <strong>{s.daysLogged}</strong> of {s.totalDays} days
          {s.lateDays > 0 && <> ({s.lateDays} entered the next day)</>}.
        </p>
      </header>

      {(prep.goals.length > 0 || prep.needs.length > 0) && (
        <section>
          {prep.goals.length > 0 && (
            <>
              <h3>What I'd like from today</h3>
              <ul>{pick(GOALS, prep.goals).map((g) => <li key={g.id}>{g.label}</li>)}</ul>
            </>
          )}
          {prep.needs.length > 0 && (
            <>
              <h3>What helps me in appointments</h3>
              <ul>{pick(NEEDS, prep.needs).map((n) => <li key={n.id}>{n.label}</li>)}</ul>
            </>
          )}
        </section>
      )}

      {s.mostAffected.length > 0 && (
        <section>
          <h3>Most affected (highest average)</h3>
          <ol class="most">
            {s.mostAffected.map((f) => (
              <li key={f.id}>
                <strong>{f.label}</strong>: average {f.average} of 5, rated 4 or 5 on {f.hardDays} of {f.readings} days recorded
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <h3>Week by week</h3>
        <WeekTable s={s} />
        <p class="small">Weekly average of 1–5 readings (1 = not at all, 5 = very much). Blank = not recorded that week.</p>
      </section>

      <section>
        <h3>{BLEEDING_FIELD.label}</h3>
        {s.bleeding.length === 0 ? (
          <p>No bleeding recorded{s.bleedingNoneDays > 0 ? ` (recorded "none" on ${s.bleedingNoneDays} days)` : ''}.</p>
        ) : (
          <ul class="cols">
            {s.bleeding.map((b) => (
              <li key={b.date}>
                {formatDay(b.date, false)}: {BLEEDING_FIELD.options.find((o) => o.value === b.value)?.label ?? b.value}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>What else changed, noted at the time</h3>
        <ul>
          {s.weeks.map((w) => (
            <li key={w.week}>
              <span class="wk">{formatDay(w.start, false)}–{formatDay(w.end, false)}:</span>{' '}
              {w.changes === null
                ? <span class="quiet">not noted</span>
                : w.changes.map((c) => [...WEEKLY_CHANGES, WEEKLY_NOTHING].find((o) => o.id === c)?.label ?? c).join('; ')}
            </li>
          ))}
        </ul>
      </section>

      {prep.questions.length > 0 && (
        <section>
          <h3>Questions I'd like to ask</h3>
          <ul class="checks">{pick(QUESTIONS, prep.questions).map((q) => <li key={q.id}>{q.label}</li>)}</ul>
        </section>
      )}

      <section class="notes-space">
        <h3>Notes from the appointment</h3>
        <div class="lines" aria-hidden="true" />
      </section>

      <footer class="small">{SHEET_FOOTER}</footer>
    </article>
  );
}

function WeekTable({ s }: { s: Summary }) {
  return (
    <div class="table-scroll" tabIndex={0} role="region" aria-label="Week by week table">
      <table class="weeks">
        <thead>
          <tr>
            <th scope="col">Week of</th>
            {s.weeks.map((w) => (
              <th key={w.week} scope="col">
                {formatDay(w.start, false)}
                <span class="sub">{w.daysLogged}/{w.daysInRange} days</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {s.fields.map((f) => (
            <tr key={f.id}>
              <th scope="row">{f.label}</th>
              {s.weeks.map((w) => {
                const c = w.fields[f.id];
                return (
                  <td key={w.week} class={c.average === null ? 'empty' : `h${Math.round(c.average)}`}>
                    {c.average === null ? '' : c.average.toFixed(1)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
