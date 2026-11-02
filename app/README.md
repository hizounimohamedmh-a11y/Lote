# Lote: the app

A full German-training web app for people who want to work in Germany. It works on phones and computers.

## What's inside

| Feature | What learners get |
|---|---|
| **Today** | A daily plan built from their goal (e.g. 3 hours), plus a streak, minutes studied and a "path to B1" progress bar |
| **AI speaking partner** | 10 real-life role-plays (job interview, shift handover, immigration office…). They speak into the mic, the partner answers out loud and corrects mistakes. |
| **Words** | 225 flashcards in 9 decks, including nursing, care, trades and IT. Spaced repetition decides when each card comes back. |
| **Grammar** | 10 lessons from A1 to B1 with practice (multiple choice, fill-in, word order) |
| **Writing** | 6 exam-style tasks. AI gives a score out of 100, scores per criterion, corrections and an improved version. |
| **Mock exams** | Timed reading and listening exams in the Goethe/telc style, graded on the server |
| **Live classes** | Schedule by level, a one-click join button, and attendance that counts toward the daily plan |
| **Progress** | 28-day chart, time per activity, exam and writing history |
| **Account** | Profile, level, daily goal, exam date, and subscription management |
| **Admin** (first account only) | Users, paying subscribers, estimated monthly revenue, weekly activity, and the meeting links for live classes |
| **Payments** | Stripe subscription at €149/month, a 7-day free trial, then a paywall |

Time is tracked automatically while learners are actively using a section. A joined live class counts as one hour.

## Run it on your computer

You need [Node.js 22.5 or newer](https://nodejs.org).

```bash
cd app
npm install
cp .env.example .env      # then add your ANTHROPIC_API_KEY
npm run build
npm start                 # open http://localhost:3001
```

The **first account you create becomes the admin**, so create yours first.

For development with live reload: `npm run dev` (open http://localhost:5173).

Run the tests: `npm test`

## Settings (`.env`)

| Variable | Needed? | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | For AI features | Turns on the speaking partner and writing feedback. Get a key at console.anthropic.com. |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` | To charge money | Without them, the app is free for everyone (good for testing with first users). |
| `PUBLIC_URL` | In production | Your web address, e.g. `https://lote.app` |
| `LIVE_CLASS_URL` | Optional | Default meeting link. You can set a link per class in Account → Admin instead. |
| `TRIAL_DAYS` | Optional | Free trial length (default 7) |
| `DAILY_AI_LIMIT` | Optional | AI messages per learner per day (default 200), to keep costs predictable |

## Set up payments (Stripe)

1. Create a Stripe account and a **Product** "Lote Standard" with a **recurring price of €149/month**. Copy the price ID (`price_…`) into `STRIPE_PRICE_ID`.
2. Copy your secret key (`sk_…`) into `STRIPE_SECRET_KEY`.
3. In Stripe → Developers → Webhooks, add the endpoint `https://YOUR-DOMAIN/api/billing/webhook` with the events `customer.subscription.created`, `customer.subscription.updated` and `customer.subscription.deleted`. Copy the signing secret (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.
4. In Stripe → Settings → Billing → Customer portal, turn the portal on so subscribers can cancel or change their card.

## Put it online

**Easiest: Render (about $7/month incl. a disk for the database).**

1. Create a free account at [render.com](https://render.com) and sign in with GitHub.
2. Click **New → Blueprint**, pick the `lote` repository and branch. Render reads `render.yaml` from the repo.
3. Fill in `ANTHROPIC_API_KEY` (and the Stripe keys when you're ready to charge). Leave the others empty for now.
4. Click **Apply**. After a few minutes you get an address like `https://lote-xxxx.onrender.com`. Open it and create your account first (it becomes the admin).
5. Put that address in `PUBLIC_URL`. Later you can connect your own domain in Render's settings.

**Demo build (no server):** `npm run build:demo` writes `dist-demo/lote-demo.html`, a single file that runs the whole app in the browser with progress saved per visitor. Useful for showing people the product; the real app above is what you sell.

**Other hosts:**

The app is one Node server with a SQLite database file, so any host with a **persistent disk** works.

**Docker (Railway, Render, Fly.io, a VPS…):**

```bash
docker build -t lote .
docker run -p 3001:3001 -v lote-data:/data --env-file .env lote
```

Mount a persistent volume at `/data`, or you'll lose your users on every deploy. Back up `/data/lote.db` regularly.

## Running costs (rough)

- **AI:** every spoken sentence is one request. A learner who really does 45 minutes of AI speaking every day, on the default model (`claude-opus-5-5`), can cost roughly €10–25 a month. Most learners use less. To roughly halve it, set `LOTE_MODEL=claude-sonnet-5-5`. `DAILY_AI_LIMIT` caps the worst case. Check the real numbers in your Anthropic console after the first weeks.
- **Hosting:** €5–20/month for the first few hundred users.
- **Teachers:** the biggest cost. See `../PLAN.md`.

## How the code is organised

```
app/
  shared/content.js   all learning content: vocabulary, lessons, scenarios, writing tasks, exams, class schedule
  server/             Express API, SQLite database, auth, AI tutor, Stripe billing, progress logic
  src/                React web app (pages in src/pages)
```

Adding content needs no database changes. Edit `shared/content.js`, rebuild and restart.

## Next things to build

- Translate the interface into the learners' languages (Arabic, French, English, Hindi…)
- Password reset by email
- More content: B2 lessons, more mock exams, more scenarios per profession
- Agency dashboard: let a recruitment agency see their candidates' progress (for the €129/seat deals in the plan)
- Mobile app wrapper (the web app already works well on phones; it can be wrapped as an app later)
