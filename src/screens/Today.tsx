import { useState } from 'preact/hooks';
import { MultiChoice, Scale, SingleChoice } from '../components/controls';
import { InstallNotice } from '../components/chrome';
import { BLEEDING_SIGNPOST } from '../content/copy';
import { activeScaleFields, BLEEDING_EMPHASISE, BLEEDING_FIELD, WEEKLY_CHANGES, WEEKLY_NOTHING } from '../content/fields';
import { currentPeriod } from '../lib/blind';
import { formatDay, formatDayShort, isoWeek } from '../lib/dates';
import { useStore } from '../store';

export function Today() {
  const { snap, today, yesterday, setScale, setBleeding } = useStore();
  const [day, setDay] = useState<'today' | 'yesterday'>('today');
  const date = day === 'today' ? today : yesterday;
  const entry = snap.days.find((d) => d.date === date);
  const fields = activeScaleFields(snap.settings.enabledOptional);
  const period = currentPeriod(snap.periods, today);
  const answered = entry ? Object.keys(entry.scales).length : 0;

  return (
    <main class="wrap" id="main">
      <InstallNotice compact={snap.days.length > 3} />
      <PeriodStatus />

      <div class="daypick" role="tablist" aria-label="Which day">
        <button role="tab" aria-selected={day === 'today'} onClick={() => setDay('today')}>
          Today <span class="sub">{formatDayShort(today)}</span>
        </button>
        <button role="tab" aria-selected={day === 'yesterday'} onClick={() => setDay('yesterday')}>
          Yesterday <span class="sub">{formatDayShort(yesterday)}</span>
        </button>
      </div>

      <p class="lede">
        Tap what fits. Skip anything. {answered > 0 ? 'Saved as you go.' : 'It saves as you go.'}
      </p>

      {fields.map((f) => (
        <Scale
          key={f.id}
          id={`${date}-${f.id}`}
          label={f.label}
          hint={f.hint}
          value={entry?.scales[f.id]}
          onChange={(v) => setScale(date, f.id, v)}
        />
      ))}

      <SingleChoice
        label={BLEEDING_FIELD.label}
        hint={`${BLEEDING_FIELD.hint} · always visible to you`}
        options={BLEEDING_FIELD.options}
        value={entry?.bleeding}
        onChange={(v) => setBleeding(date, v)}
      />
      <BleedingSignpost emphasise={!!entry?.bleeding && BLEEDING_EMPHASISE.has(entry.bleeding)} />

      <WeeklyCard />

      {period && answered > 0 && (
        <p class="quiet center">
          That's it for {day === 'today' ? 'today' : 'yesterday'}. Your readings stay hidden until {formatDay(period.revealOn)}.
        </p>
      )}
    </main>
  );
}

function PeriodStatus() {
  const { snap, today } = useStore();
  const period = currentPeriod(snap.periods, today);
  if (!period) {
    return (
      <aside class="notice">
        <strong>No reveal date set.</strong> Your readings are being kept, hidden. Set your appointment date and
        they'll be revealed as a summary on that day. <a href="#/prep">Set a date</a>
      </aside>
    );
  }
  const logged = snap.days.filter((d) => d.date >= period.start && d.date <= today && Object.keys(d.scales).length > 0).length;
  return (
    <aside class="status">
      <span>
        Hidden until <strong>{formatDay(period.revealOn)}</strong>
      </span>
      <span class="quiet">{logged} {logged === 1 ? 'day' : 'days'} recorded. Missed days don't matter.</span>
    </aside>
  );
}

function BleedingSignpost({ emphasise }: { emphasise: boolean }) {
  return (
    <aside class={`signpost${emphasise ? ' emphasise' : ''}`} role={emphasise ? 'note' : undefined}>
      <p>{BLEEDING_SIGNPOST.text}</p>
      <p class="links">
        {BLEEDING_SIGNPOST.links.map((l) => (
          <a key={l.href} href={l.href} target="_blank" rel="noopener">
            {l.text}
          </a>
        ))}
      </p>
    </aside>
  );
}

// Once a week, "what else changed?". It appears for the current week only and
// quietly disappears if skipped: a missed week is never mentioned again.
function WeeklyCard() {
  const { snap, today, setWeekChanges } = useStore();
  const week = isoWeek(today);
  const saved = snap.weeks.find((w) => w.week === week);
  const [open, setOpen] = useState(!saved);
  const value = saved?.changes ?? [];

  const onChange = (next: string[]) => {
    // "Nothing notable" and specific changes are mutually exclusive.
    const pickedNothing = next.includes(WEEKLY_NOTHING.id) && !value.includes(WEEKLY_NOTHING.id);
    setWeekChanges(pickedNothing ? [WEEKLY_NOTHING.id] : next.filter((c) => c !== WEEKLY_NOTHING.id));
  };

  return (
    <section class="card weekly" aria-labelledby="weekly-h">
      <h2 id="weekly-h">This week: what else changed?</h2>
      {open ? (
        <>
          <p class="quiet">Once a week. Noted now, so it's on record before you see any results.</p>
          <MultiChoice label="What else changed this week" options={[...WEEKLY_CHANGES, WEEKLY_NOTHING]} value={value} onChange={onChange} />
          {saved && (
            <button class="link" onClick={() => setOpen(false)}>
              Done
            </button>
          )}
        </>
      ) : (
        <p class="quiet">
          Noted for this week. <button class="link" onClick={() => setOpen(true)}>Change</button>
        </p>
      )}
    </section>
  );
}
