import { useState } from 'preact/hooks';
import brand from '../../brand.config.json';
import { NOT_MEDICAL_ADVICE, URGENT_HELP } from '../content/copy';
import { needsInstallForSafety } from '../lib/platform';
import { CalendarIcon, EnvelopeIcon, MoreIcon, ShareIcon, SunIcon } from './icons';

export type Route = 'today' | 'prep' | 'record' | 'more';

const TABS: { id: Route; label: string; Icon: (p: { size?: number }) => preact.JSX.Element }[] = [
  { id: 'today', label: 'Today', Icon: SunIcon },
  { id: 'prep', label: 'Appointment', Icon: CalendarIcon },
  { id: 'record', label: 'Record', Icon: EnvelopeIcon },
  { id: 'more', label: 'You', Icon: MoreIcon },
];

export function Header() {
  return (
    <header class="top no-print">
      <span class="brand">
        <span class="brand-dot" aria-hidden="true" />
        {brand.name}
      </span>
      {brand.privateBeta && <span class="beta">Private beta</span>}
    </header>
  );
}

export function Nav({ route }: { route: Route }) {
  return (
    <nav class="tabs no-print" aria-label="Main">
      {TABS.map(({ id, label, Icon }) => (
        <a key={id} href={`#/${id}`} aria-current={route === id ? 'page' : undefined}>
          <span class="tab-pill"><Icon size={22} /></span>
          {label}
        </a>
      ))}
    </nav>
  );
}

export function Footer() {
  return (
    <footer class="foot no-print">
      <p>{NOT_MEDICAL_ADVICE}</p>
      <details>
        <summary>Need help now?</summary>
        <p>{URGENT_HELP.lead}</p>
        <ul>
          {URGENT_HELP.lines.map((l) => (
            <li key={l.href}>
              <a href={l.href} rel="noopener">{l.text}</a>
            </li>
          ))}
        </ul>
      </details>
    </footer>
  );
}

const SNOOZE_KEY = 'install-snoozed-until';
const readSnooze = () => {
  try {
    return Number(localStorage.getItem(SNOOZE_KEY) || 0);
  } catch {
    return 0;
  }
};

/**
 * On iPhone, Safari can clear a site's data after 7 days unused; Home Screen
 * apps are kept. She can snooze this for 3 days (fewer than 7) but not dismiss it.
 */
export function InstallNotice({ snoozable = true }: { snoozable?: boolean }) {
  const [hidden, setHidden] = useState(() => snoozable && readSnooze() > Date.now());
  if (!needsInstallForSafety() || hidden) return null;
  const snooze = () => {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + 3 * 86_400_000));
    } catch { /* storage blocked: just hide for now */ }
    setHidden(true);
  };
  return (
    <aside class="install">
      <strong>Keep it on your Home Screen</strong>
      <p>
        On iPhone, Safari can clear saved data from sites you haven't opened for a week. Apps on your Home Screen are kept safe.
      </p>
      <p class="how-to">
        Tap <span class="kbd">Share <ShareIcon size={16} /></span> then <span class="kbd">Add to Home Screen</span>
      </p>
      {snoozable && <button class="link" onClick={snooze}>Remind me later</button>}
    </aside>
  );
}
