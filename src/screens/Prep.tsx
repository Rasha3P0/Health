import { useState } from 'preact/hooks';
import { MultiChoice, SingleChips } from '../components/controls';
import { ChevronIcon, EnvelopeIcon } from '../components/icons';
import { hasLetterContent } from '../lib/letter';
import { CONTRACEPTION, DURATION, GET_BACK, GOALS, IMPACT, LAST_PERIOD, MEDICATION, MOTHER_AGE, NEEDS, QUESTIONS } from '../content/prep';
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
        <h2>What is this getting in the way of?</h2>
        <p class="quiet">This goes near the top of your letter. It's what your symptoms are costing you, in your terms.</p>
        <MultiChoice label="What it's affecting" options={IMPACT} value={prep.impact} onChange={(impact) => setPrep({ ...prep, impact })} />
        <h3>What would you most like to get back to?</h3>
        <p class="quiet">Pick one. Your letter opens with it.</p>
        <SingleChips label="What I'd like to get back to" options={GET_BACK} value={prep.getBackTo} onChange={(getBackTo) => setPrep({ ...prep, getBackTo })} />
      </section>

      <details class="card background">
        <summary>
          <span>
            <strong>A little background</strong>
            <span class="quiet block">Optional. Saves time in the room. Anything you skip stays out of the letter.</span>
          </span>
        </summary>
        <h3>How long has this been going on?</h3>
        <SingleChips label="How long" options={DURATION} value={prep.duration} onChange={(duration) => setPrep({ ...prep, duration })} />
        <h3>When was your last period?</h3>
        <SingleChips label="Last period" options={LAST_PERIOD} value={prep.lastPeriod} onChange={(lastPeriod) => setPrep({ ...prep, lastPeriod })} />
        <h3>Contraception</h3>
        <p class="quiet">Answering here can stop it taking up appointment time.</p>
        <SingleChips label="Contraception" options={CONTRACEPTION} value={prep.contraception} onChange={(contraception) => setPrep({ ...prep, contraception })} />
        <h3>Medication</h3>
        <SingleChips label="Medication" options={MEDICATION} value={prep.medication} onChange={(medication) => setPrep({ ...prep, medication })} />
        <h3>About what age did your mother's periods stop, if you know?</h3>
        <SingleChips label="Mother's periods stopped" options={MOTHER_AGE} value={prep.motherAge} onChange={(motherAge) => setPrep({ ...prep, motherAge })} />
      </details>

      <section class="card">
        <h2>What do you want from it?</h2>
        <p class="quiet">Pick any. The more specific, the better.</p>
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
