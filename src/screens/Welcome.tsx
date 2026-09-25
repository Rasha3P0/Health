import brand from '../../brand.config.json';
import { InstallNotice } from '../components/chrome';
import { NOT_MEDICAL_ADVICE } from '../content/copy';
import { requestPersistence } from '../lib/db';
import { useStore } from '../store';

// One screen, no quiz. She can start recording straight away and set a date later.
export function Welcome() {
  const { snap, setSettings } = useStore();
  const start = () => {
    requestPersistence();
    setSettings({ ...snap.settings, onboarded: true });
    location.hash = '#/today';
  };
  return (
    <main class="wrap welcome" id="main">
      <h1>{brand.name}</h1>
      <p class="lede">{brand.tagline}</p>

      <ol class="how">
        <li>
          <strong>A minute a day, taps only.</strong> Rate a few things from 1 to 5. Skip anything, skip days. Nothing counts
          against you.
        </li>
        <li>
          <strong>Your readings stay hidden</strong> until your appointment date, so one bad day doesn't colour the picture and you
          can't record towards a trend. Bleeding is always shown.
        </li>
        <li>
          <strong>On the day, you get a one-page summary</strong>: week by week, dated, with what else changed and the questions you
          want to ask.
        </li>
      </ol>

      <p class="quiet">Everything stays on this phone. No account, no sign-up.</p>
      <InstallNotice />
      <button class="primary big" onClick={start}>Start</button>
      <p class="small">{NOT_MEDICAL_ADVICE}</p>
    </main>
  );
}
