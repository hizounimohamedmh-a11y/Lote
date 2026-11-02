# GreenLight

**Should you train today? Know in 30 seconds.**

A phone web app that gives athletes (and anyone who trains) a daily **green / yellow / red** signal and a plan for the day. No watch or strap needed: the phone camera watches how your body moves today and compares it with your own normal.

## How a check works

1. **Three taps:** sleep, energy, yesterday's load.
2. **Body map:** tap anything sore (1 tap stiff, 2 sore, 3 painful). Sore spots trigger five safety questions: sharp pain, swelling, pain at rest, numbness, or an impact.
3. **30-second movement scan:** the phone tracks 33 body points live (MediaPipe, on-device), with a voice coach and countdowns:
   - 3 squats: depth, left/right difference, knees caving in
   - balance on each leg: wobble and how often the foot goes down
   - arms overhead: reach per side
4. **Your light:** a score from 0 to 100, the color, *why* (every factor and its points), what to avoid, and a checklist plan built for your sport and sore spots. An optional AI coach note explains it in plain words.

After 2 scans, GreenLight compares you with **your own** normal (median of your last 10 scans). Before that it compares your left and right sides.

**Safety rules:** any red-flag answer means **red** and "see a doctor or physio". Two painful spots mean red. Any sore spot means it's never green. GreenLight gives training guidance, not a diagnosis.

**Privacy:** video never leaves the phone. Only the measurements (angles, wobble) are saved.

## Features

| | |
|---|---|
| **Today** | Tap-to-check orb, result reveal, plan with checkboxes, "share my light" story image (1080×1920) for Instagram/TikTok |
| **History** | Streak, color calendar, score chart, movement trends vs your average, the spots that keep hurting |
| **Team** | Coaches create a team and share a 6-letter code. The dashboard shows every player's light, score and sore spots today, worst first, and flags anyone who needs a physio. Players' video and answers stay private. |
| **You** | Profile, sport, plan and billing, privacy, delete account. Admin stats for the first account. |
| **Plans** | Free: daily light, score, headline, 7 days of history. **Pro €7.99/month:** full plan, the "why", AI coach, all history and trends. **Team €29/month:** coach dashboard. New users get 14 days of Pro free. |

Works on phones (installable from the browser menu: "Add to Home Screen") and desktop, in dark and light mode.

## Run locally

Needs Node.js 22.5+.

```bash
cd greenlight
npm install
cp .env.example .env     # optional: ANTHROPIC_API_KEY for the coach note
npm run build
npm start                # http://localhost:3002
```

The camera needs **https** or **localhost**. The first account becomes the admin.

Tests: `npm test` (scoring engine plus API: 17 tests).

## Put it online (Render, about $7/month)

1. Sign up at [render.com](https://render.com) with GitHub.
2. **New → Blueprint**, pick this repository and branch. Render reads `render.yaml` at the repo root.
3. Optionally paste `ANTHROPIC_API_KEY` (for the AI coach note). Leave the Stripe fields empty to start. Everything is free until you add them.
4. **Apply.** In a few minutes you get `https://greenlight-xxxx.onrender.com`. Open it on your phone and create your account first.

**Payments:** in Stripe, create two monthly prices (Pro €7.99, Team €29). Put their IDs in `STRIPE_PRICE_PRO` and `STRIPE_PRICE_TEAM`, plus `STRIPE_SECRET_KEY`. Add a webhook to `https://YOUR-DOMAIN/api/billing/webhook` for `customer.subscription.created/updated/deleted` and copy its secret into `STRIPE_WEBHOOK_SECRET`. Turn on the Customer Portal.

## Code map

```
greenlight/
  shared/scoring.js    movement metrics, baseline, readiness score, safety rules, daily plan (pure, tested)
  shared/content.js    sports, body regions, 33 exercises, warm-ups, safety questions
  server/              Express + SQLite API: auth, checks, teams, billing, AI coach note
  src/pose.js          on-device body tracking (MediaPipe) and skeleton drawing
  src/components/      Scan (guided camera), BodyMap, Result
  src/pages/           Welcome, Onboarding, Home, Check, History, Team, Account
  public/models/       pose model (served by the app itself)
```

## Before you promise accuracy

The scoring rules are sensible and transparent, but they have **not been tested against real injury data yet**. Run it with a few teams for some weeks. Compare reds and yellows with what actually happened (missed sessions, injuries), then tune the thresholds in `shared/scoring.js`. Until then, market it as "know your body today", not "prevents injuries".

## Next

- Pickup game finder: "You're green. 3 games near you tonight."
- Push reminders each morning
- More scan moves (hop test, lunge) and sport-specific checks
- Wrap as an App Store / Play Store app
