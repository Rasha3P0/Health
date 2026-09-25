import { createContext } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useState } from 'preact/hooks';
import * as db from './lib/db';
import { addDays, isoWeek, today as todayKey, type DayKey } from './lib/dates';
import type { DayEntry, Period, Prep, Settings, Snapshot } from './lib/types';

// App state: the whole record is small, so it is loaded into memory once and
// every change is written straight through to IndexedDB.

interface Store {
  snap: Snapshot;
  today: DayKey;
  yesterday: DayKey;
  setScale(date: DayKey, field: string, value: number | undefined): void;
  setBleeding(date: DayKey, value: string | undefined): void;
  finishDay(date: DayKey): void;
  setWeekChanges(changes: string[]): void;
  setPeriods(periods: Period[]): void;
  setPrep(prep: Prep): void;
  setSettings(settings: Settings): void;
  replace(s: Snapshot): Promise<void>;
  wipe(): Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('Store not ready');
  return s;
}

function useToday(): DayKey {
  const [t, setT] = useState(todayKey());
  useEffect(() => {
    // Roll over at midnight, and when she comes back to the app the next day.
    const tick = () => setT(todayKey());
    const id = setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
  return t;
}

export function StoreProvider({ children }: { children: preact.ComponentChildren }) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = useToday();
  const yesterday = addDays(today, -1);

  useEffect(() => {
    db.loadAll().then(setSnap, () => setError("Your record couldn't be opened on this device. Private browsing can block storage."));
  }, []);

  const updateDay = useCallback(
    (date: DayKey, change: (d: DayEntry) => DayEntry) => {
      setSnap((s) => {
        if (!s) return s;
        const existing = s.days.find((d) => d.date === date);
        const base: DayEntry = existing ?? { date, scales: {}, savedAt: '', late: date !== todayKey() };
        const next = { ...change({ ...base, scales: { ...base.scales } }), savedAt: new Date().toISOString() };
        db.putDay(next);
        return { ...s, days: [...s.days.filter((d) => d.date !== date), next] };
      });
    },
    [],
  );

  const store = useMemo<Store | null>(() => {
    if (!snap) return null;
    return {
      snap,
      today,
      yesterday,
      setScale: (date, field, value) =>
        updateDay(date, (d) => {
          if (value === undefined) delete d.scales[field];
          else d.scales[field] = value;
          return d;
        }),
      setBleeding: (date, value) => updateDay(date, (d) => ({ ...d, bleeding: value })),
      finishDay: (date) => updateDay(date, (d) => ({ ...d, finished: true })),
      setWeekChanges: (changes) => {
        const week = isoWeek(today);
        const entry = { week, changes, savedAt: new Date().toISOString() };
        db.putWeek(entry);
        setSnap((s) => s && { ...s, weeks: [...s.weeks.filter((w) => w.week !== week), entry] });
      },
      setPeriods: (periods) => {
        db.putKv('periods', periods);
        setSnap((s) => s && { ...s, periods });
      },
      setPrep: (prep) => {
        db.putKv('prep', prep);
        setSnap((s) => s && { ...s, prep });
      },
      setSettings: (settings) => {
        db.putKv('settings', settings);
        setSnap((s) => s && { ...s, settings });
      },
      replace: async (s) => {
        await db.replaceAll(s);
        setSnap(s);
      },
      wipe: async () => {
        await db.wipe();
        setSnap(await db.loadAll());
      },
    };
  }, [snap, today, yesterday, updateDay]);

  if (error) return <main class="wrap"><p class="notice">{error}</p></main>;
  if (!store) return <main class="wrap" aria-busy="true" />;
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}
