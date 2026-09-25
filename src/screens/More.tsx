import { useState } from 'preact/hooks';
import brand from '../../brand.config.json';
import { InstallNotice } from '../components/chrome';
import { SCALE_FIELDS } from '../content/fields';
import { parseBackup, toBackup } from '../lib/backup';
import { formatDay, today as todayKey } from '../lib/dates';
import { useStore } from '../store';

export function More() {
  return (
    <main class="wrap" id="main">
      <h1>More</h1>
      <InstallNotice />
      <Fields />
      <Backup />
      <About />
      <Delete />
    </main>
  );
}

function Fields() {
  const { snap, setSettings } = useStore();
  const optional = SCALE_FIELDS.filter((f) => f.optional);
  const on = snap.settings.enabledOptional;
  return (
    <section class="card">
      <h2>Extra things to record</h2>
      <p class="quiet">Off by default so each day stays short. Switch on only what matters to you.</p>
      {optional.map((f) => (
        <label key={f.id} class="toggle">
          <input
            type="checkbox"
            checked={on.includes(f.id)}
            onChange={(e) =>
              setSettings({ ...snap.settings, enabledOptional: e.currentTarget.checked ? [...on, f.id] : on.filter((x) => x !== f.id) })
            }
          />
          <span>{f.label}</span>
        </label>
      ))}
    </section>
  );
}

function Backup() {
  const store = useStore();
  const { snap, setSettings } = store;
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(toBackup(snap), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `record-backup-${todayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    setSettings({ ...snap.settings, lastBackup: todayKey() });
    setMsg({ ok: true, text: 'Backup saved. Keep it somewhere safe, like Files or iCloud Drive.' });
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = parseBackup(await file.text());
      if (!confirm('Replace everything on this device with this backup?')) return;
      await store.replace(data);
      setMsg({ ok: true, text: `Restored ${data.days.length} days.` });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
  };

  return (
    <section class="card">
      <h2>Back up your record</h2>
      <p class="quiet">
        Your record lives only on this device. Nobody else has a copy, including us. A backup file lets you move it to a new phone or
        recover it if it's cleared.
        {snap.settings.lastBackup ? ` Last backup: ${formatDay(snap.settings.lastBackup)}.` : ''}
      </p>
      <div class="row">
        <button class="primary" onClick={exportFile}>Save a backup file</button>
        <label class="button">
          Restore from file
          <input type="file" accept="application/json,.json" class="visually-hidden" onChange={(e) => importFile(e.currentTarget.files?.[0])} />
        </label>
      </div>
      {msg && <p class={msg.ok ? 'ok' : 'warn'} role="status">{msg.text}</p>}
    </section>
  );
}

function About() {
  return (
    <section class="card">
      <h2>About {brand.name}</h2>
      <p>
        So much health advice for women is really about fertility. This isn't. It's here so you're seen as a whole person, not a
        single question. It helps you walk into an appointment with a dated record of your symptoms and what they're costing you,
        so the conversation starts from what's actually happening to you.
      </p>
      <h3>Why your readings are hidden</h3>
      <p>
        A single day tells you very little. Patterns show up over weeks. If you can see your trend while recording, it's easy to
        start recording towards it, or to be knocked by one bad day. So readings stay hidden until your reveal date. Bleeding is
        never hidden, for your safety: unexpected or heavy bleeding can need checking promptly, so you should always be able to
        see it.
      </p>
      <h3>Privacy</h3>
      <p>
        No account. Nothing you record leaves your device unless you choose to: by saving a backup, or copying, sharing or printing your letter or summary. We count page visits and link
        clicks without cookies, and never see anything you record.
      </p>
      <h3>What this isn't</h3>
      <p>
        It isn't medical advice and it doesn't diagnose anything. It's here to help you and your clinician talk about the same
        facts.
      </p>
    </section>
  );
}

function Delete() {
  const { wipe } = useStore();
  const [armed, setArmed] = useState(false);
  return (
    <section class="card">
      <h2>Delete everything</h2>
      <p class="quiet">Removes your whole record from this device. This can't be undone unless you have a backup file.</p>
      {armed ? (
        <div class="row">
          <button class="danger" onClick={() => wipe().then(() => (location.hash = '#/today'))}>Yes, delete it all</button>
          <button onClick={() => setArmed(false)}>Keep it</button>
        </div>
      ) : (
        <button onClick={() => setArmed(true)}>Delete my record</button>
      )}
    </section>
  );
}
