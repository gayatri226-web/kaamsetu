# KaamSetu · नाका से नौकरी तक

Team Dhanur Dhaari · Artemis 2026 (Problem Statement 2: Beyond the Waiting Line)

A website for daily-wage workers at labour nakas: find fair work, get a verified work card without a résumé, confirm every job with a Kaam Parchi, and reach welfare schemes. Works in Hindi, Marathi and English, with read-aloud everywhere.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build in dist/
npm run build:single # one self-contained HTML file in dist-single/
```

Optional real AI answers in Setu Saathi: copy `.env.example` to `.env` and add a Gemini key. Without it, Setu Saathi uses built-in answers (safer for the demo).

## Screens (all share one browser state, so a job posted as employer shows up for the worker)

| Route | Screen |
|---|---|
| `#/` | Landing, role choice, language |
| `#/onboard` | Tap-only onboarding: trade, years, naka (or location), photos, name → Setu number |
| `#/w` | Worker feed: week (Hafta), "I'm at the naka" check-in, filters, scam flags, fair rate, nearby map, read-aloud |
| `#/w/parchi` | Slips + dues summary (earned / received / due) |
| `#/w/parchi/:id` | Kaam Parchi: confirm with stamp, daily work log, WhatsApp share, "Not paid" flow |
| `#/w/card` | Work card: Setu number, trust ladder, DigiLocker consent mock, skills, photos |
| `#/w/rights` | Scheme finder (4 taps), document cards with pictures, grievance steps, helpline |
| `#/w/saathi` | Setu Saathi: tap-chips, voice input, job safety check |
| `#/e` | Employer: AI quick post, trade tiles, fair-rate check, location, find worker by Setu number, workers at naka |
| `#/e/jobs` | Employer jobs: confirm attendance, mark paid, complete and rate (updates worker card) |
| `#/admin` | Admin: flagged listings, unpaid-wage reports, employer verification |

"Reset demo" in the worker sidebar restores the sample data.

## 2-minute demo script

1. Landing → **काम ढूंढो**. Tap **मैं नाके पर हूँ**.
2. Point at the caution-taped scam card → **सेतु साथी से पूछें** → three reasons with icons → **रिपोर्ट करें**.
3. **2BHK पेंटिंग → काम लें** → Kaam Parchi → **हाँ, पक्का करें** (stamp) → back to feed: those days are booked, clashing jobs vanish.
4. Switch to employer (`#/e/jobs`) → rate 5 stars → **Complete job** → worker card shows 24 jobs.
5. `#/w/parchi` → old slip with ₹850 due → **शिकायत दर्ज करें** → appears in `#/admin`.
6. `#/w/rights` → 4 taps → e-Shram, PM-SYM, BOCW with document pictures. Switch language to मराठी.

## Notes

- Mock data around Ghatkopar; distances use real coordinates. Geolocation uses the browser API (no key). For real map tiles, swap `MapView` for Leaflet + OpenStreetMap.
- Fair rates are mock; in production: state minimum-wage notification + median of completed Kaam Parchis.
- Scheme eligibility is a simplified estimate, shown as such in the app.
