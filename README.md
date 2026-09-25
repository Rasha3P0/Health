# Working Title — women's health record (private beta)

A free, installable web app (PWA) for UK women. The first build is a **tap-only symptom log that stays hidden until the appointment date, then becomes a one-page dated summary** to take into the appointment.

First users: a private network via shared link, mostly on iPhone Safari. It's hidden from search engines.

## What it does

| Screen | What she does |
| --- | --- |
| **Today** | Rates 7 things from 1 to 5 (3 more optional), plus bleeding. Can log today or yesterday. Everything is skippable. |
| **Appointment** | Sets the reveal date (usually the appointment) and ticks goals, questions and "what helps me" items. |
| **Record** | Before the reveal date: dots for the days she logged, never the values. On the reveal date: a printable summary sheet. |
| **More** | Optional fields, backup export/import, about/privacy, delete everything. |

The design rules this build follows are in [docs/DESIGN_CONTRACTS.md](docs/DESIGN_CONTRACTS.md).

## Settings

- **Brand name**: edit `brand.config.json` (`name`, `shortName`, `tagline`, colours). This one file drives the page title, the manifest, the Home Screen name and the in-app copy.
- **Analytics**: `analytics.provider` is `"none"` or `"plausible"`, plus `domain`. Plausible is cookieless. The hash variant counts screen changes as page views, and the outbound-links variant counts external clicks. Nothing she logs is ever sent.
- **Search engines**: while `privateBeta: true`, a noindex meta tag is added. `public/robots.txt` and `public/_headers` also block indexing; edit those by hand when going public.

## Develop

```sh
npm install
npm run dev        # local dev server
npm test           # unit tests (dates, the blind, field contracts, summary, backup)
npm run build      # typecheck + production build into dist/
npm run icons      # re-render PNG icons from public/icons/icon.svg (needs Playwright)
```

Stack: Vite, Preact, TypeScript. Data is stored in IndexedDB on the device. The service worker is hand-written and generated at build time (see `vite.config.ts`). There are no runtime dependencies besides Preact.

## Deploy

Hosted on **Vercel**: import the GitHub repo once and every push to `main` redeploys. `vercel.json` sets the build (`npm run build` → `dist/`) and the noindex/privacy headers. Pull requests get their own preview URL.

`dist/` is a plain static site, so it also runs elsewhere: Netlify and Cloudflare Pages read `public/_headers` instead. On any other host, set `X-Robots-Tag: noindex` yourself.

## Before going public

Every health-adjacent line is listed in [docs/CONTENT_REVIEW.md](docs/CONTENT_REVIEW.md). All of it is draft until it has been checked against current NHS guidance and reviewed by a clinician.
