import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { InstallNotice } from '../components/chrome';
import { MultiChoice, OptionStack } from '../components/controls';
import { BackIcon, CheckIcon, ChevronIcon, CloseIcon, EnvelopeIcon } from '../components/icons';
import { BLEEDING_SIGNPOST } from '../content/copy';
import {
  activeScaleFields,
  BLEEDING_EMPHASISE,
  BLEEDING_FIELD,
  REASONS_FROM,
  SCALE_VALUES,
  WEEKLY_CHANGES,
  WEEKLY_NOTHING,
  type ScaleField,
} from '../content/fields';
import { currentPeriod } from '../lib/blind';
import { daysBetween, formatDay, formatDayShort, isoWeek, type DayKey } from '../lib/dates';
import { useStore } from '../store';

// Today is a front door, not a form. One card invites her into a check-in
// that asks one thing at a time; everything else stays out of the way.

type Step = { kind: 'scale'; field: ScaleField } | { kind: 'reasons'; field: ScaleField } | { kind: 'bleeding' } | { kind: 'weekly' };

export function Today() {
  const { snap, today, yesterday } = useStore();
  const [flowDate, setFlowDate] = useState<DayKey | null>(null);
  const fields = activeScaleFields(snap.settings.enabledOptional);
  const entry = snap.days.find((d) => d.date === today);
  const answered = entry ? Object.keys(entry.scales).length + (entry.bleeding ? 1 : 0) : 0;
  const weekDue = !snap.weeks.some((w) => w.week === isoWeek(today));
  const total = fields.length + 1 + (weekDue ? 1 : 0);
  const yEntry = snap.days.find((d) => d.date === yesterday);
  // Only offer yesterday once she has actually started recording before today.
  const startedBefore = snap.days.some((d) => d.date < today);
  const yesterdayMissing = startedBefore && (!yEntry || (!yEntry.finished && Object.keys(yEntry.scales).length === 0));

  if (flowDate) return <CheckIn date={flowDate} onClose={() => setFlowDate(null)} />;

  return (
    <main class="wrap" id="main">
      <p class="greeting">{greeting()}</p>
      <h1 class="display">{formatDayShort(today)}</h1>

      {entry?.finished ? (
        <section class="hero-card done">
          <span class="hero-icon"><CheckIcon size={28} /></span>
          <div>
            <h2>Done for today</h2>
            <p>That's on the record. See you tomorrow, or whenever you're next here. Gaps are fine.</p>
            <button class="link" onClick={() => setFlowDate(today)}>Change today's answers</button>
          </div>
        </section>
      ) : (
        <section class="hero-card">
          <h2>{answered > 0 ? 'Pick up where you left off' : "Today's check-in"}</h2>
          <p>
            {answered > 0 ? `${answered} of ${total} answered.` : `${total} quick questions, about 30 seconds.`} Skip anything you like.
          </p>
          <button class="primary big" onClick={() => setFlowDate(today)}>
            {answered > 0 ? 'Carry on' : 'Start'}
          </button>
        </section>
      )}

      {yesterdayMissing && (
        <button class="row-link" onClick={() => setFlowDate(yesterday)}>
          <span>Missed yesterday? You can still add it.</span>
          <ChevronIcon size={18} />
        </button>
      )}

      <SealedCard />
      <InstallNotice />
    </main>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

// The blind, shown as a sealed envelope counting down, not a locked chart.
function SealedCard() {
  const { snap, today } = useStore();
  const period = currentPeriod(snap.periods, today);
  if (!period) {
    return (
      <a class="sealed-card" href="#/prep">
        <span class="sealed-icon"><EnvelopeIcon size={26} /></span>
        <span>
          <strong>Got an appointment coming up?</strong>
          <span class="quiet block">Add the date and your record opens as a one-page summary that day.</span>
        </span>
        <ChevronIcon size={18} />
      </a>
    );
  }
  const logged = snap.days.filter((d) => d.date >= period.start && d.date <= today && Object.keys(d.scales).length > 0).length;
  const toGo = daysBetween(today, period.revealOn);
  const span = Math.max(1, daysBetween(period.start, period.revealOn));
  const pct = Math.min(100, Math.max(4, ((span - toGo) / span) * 100));
  return (
    <a class="sealed-card" href="#/record">
      <span class="sealed-icon"><EnvelopeIcon size={26} /></span>
      <span class="grow">
        <strong>Sealed until {formatDay(period.revealOn, false)}</strong>
        <span class="quiet block">
          {toGo === 1 ? 'Opens tomorrow' : `${toGo} days to go`} · {logged} {logged === 1 ? 'day' : 'days'} recorded
        </span>
        <span class="track" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
      </span>
    </a>
  );
}

function CheckIn({ date, onClose }: { date: DayKey; onClose: () => void }) {
  const { snap, today, setScale, setReasons, setBleeding, setWeekChanges, finishDay } = useStore();
  const fields = activeScaleFields(snap.settings.enabledOptional);
  const weekAnswered = snap.weeks.some((w) => w.week === isoWeek(today));
  // The weekly question is dealt only on today's check-in and only until answered.
  const [baseSteps] = useState<Step[]>(() => [
    ...fields.map((field) => ({ kind: 'scale' as const, field })),
    { kind: 'bleeding' as const },
    ...(date === today && !weekAnswered ? [{ kind: 'weekly' as const }] : []),
  ]);
  const [i, setI] = useState(0);
  const [finished, setFinished] = useState(false);
  const timer = useRef<number>();
  const heading = useRef<HTMLHeadingElement>(null);
  const entry = snap.days.find((d) => d.date === date);
  // "What was behind it?" is dealt in straight after a question answered as a problem.
  const steps = useMemo(
    () =>
      baseSteps.flatMap((st): Step[] =>
        st.kind === 'scale' && st.field.reasons && (entry?.scales[st.field.id] ?? 0) >= REASONS_FROM
          ? [st, { kind: 'reasons', field: st.field }]
          : [st],
      ),
    [baseSteps, entry],
  );
  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const step = steps[Math.min(i, steps.length - 1)];
  // Follow-ups count as part of the question they follow, so the total never changes mid-check-in.
  const pos = steps.slice(0, Math.min(i, steps.length - 1) + 1).filter((st) => st.kind !== 'reasons').length;

  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [i, finished]);
  useEffect(() => {
    // Full-screen focus: hide the tab bar and footer while checking in.
    document.body.classList.add('in-flow');
    return () => {
      clearTimeout(timer.current);
      document.body.classList.remove('in-flow');
    };
  }, []);

  const iRef = useRef(i);
  iRef.current = i;
  // Reads refs so a delayed auto-advance sees any follow-up step just added.
  const next = () => {
    clearTimeout(timer.current);
    if (iRef.current < stepsRef.current.length - 1) setI(iRef.current + 1);
    else {
      finishDay(date);
      setFinished(true);
    }
  };
  const advanceSoon = () => {
    clearTimeout(timer.current);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    timer.current = window.setTimeout(next, reduced ? 0 : 260);
  };

  const dayLabel = date === today ? 'Today' : `Yesterday · ${formatDayShort(date)}`;

  if (finished) {
    return (
      <main class="wrap flow" id="main">
        <div class="finish">
          <span class="finish-mark"><CheckIcon size={40} /></span>
          <h1 class="display" tabIndex={-1} ref={heading}>That's it</h1>
          <p>Saved on this phone. Your answers go into the sealed record. No need to think about them again.</p>
          <button class="primary big" onClick={onClose}>Back to today</button>
        </div>
      </main>
    );
  }

  return (
    <main class="wrap flow" id="main">
      <div class="flow-top">
        <button class="icon-btn" aria-label="Close check-in" onClick={onClose}><CloseIcon /></button>
        <div class="progress" role="progressbar" aria-valuemin={1} aria-valuemax={baseSteps.length} aria-valuenow={pos} aria-label={`Question ${pos} of ${baseSteps.length}`}>
          {baseSteps.map((_, n) => <span key={n} class={n < pos - 1 ? 'done' : n === pos - 1 ? 'now' : ''} />)}
        </div>
        <span class="count">{pos}/{baseSteps.length}</span>
      </div>

      <p class="eyebrow">{step.kind === 'reasons' ? `${dayLabel} · follow-up` : dayLabel}</p>

      {step.kind === 'scale' && (
        <>
          <h1 class="question" tabIndex={-1} ref={heading}>{step.field.question}</h1>
          <p class="quiet">{step.field.hint}</p>
          <OptionStack
            label={step.field.label}
            options={SCALE_VALUES.map((n) => ({ value: String(n), label: step.field.answers[n - 1] }))}
            value={entry?.scales[step.field.id]?.toString()}
            onChange={(v) => {
              setScale(date, step.field.id, v ? Number(v) : undefined);
              if (v) advanceSoon();
            }}
          />
        </>
      )}

      {step.kind === 'reasons' && step.field.reasons && (
        <>
          <h1 class="question" tabIndex={-1} ref={heading}>{step.field.reasons.question}</h1>
          <p class="quiet">Tick any that fit. Only you know, and it helps spot what's driving it.</p>
          <MultiChoice
            stacked
            label={step.field.reasons.question}
            options={step.field.reasons.options}
            value={entry?.reasons?.[step.field.id] ?? []}
            onChange={(ids) => setReasons(date, step.field.id, ids)}
          />
        </>
      )}

      {step.kind === 'bleeding' && (
        <>
          <h1 class="question" tabIndex={-1} ref={heading}>{BLEEDING_FIELD.label}</h1>
          <p class="quiet">{BLEEDING_FIELD.hint}. Always visible to you, never sealed.</p>
          <OptionStack
            label={BLEEDING_FIELD.label}
            options={BLEEDING_FIELD.options}
            value={entry?.bleeding}
            onChange={(v) => {
              setBleeding(date, v);
              if (v && !BLEEDING_EMPHASISE.has(v)) advanceSoon();
            }}
          />
          <BleedingSignpost emphasise={!!entry?.bleeding && BLEEDING_EMPHASISE.has(entry.bleeding)} />
        </>
      )}

      {step.kind === 'weekly' && <WeeklyStep heading={heading} onChange={setWeekChanges} />}

      <div class="flow-nav">
        <button class="ghost" onClick={() => setI(i - 1)} disabled={i === 0}>
          <BackIcon size={18} /> Back
        </button>
        <button class={step.kind === 'scale' ? 'ghost' : 'primary'} onClick={next}>
          {i === steps.length - 1 ? 'Finish' : step.kind === 'scale' ? 'Skip' : 'Next'}
        </button>
      </div>
    </main>
  );
}

function BleedingSignpost({ emphasise }: { emphasise: boolean }) {
  return (
    <details class={`signpost${emphasise ? ' emphasise' : ''}`} open={emphasise} key={String(emphasise)}>
      <summary>When to get bleeding checked</summary>
      <p>{BLEEDING_SIGNPOST.text}</p>
      <p class="links">
        {BLEEDING_SIGNPOST.links.map((l) => (
          <a key={l.href} href={l.href} target="_blank" rel="noopener">{l.text}</a>
        ))}
      </p>
    </details>
  );
}

// Once a week, "what else changed?". Dealt into today's check-in until
// answered; if the week passes, it is never mentioned again.
function WeeklyStep({ heading, onChange }: { heading: preact.RefObject<HTMLHeadingElement>; onChange: (c: string[]) => void }) {
  const { snap, today } = useStore();
  const value = snap.weeks.find((w) => w.week === isoWeek(today))?.changes ?? [];
  const set = (next: string[]) => {
    // "Nothing notable" and specific changes are mutually exclusive.
    const pickedNothing = next.includes(WEEKLY_NOTHING.id) && !value.includes(WEEKLY_NOTHING.id);
    onChange(pickedNothing ? [WEEKLY_NOTHING.id] : next.filter((c) => c !== WEEKLY_NOTHING.id));
  };
  return (
    <>
      <h1 class="question" tabIndex={-1} ref={heading}>Anything different this week?</h1>
      <p class="quiet">Once a week. Noting it now means it's on record before you see any results.</p>
      <MultiChoice stacked label="What else changed this week" options={[...WEEKLY_CHANGES, WEEKLY_NOTHING]} value={value} onChange={set} />
    </>
  );
}
