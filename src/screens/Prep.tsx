import { useState } from 'preact/hooks';
import { MultiChoice } from '../components/controls';
import { ChevronIcon, EnvelopeIcon } from '../components/icons';
import { hasLetterContent } from '../lib/letter';
import { GOALS, NEEDS, QUESTIONS } from '../content/prep';
import { currentPeriod, nextPeriodStart } from '../lib/blind';
import { daysBetween, formatDay } from '../lib/dates';
import type { Period } from '../lib/types';
import { useStore } from '../store';

const KINDS: { id: Period['kind']; label: string }[] = [
  { id: 'gp', label: 'GP' },
  { id: 'nurse', label: 'Nurse' },
  { id: 'specialist', label: 'Specialist' },
  { id: 'other', label: 'Other' },
  { id: 'review', label: 'No appointment yet, just a review date' },
];

export function Prep() {
  const { snap, setPrep } = useStore();
  const { prep } = snap;
  return (
    <main class="wrap" id="main">
      <h1>Your appointment</h1>
      <RevealDate />

      <section class="card">
        <h2>What do you want from it?</h2>
        <p class="quiet">Pick any. These go at the top of your summary sheet.</p>
        <MultiChoice stacked label="What I want from this appointment" options={GOALS} value={prep.goals} onChange={(goals) => setPrep({ ...prep, goals })} />
      </section>

      <section class="card">
        <h2>Questions you might ask</h2>
        <p class="quiet">Ten minutes goes fast. Pick two or three that matter most.</p>
        <MultiChoice stacked label="Questions to ask" options={QUESTIONS} value={prep.questions} onChange={(questions) => setPrep({ ...prep, questions })} />
      </section>

      <section class="card">
        <h2>What helps you in appointments</h2>
        <p class="quiet">Optional. Only what you're comfortable sharing. It goes on the sheet so you don't have to say it out loud.</p>
        <MultiChoice stacked label="What helps me" options={NEEDS} value={prep.needs} onChange={(needs) => setPrep({ ...prep, needs })} />
      </section>

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

function RevealDate() {
  const { snap, today, setPeriods } = useStore();
  const period = currentPeriod(snap.periods, today);
  const [date, setDate] = useState(period?.revealOn ?? '');
  const [kind, setKind] = useState<Period['kind']>(period?.kind ?? 'gp');
  const [confirmEarly, setConfirmEarly] = useState(false);

  const firstLogged = [...snap.days].map((d) => d.date).sort()[0];
  const start = period?.start ?? nextPeriodStart(snap.periods, firstLogged, today);
  const revealsNow = !!date && date <= today;
  const invalid = !!date && date < start;
  const unchanged = period && period.revealOn === date && period.kind === kind;

  const save = () => {
    if (!date || invalid) return;
    if (revealsNow && !confirmEarly) {
      setConfirmEarly(true);
      return;
    }
    const next: Period = period ? { ...period, revealOn: date, kind } : { id: crypto.randomUUID(), start, revealOn: date, kind };
    setPeriods([...snap.periods.filter((p) => p.id !== next.id), next]);
    setConfirmEarly(false);
    if (revealsNow) location.hash = '#/record';
  };

  return (
    <section class="card">
      <h2>{period ? 'Reveal date' : 'When is it?'}</h2>
      <p class="quiet">
        Your readings stay hidden until this date, then become a one-page summary you can show or print. Most patterns take a few
        weeks to show, so four to eight weeks of recording is a good aim.
      </p>
      <label class="stack">
        <span>Date</span>
        <input type="date" value={date} min={start} onInput={(e) => { setDate(e.currentTarget.value); setConfirmEarly(false); }} />
      </label>
      {date && !invalid && !revealsNow && (
        <p class="quiet">{daysBetween(today, date)} days from today · covers from {formatDay(start)}</p>
      )}
      {invalid && <p class="warn">That's before your recording started ({formatDay(start)}).</p>}

      <fieldset class="field">
        <legend><span class="field-label">Who with</span></legend>
        <div class="chips">
          {KINDS.map((k) => (
            <button key={k.id} type="button" class={`chip${kind === k.id ? ' on' : ''}`} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
              {k.label}
            </button>
          ))}
        </div>
      </fieldset>

      {confirmEarly && (
        <div class="notice" role="alert">
          <p>
            <strong>This reveals your record now.</strong> Once you've seen it, the readings from this stretch can't be hidden again.
            That's fine if the appointment is today or soon.
          </p>
        </div>
      )}
      <button class="primary" disabled={!date || invalid || !!unchanged} onClick={save}>
        {confirmEarly ? 'Yes, reveal now' : period ? 'Update date' : 'Save date'}
      </button>
    </section>
  );
}
