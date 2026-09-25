import { useEffect, useRef, useState } from 'preact/hooks';
import { MultiChoice, SingleChips } from '../components/controls';
import { BackIcon, ChevronIcon, CloseIcon, EnvelopeIcon } from '../components/icons';
import {
  CONTRACEPTION,
  DURATION,
  GET_BACK,
  GOALS,
  IMPACT,
  LAST_PERIOD,
  MEDICATION,
  MOTHER_AGE,
  NEEDS,
  QUESTIONS,
  type LetterOption,
} from '../content/prep';
import { currentPeriod, nextPeriodStart } from '../lib/blind';
import { daysBetween, formatDay } from '../lib/dates';
import { hasLetterContent } from '../lib/letter';
import type { Period, Prep as PrepData } from '../lib/types';
import { useStore } from '../store';
import { LetterView } from './Letter';

// Appointment prep as a step-by-step flow in the check-in's frame, then a
// short summary with an Edit link per section. Every step can be skipped and
// every pick saves as she goes, so the letter is the same however she got there.

const KINDS: { id: Period['kind']; label: string }[] = [
  { id: 'gp', label: 'GP' },
  { id: 'nurse', label: 'Nurse' },
  { id: 'specialist', label: 'Specialist' },
  { id: 'other', label: 'Other' },
  { id: 'review', label: 'No appointment yet, just a review date' },
];

type BgKey = 'duration' | 'lastPeriod' | 'contraception' | 'medication' | 'motherAge';

const BACKGROUND: { key: BgKey; question: string; hint?: string; options: LetterOption[] }[] = [
  { key: 'duration', question: 'How long has this been going on?', options: DURATION },
  { key: 'lastPeriod', question: 'When was your last period?', options: LAST_PERIOD },
  { key: 'contraception', question: 'Contraception', hint: 'Answering here can stop it taking up appointment time.', options: CONTRACEPTION },
  { key: 'medication', question: 'Do you take any regular medication?', options: MEDICATION },
  { key: 'motherAge', question: "About what age did your mother's periods stop, if you know?", options: MOTHER_AGE },
];

type Step =
  | { main: 1; kind: 'date' }
  | { main: 2; kind: 'impact' }
  | { main: 3; kind: 'getback' }
  | { main: 4; kind: 'bg-intro' }
  | { main: 4; kind: 'bg'; bg: (typeof BACKGROUND)[number] }
  | { main: 5; kind: 'goals' }
  | { main: 6; kind: 'questions' }
  | { main: 7; kind: 'needs' }
  | { main: 8; kind: 'letter' };

// Background screens count under step 4, like check-in follow-ups, so the total never changes.
const STEPS: Step[] = [
  { main: 1, kind: 'date' },
  { main: 2, kind: 'impact' },
  { main: 3, kind: 'getback' },
  { main: 4, kind: 'bg-intro' },
  ...BACKGROUND.map((bg) => ({ main: 4 as const, kind: 'bg' as const, bg })),
  { main: 5, kind: 'goals' },
  { main: 6, kind: 'questions' },
  { main: 7, kind: 'needs' },
  { main: 8, kind: 'letter' },
];
const MAIN_TOTAL = 8;
const firstIndexOf = (main: number) => STEPS.findIndex((s) => s.main === main);

/** A soft cap: ten minutes goes fast, but she is never blocked. */
const QUESTIONS_PLENTY = 3;

export function Prep() {
  const { snap, today } = useStore();
  const [flowAt, setFlowAt] = useState<number | null>(null);
  const { prep } = snap;
  const started = (prep.stepReached ?? 0) > 0 || !!currentPeriod(snap.periods, today) || hasLetterContent(prep);

  if (flowAt !== null) return <PrepFlow start={flowAt} onClose={() => setFlowAt(null)} />;

  if (!started) {
    return (
      <main class="wrap" id="main">
        <h1>Your appointment</h1>
        <section class="hero-card">
          <h2>Get ready for it</h2>
          <p>8 short steps, about 3 minutes. They build a letter you can hand over or send ahead. Skip anything you like.</p>
          <button class="primary big" onClick={() => setFlowAt(0)}>Start</button>
        </section>
      </main>
    );
  }

  const reached = prep.stepReached ?? 0;
  return (
    <main class="wrap" id="main">
      <h1>Your appointment</h1>
      {reached < MAIN_TOTAL && (
        <section class="hero-card">
          <h2>Pick up where you left off</h2>
          <p>Step {Math.max(1, reached)} of {MAIN_TOTAL}. Skip anything you like.</p>
          <button class="primary big" onClick={() => setFlowAt(firstIndexOf(Math.max(1, reached)))}>Carry on</button>
        </section>
      )}
      <Summary onEdit={(main) => setFlowAt(firstIndexOf(main))} />
      <a class={`letter-card${hasLetterContent(prep) ? '' : ' muted'}`} href="#/letter">
        <span class="sealed-icon"><EnvelopeIcon size={26} /></span>
        <span class="grow">
          <strong>{hasLetterContent(prep) ? 'Your letter is ready' : 'Turn this into a letter'}</strong>
          <span class="quiet block">
            {hasLetterContent(prep)
              ? 'Built from what you picked. Print it, hand it over, or paste it into your GP practice’s online form.'
              : 'Pick anything above and a short letter to your GP writes itself.'}
          </span>
        </span>
        <ChevronIcon size={18} />
      </a>
    </main>
  );
}

// One line per section, so the tab is a glance rather than a form.
function Summary({ onEdit }: { onEdit: (main: number) => void }) {
  const { snap, today } = useStore();
  const { prep } = snap;
  const period = currentPeriod(snap.periods, today);
  const names = (opts: { id: string; label: string }[], ids: string[]) => {
    const picked = opts.filter((o) => ids.includes(o.id)).map((o) => o.label);
    if (!picked.length) return '';
    return picked.length <= 2 ? picked.join(', ') : `${picked.slice(0, 2).join(', ')} and ${picked.length - 2} more`;
  };
  const counted = (n: number) => (n ? `${n} picked` : '');
  const bgAnswered = BACKGROUND.filter((b) => prep[b.key]).length;
  const rows: { main: number; label: string; value: string }[] = [
    { main: 1, label: 'Date', value: period ? `${formatDay(period.revealOn)} · ${KINDS.find((k) => k.id === period.kind)?.label ?? ''}` : '' },
    { main: 2, label: 'Getting in the way of', value: names(IMPACT, prep.impact) },
    { main: 3, label: 'Most want back', value: GET_BACK.find((o) => o.id === prep.getBackTo)?.label ?? '' },
    { main: 4, label: 'Background', value: bgAnswered ? `${bgAnswered} of ${BACKGROUND.length} answered` : '' },
    { main: 5, label: 'What you want from it', value: counted(prep.goals.length) },
    { main: 6, label: 'Questions', value: counted(prep.questions.length) },
    { main: 7, label: 'What helps you', value: counted(prep.needs.length) },
  ];
  return (
    <section class="card summary-list" aria-label="Your answers">
      {rows.map((r) => (
        <div key={r.main} class="summary-row">
          <span class="grow">
            <span class="summary-label">{r.label}</span>
            <span class={r.value ? 'block' : 'block quiet'}>{r.value || 'Not answered'}</span>
          </span>
          <button class="link" onClick={() => onEdit(r.main)} aria-label={`Edit ${r.label}`}>Edit</button>
        </div>
      ))}
    </section>
  );
}

function PrepFlow({ start, onClose }: { start: number; onClose: () => void }) {
  const { snap, setPrep } = useStore();
  const [i, setI] = useState(start);
  const timer = useRef<number>();
  const heading = useRef<HTMLHeadingElement>(null);
  const iRef = useRef(i);
  iRef.current = i;
  const prepRef = useRef(snap.prep);
  prepRef.current = snap.prep;
  const step = STEPS[i];
  const { prep } = snap;

  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
    // Remember how far she got, so the tab can offer "Carry on".
    if ((prepRef.current.stepReached ?? 0) < step.main) setPrep({ ...prepRef.current, stepReached: step.main });
  }, [i]);
  useEffect(() => {
    document.body.classList.add('in-flow');
    return () => {
      clearTimeout(timer.current);
      document.body.classList.remove('in-flow');
    };
  }, []);

  const go = (to: number) => {
    clearTimeout(timer.current);
    if (to >= STEPS.length) onClose();
    else setI(Math.max(0, to));
  };
  const next = () => go(iRef.current + 1);
  const advanceSoon = () => {
    clearTimeout(timer.current);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    timer.current = window.setTimeout(next, reduced ? 0 : 260);
  };
  const set = (patch: Partial<PrepData>) => setPrep({ ...prepRef.current, ...patch });

  const isLast = i === STEPS.length - 1;
  const single = step.kind === 'getback' || step.kind === 'bg';
  const title = (words: string) => <h1 class="question" tabIndex={-1} ref={heading}>{words}</h1>;

  return (
    <main class="wrap flow" id="main">
      <div class="flow-top no-print">
        <button class="icon-btn" aria-label="Close" onClick={onClose}><CloseIcon /></button>
        <div class="progress" role="progressbar" aria-valuemin={1} aria-valuemax={MAIN_TOTAL} aria-valuenow={step.main} aria-label={`Step ${step.main} of ${MAIN_TOTAL}`}>
          {Array.from({ length: MAIN_TOTAL }, (_, n) => <span key={n} class={n < step.main - 1 ? 'done' : n === step.main - 1 ? 'now' : ''} />)}
        </div>
        <span class="count">{step.main}/{MAIN_TOTAL}</span>
      </div>
      <p class="eyebrow no-print">{step.kind === 'bg' ? 'Background · optional' : 'Your appointment'}</p>

      {step.kind === 'date' && (
        <>
          {title('When is your appointment?')}
          <RevealDate />
        </>
      )}

      {step.kind === 'impact' && (
        <>
          {title('What is this getting in the way of?')}
          <p class="quiet">Pick any. This goes near the top of your letter: what your symptoms are costing you, in your terms.</p>
          <MultiChoice stacked label="What it's affecting" options={IMPACT} value={prep.impact} onChange={(impact) => set({ impact })} />
        </>
      )}

      {step.kind === 'getback' && (
        <>
          {title('What would you most like to get back to?')}
          <p class="quiet">Pick one. Your letter opens with it.</p>
          <SingleChips
            label="What I'd like to get back to"
            options={GET_BACK}
            value={prep.getBackTo}
            onChange={(getBackTo) => {
              set({ getBackTo });
              if (getBackTo) advanceSoon();
            }}
          />
        </>
      )}

      {step.kind === 'bg-intro' && (
        <>
          {title('A little background')}
          <p class="quiet">
            Optional. {BACKGROUND.length} quick taps that save time in the room: how long this has been going on, your last period,
            contraception, medication and family history. Anything you skip stays out of the letter.
          </p>
          <div class="stack-buttons">
            <button class="primary big" onClick={next}>Answer these</button>
            <button class="big" onClick={() => go(firstIndexOf(5))}>Skip all background</button>
            <button class="ghost" onClick={() => go(i - 1)}><BackIcon size={18} /> Back</button>
          </div>
        </>
      )}

      {step.kind === 'bg' && (
        <>
          {title(step.bg.question)}
          {step.bg.hint && <p class="quiet">{step.bg.hint}</p>}
          <SingleChips
            label={step.bg.question}
            options={step.bg.options}
            value={prep[step.bg.key]}
            onChange={(v) => {
              set({ [step.bg.key]: v });
              if (v) advanceSoon();
            }}
          />
        </>
      )}

      {step.kind === 'goals' && (
        <>
          {title('What do you want from it?')}
          <p class="quiet">Pick any. The more specific, the better.</p>
          <MultiChoice stacked label="What I want from this appointment" options={GOALS} value={prep.goals} onChange={(goals) => set({ goals })} />
        </>
      )}

      {step.kind === 'questions' && (
        <>
          {title('Questions you might ask')}
          <p class="quiet">Ten minutes goes fast. Pick two or three that matter most.</p>
          <MultiChoice stacked label="Questions to ask" options={QUESTIONS} value={prep.questions} onChange={(questions) => set({ questions })} />
          {prep.questions.length >= QUESTIONS_PLENTY && <p class="quiet plenty" role="status">Three is plenty for ten minutes.</p>}
        </>
      )}

      {step.kind === 'needs' && (
        <>
          {title('What helps you in appointments')}
          <p class="quiet">Optional. Only what you're comfortable sharing. It goes in your letter so you don't have to say it out loud.</p>
          <MultiChoice stacked label="What helps me" options={NEEDS} value={prep.needs} onChange={(needs) => set({ needs })} />
        </>
      )}

      {step.kind === 'letter' && (
        <>
          {title('Your letter')}
          <p class="quiet no-print">
            Written from your choices. Hand it over, print it, or paste it into your GP practice's online form before the appointment.
          </p>
          <LetterView />
        </>
      )}

      {step.kind !== 'bg-intro' && (
        <div class="flow-nav no-print">
          <button class="ghost" onClick={() => go(i - 1)} disabled={i === 0}>
            <BackIcon size={18} /> Back
          </button>
          <button class={single ? 'ghost' : 'primary'} onClick={next}>
            {isLast ? 'Done' : single ? 'Skip' : 'Next'}
          </button>
        </div>
      )}
    </main>
  );
}

// Saves as she picks. Only an early reveal asks first, because it can't be undone.
function RevealDate() {
  const { snap, today, setPeriods } = useStore();
  const period = currentPeriod(snap.periods, today);
  const [date, setDate] = useState(period?.revealOn ?? '');
  const [confirmEarly, setConfirmEarly] = useState(false);

  const firstLogged = [...snap.days].map((d) => d.date).sort()[0];
  const start = period?.start ?? nextPeriodStart(snap.periods, firstLogged, today);
  const kind = period?.kind ?? 'gp';
  const invalid = !!date && date < start;
  const revealsNow = !!date && !invalid && date <= today;

  const save = (revealOn: string, k: Period['kind']) => {
    const next: Period = period ? { ...period, revealOn, kind: k } : { id: crypto.randomUUID(), start, revealOn, kind: k };
    setPeriods([...snap.periods.filter((p) => p.id !== next.id), next]);
  };
  const onDate = (value: string) => {
    setDate(value);
    setConfirmEarly(false);
    if (!value || value < start) return;
    if (value <= today) setConfirmEarly(true);
    else save(value, kind);
  };

  return (
    <>
      <p class="quiet">
        Your readings stay hidden until this date, then become a one-page summary you can show or print. Most patterns take a few weeks
        to show, so four to eight weeks of recording is a good aim.
      </p>
      <label class="stack">
        <span>Date</span>
        <input type="date" value={date} min={start} onInput={(e) => onDate(e.currentTarget.value)} />
      </label>
      {date && !invalid && !revealsNow && (
        <>
          <p class="quiet">{daysBetween(today, date)} days from today · covers from {formatDay(start)}</p>
          {daysBetween(start, date) < 21 && <p class="quiet">A short record still helps. Bring what you have.</p>}
        </>
      )}
      {invalid && <p class="warn">That's before your recording started ({formatDay(start)}).</p>}

      <fieldset class="field">
        <legend><span class="field-label">Who with</span></legend>
        <div class="chips">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              class={`chip${kind === k.id ? ' on' : ''}`}
              aria-pressed={kind === k.id}
              disabled={!period}
              onClick={() => period && save(period.revealOn, k.id)}
            >
              {k.label}
            </button>
          ))}
        </div>
        {!period && <p class="quiet small">Add a date first.</p>}
      </fieldset>

      {confirmEarly && (
        <div class="notice" role="alert">
          <p>
            <strong>This reveals your record now.</strong> Once you've seen it, the readings from this stretch can't be hidden again. That's
            fine if the appointment is today or soon.
          </p>
          <button
            class="primary"
            onClick={() => {
              save(date, kind);
              location.hash = '#/record';
            }}
          >
            Yes, reveal now
          </button>
        </div>
      )}
    </>
  );
}
