# ResumeForge

AI-powered ATS resume builder. Build ATS-safe resumes, score them against real job descriptions, rewrite bullets with AI, and export polished PDFs — with a job tracker, cover letters, and share analytics.

## Features

- **Resume builder** — live preview, 4 templates (Modern, Classic, Minimal, Compact), 7 font families, accent colors, autosave, version history, drag-free editing.
- **ATS scoring** — paste a job description and get a 0–100 score with matched/missing keyword chips, formatting flags, and per-category breakdowns.
- **AI assistance** — rewrite bullets, generate summaries, and write cover letters. Uses Anthropic Claude when `ANTHROPIC_API_KEY` is set, otherwise falls back to a deterministic local engine (fully offline).
- **Exports & import** — PDF, DOCX, TXT, and email-as-PDF export; import existing resumes from PDF/DOCX and auto-structure them.
- **Job tracker** — kanban board with applied/interview/offer/rejected/withdrawn stages and per-application notes.
- **Share links** — public resume pages with view tracking (`/s/{slug}`).
- **Billing** — Stripe Checkout + webhooks; Free vs Pro plan gating.
- **Auth** — email/password (JWT cookie session) plus Google & GitHub OAuth (PKCE).

## Quick start (local)

```bash
npm install
cp .env.example .env          # set DATABASE_URL to Postgres + AUTH_SECRET
npx prisma migrate dev        # create tables from migrations
npm run db:seed               # demo user: demo@resumeforge.app / demo1234
npm run dev                   # http://localhost:3000
```

`DATABASE_URL` should point at PostgreSQL — use a local instance, Docker, or a free Neon/Supabase database. The app runs fully without third-party keys; add `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, Stripe, and OAuth keys whenever you're ready.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build (Turbopack) |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run test` | Vitest |
| `npm run ci` | lint + typecheck + test + build |
| `npm run db:push` / `db:migrate` | Prisma schema push / migrate |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |

## Environment variables

All documented in [`.env.example`](.env.example). Every optional integration degrades gracefully:

- `AUTH_SECRET` (required) — JWT signing secret for sessions.
- `DATABASE_URL` (required) — PostgreSQL connection string (Neon/Supabase/local).
- `ANTHROPIC_API_KEY` — enables Claude-powered AI. Without it, the local engine runs.
- `RESEND_API_KEY` — transactional email. Without it, emails log to the console.
- `STRIPE_*` — payments. Without keys, Pro gating is unlocked for development.
- `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` — OAuth login.
- `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` — Stripe price used by checkout.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API reference](docs/API.md)

## Tech stack

- **Next.js 16** (App Router, Turbopack, Server Actions, `src/proxy.ts` middleware)
- **React 19**, TypeScript, Tailwind CSS v4
- **Prisma 7** + PostgreSQL via driver adapters (`@prisma/adapter-pg`)
- **Auth** — custom JWT (jose) + PKCE OAuth; **AI** — Anthropic SDK; **PDF** — @react-pdf/renderer; **Payments** — Stripe
