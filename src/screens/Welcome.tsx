import brand from '../../brand.config.json';
import { CalendarIcon, EnvelopeIcon, SunIcon } from '../components/icons';
import { NOT_MEDICAL_ADVICE } from '../content/copy';
import { requestPersistence } from '../lib/db';
import { useStore } from '../store';

// One screen, no quiz. She can start recording straight away and add a date later.
export function Welcome() {
  const { snap, setSettings } = useStore();
  const start = () => {
    requestPersistence();
    setSettings({ ...snap.settings, onboarded: true });
    location.hash = '#/today';
  };
  return (
    <main class="welcome" id="main">
      <div class="welcome-hero">
        <Illustration />
        <p class="brand-line">{brand.name}</p>
        <h1 class="display">Walk in with the facts.</h1>
        <p class="lede">
          A few taps a day become a clear, dated record for your next appointment. So the conversation starts from what's actually
          happening to you.
        </p>
      </div>

      <div class="wrap">
        <ol class="steps">
          <li>
            <span class="step-icon sun"><SunIcon /></span>
            <div>
              <strong>Tap, don't type</strong>
              <p>A handful of quick questions, one at a time. Skip anything. Miss days. Nothing counts against you.</p>
            </div>
          </li>
          <li>
            <span class="step-icon lilac"><EnvelopeIcon /></span>
            <div>
              <strong>Sealed until the day</strong>
              <p>Your answers stay sealed, so one bad day doesn't colour the picture. Bleeding is always shown, for your safety.</p>
            </div>
          </li>
          <li>
            <span class="step-icon peach"><CalendarIcon /></span>
            <div>
              <strong>Opens as a one-page summary</strong>
              <p>Week by week, dated, with your questions ready. Show it, print it, or hand it over.</p>
            </div>
          </li>
        </ol>

        <p class="privacy-pill">No account. Everything stays on your phone.</p>
        <button class="primary big" onClick={start}>Let's start</button>
        <p class="small center">{NOT_MEDICAL_ADVICE}</p>
      </div>
    </main>
  );
}

function Illustration() {
  return (
    <svg class="illus" viewBox="0 0 320 170" aria-hidden="true">
      <circle cx="232" cy="62" r="40" class="i-sun" />
      <path d="M0 132c52-26 96-30 150-14s104 18 170-10v62H0z" class="i-hill-back" />
      <path d="M0 150c60-18 118-16 170-4s96 10 150-6v30H0z" class="i-hill" />
      <g class="i-card" transform="rotate(-6 110 88)">
        <rect x="72" y="42" width="84" height="100" rx="12" />
        <path d="M88 70h52M88 88h52M88 106h32" />
        <circle cx="138" cy="106" r="5" class="i-dot" />
      </g>
    </svg>
  );
}
