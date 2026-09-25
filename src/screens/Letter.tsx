import { useState } from 'preact/hooks';
import { BackIcon, ShareIcon } from '../components/icons';
import { activeScaleFields, SCALE_FIELDS } from '../content/fields';
import { currentPeriod, revealedPeriods } from '../lib/blind';
import { buildLetter, hasLetterContent, letterToText } from '../lib/letter';
import { buildSummary } from '../lib/summary';
import { useStore } from '../store';

export function LetterScreen() {
  const { snap, today } = useStore();
  const [status, setStatus] = useState<string | null>(null);

  // Current sealed period if there is one; otherwise the most recently opened one.
  const current = currentPeriod(snap.periods, today);
  const lastRevealed = revealedPeriods(snap.periods, today)[0];
  const period = current ?? lastRevealed;
  const withData = new Set(snap.days.flatMap((d) => Object.keys(d.scales)));
  const fields = SCALE_FIELDS.filter((f) => withData.has(f.id) || activeScaleFields(snap.settings.enabledOptional).includes(f));
  const summary = !current && lastRevealed ? buildSummary(lastRevealed, snap.days, snap.weeks, fields) : undefined;
  const letter = buildLetter({ prep: snap.prep, today, period, summary });
  const text = letterToText(letter);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Copied. Paste it into your GP practice’s online form, an email or the NHS App.');
    } catch {
      setStatus('Copying was blocked. Try Share instead, or select the text and copy it.');
    }
  };
  const share = async () => {
    try {
      await navigator.share({ text });
    } catch { /* she closed the share sheet */ }
  };

  return (
    <main class="wrap" id="main">
      <a class="back no-print" href="#/prep"><BackIcon size={18} /> Appointment</a>
      <h1 class="no-print">Your letter</h1>

      {!hasLetterContent(snap.prep) ? (
        <section class="card no-print">
          <p>Pick what you'd like to discuss on the Appointment page and your letter builds itself here.</p>
          <a class="button primary" href="#/prep">Choose what to discuss</a>
        </section>
      ) : (
        <>
          <p class="quiet no-print">
            Written from your choices. Hand it over, print it, or paste it into your GP practice's online form before the appointment.
          </p>
          <div class="row no-print letter-actions">
            <button class="primary" onClick={copy}>Copy text</button>
            {'share' in navigator && <button onClick={share}><ShareIcon size={18} /> Share</button>}
            <button onClick={() => window.print()}>Print</button>
          </div>
          {status && <p class="ok no-print" role="status">{status}</p>}

          <article class="letter" aria-label="Letter to your clinician">
            <p>{letter.greeting}</p>
            {letter.sections.map((s, n) => (
              <section key={n}>
                {s.heading && <h2>{s.heading}</h2>}
                {s.text && <p>{s.text}</p>}
                {s.bullets && <ul>{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
              </section>
            ))}
            <p class="sign">{letter.closing}</p>
            <div class="fill">
              <span>Name</span>
              <span>Date of birth</span>
              <span>NHS number (if you know it)</span>
            </div>
          </article>
        </>
      )}
    </main>
  );
}
