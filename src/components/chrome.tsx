import brand from '../../brand.config.json';
import { NOT_MEDICAL_ADVICE, URGENT_HELP } from '../content/copy';
import { needsInstallForSafety } from '../lib/platform';

export type Route = 'today' | 'prep' | 'record' | 'more';

const TABS: { id: Route; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '●' },
  { id: 'prep', label: 'Appointment', icon: '◆' },
  { id: 'record', label: 'Record', icon: '▤' },
  { id: 'more', label: 'More', icon: '≡' },
];

export function Header() {
  return (
    <header class="top no-print">
      <span class="brand">{brand.name}</span>
      {brand.privateBeta && <span class="beta">Private beta</span>}
    </header>
  );
}

export function Nav({ route }: { route: Route }) {
  return (
    <nav class="tabs no-print" aria-label="Main">
      {TABS.map((t) => (
        <a key={t.id} href={`#/${t.id}`} aria-current={route === t.id ? 'page' : undefined}>
          <span aria-hidden="true" class="tab-icon">{t.icon}</span>
          {t.label}
        </a>
      ))}
    </nav>
  );
}

export function Footer() {
  return (
    <footer class="foot no-print">
      <p class="nma">{NOT_MEDICAL_ADVICE}</p>
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

function ShareIcon() {
  return (
    <svg class="share-icon" viewBox="0 0 16 20" width="12" height="15" aria-hidden="true">
      <path d="M8 1v11M4.5 4.5 8 1l3.5 3.5M5 8H2v11h12V8h-3" fill="none" stroke="currentColor" stroke-width="1.6" />
    </svg>
  );
}

export function InstallNotice({ compact }: { compact?: boolean }) {
  if (!needsInstallForSafety()) return null;
  return (
    <aside class="notice install">
      <strong>Keep your record safe on iPhone</strong>
      {!compact && (
        <p>
          Safari can clear a website's saved data if you don't open it for 7 days. Apps on your Home Screen are kept.
        </p>
      )}
      <p>
        Tap <span class="kbd">Share <ShareIcon /></span> then <span class="kbd">Add to Home Screen</span>, and
        open it from there.
      </p>
    </aside>
  );
}
