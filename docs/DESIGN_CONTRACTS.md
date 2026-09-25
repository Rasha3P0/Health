# Design contracts

These are rules the app is built to keep. Break one only on purpose.

## 1. Every field has a contract, and only slow quality-of-life readings are blind

`src/content/fields.ts` gives each field one of two contracts:

- **blind**: 1–5 quality-of-life scales. Hidden until the reveal date.
- **visible**: anything that could need acting on. Never hidden, always shown with a signpost.

Bleeding is visible. Anything added later that has a threshold for action (blood pressure, doses, medication adherence, red-flag symptoms) must also be `visible`. `tests/core.test.ts` enforces that bleeding is visible and that only scales can be blind.

## 2. The blind holds until the reveal date

- She can see and edit today and yesterday while she's entering them. Past readings can't be browsed.
- Before the reveal date, the Record screen shows *that* she logged on a day (a dot), never *what* she logged.
- She can bring the reveal forward, after one plain confirmation ("this reveals your record now"). A period that has been revealed can't be hidden again.
- A new period starts the day after the last reveal, so no logged day is ever left outside a period.

## 3. It never punishes her for being ill

- There are no streaks, scores or ranks.
- A missed day is never mentioned. The copy says so: "Missed days don't matter."
- The weekly card appears for the current week only. If she skips it, it silently goes away.
- There are no notifications in this build. If reminders are added later, they can nudge the log but must never count or shame.
- Two ignored weeks must break nothing: the period and the reveal still work, and the sheet shows the gaps honestly.

## 4. Taps, never prose

Every input is a tap. There are no text boxes anywhere, not even "notes". Prose asks her to appraise herself, and prose is what stops people filling in logs. The sheet has a lined "Notes from the appointment" space for pen and paper.

## 5. One direction, no decoding

Every scale runs 1 = "Not at all" to 5 = "Very much", so there is nothing to work out on a foggy day. Tapping a selected value again clears it.

## 6. Descriptive, never interpretive

The summary is counts and averages of what she recorded. It never suggests a cause, diagnosis or treatment. "Most affected" is simply the highest averages, and only includes fields with at least 7 readings.

## 7. Nothing leaves the device

There is no account, no server and no sync. The only way data leaves is a backup file she saves herself. Analytics, if switched on, is cookieless and counts page views and outbound clicks only.

## 8. On iPhone, Home Screen is not optional

If a site isn't opened for 7 days, Safari can clear its storage. Home Screen apps are exempt. So the app asks for install on first run and on the Today screen, calls `navigator.storage.persist()`, and offers backup export/import.

## 9. ND-aware

- Taps only, with large targets (48px or more).
- The day is short: 7 scales by default, with optional fields off.
- There's a calm palette, dark mode, and support for reduced motion.
- The "what helps me" list lets her put accommodations (written plan, time to answer, masking) on paper, so she doesn't have to say them out loud.
