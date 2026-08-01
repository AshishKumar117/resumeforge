# ResumeForge — Architecture

This document describes how the app is organized and how the pieces fit together.

## High level

```
src/
  app/                    # Next.js App Router
    (marketing)/          # Public marketing pages (/, /pricing, /templates, /privacy, /terms)
    (app)/                # Authenticated dashboard group (sidebar layout)
      dashboard/          # Resume list + usage stats
      resume/[id]/        # Resume builder (server page → <Builder> client)
      resume/import/      # PDF/DOCX import flow
      tracker/            # Job application kanban
      cover-letters/      # Cover letter list/generate/edit
      settings/           # Profile, password, plan, delete account
      billing/            # Plan status + upgrade/manage billing
    s/[slug]/             # Public share page
    api/                  # Route handlers (auth, ai, ats, export, email, import, share, stripe)
  actions/                # Server Actions (auth, resume, share, tracker, cover-letters)
  components/             # UI + feature components (builder/, dashboard/, marketing/, etc.)
  lib/                    # Business logic, auth, AI, email, export, gating, validation
  proxy.ts                # Middleware-equivalent (route protection, redirects)
  generated/prisma/       # Generated Prisma client
prisma/                   # schema.prisma, migrations, seed.ts
```

## Request flow

1. `src/proxy.ts` runs first on every request: it rewrites `/` for the marketing home, guards `/dashboard`, `/resume`, `/tracker`, `/settings`, `/cover-letters`, `/billing`, `/onboarding` with a session check, and adds security headers.
2. Auth is a signed JWT cookie (`rf_session`, jose HS256). `src/lib/auth/session.ts` verifies it; `src/lib/auth/guards.ts` `requireUser()` throws/redirects when missing. OAuth uses PKCE with state stored in a signed cookie.
3. Server pages call `requireUser()` then read Prisma. Client components call **Server Actions** (`src/actions/*`) for mutations and `src/lib/ai/client.ts` for AI/ATS HTTP calls.
4. Route handlers return JSON. User identity in API routes comes from `requireApiUser()` (`src/lib/api/helpers.ts`), which reads the same session cookie — so the browser cookie is the auth token end-to-end.

## Key subsystems

### Auth (`src/lib/auth/`, `src/app/api/auth/`)
- `jwt.ts` — sign/verify HS256 JWTs with `AUTH_SECRET` + `AUTH_SESSION_TTL` (default 30d).
- `session.ts` — `createSessionCookie`/`getSessionUser`/`destroySession` (cookie, maxAge, httpOnly, sameSite=lax, secure in prod).
- `password.ts` — bcryptjs hash/verify (12 rounds).
- `tokens.ts` — email verification / password reset tokens (stored hashed in `VerificationToken`).
- `oauth.ts` — PKCE helpers for Google and GitHub. Callbacks in `src/app/api/auth/oauth/*`.

### Plans & gating (`src/lib/billing/`)
- `src/lib/constants.ts` — `PLAN_LIMITS`: resumes, AI credits/day, ATS scans/day, allowed templates/exports, import, share.
- `gating.ts` — `planOf`/`limitsFor`/`assertResumeCapacity`/`assertFeature`. Every gated action (export, import, builder features, AI calls) checks here.
- Stripe checkout, portal, and webhook routes upsert the `Subscription` row and flip `User.plan`.

### AI (`src/lib/ai/`)
- `AIProvider` interface (`generateSummary`, `rewriteBullet`, `scoreResume`, `generateCoverLetter`, `structureResume`).
- `anthropic.ts` — Claude via the Anthropic SDK when `ANTHROPIC_API_KEY` is set.
- `local.ts` — deterministic fallback engine (keyword extraction, scoring heuristics) so the app works with no API key.
- `client.ts` — browser-side `fetch` helpers used by builder/ATS/cover-letter UI.
- Usage is recorded in `AiUsage` and capped per plan via `src/lib/api/helpers.ts` (`gateAiCall`).

### ATS scoring (`src/app/api/ats/score/`)
Tokenizes the job description and resume, extracts meaningful keywords (multi-word phrases too), scores keyword match + formatting + completeness, and persists `Resume.aiScore`.

### Export & import (`src/lib/export/`, `src/lib/import/`...)
- `@react-pdf/renderer` for PDF, `docx` for DOCX, plain text for TXT. Plan-gated.
- Import accepts PDF (pdf-parse) and DOCX (mammoth), extracts text, then `ai.structureResume` maps it into `ResumeData`.

### Resume data model
`Resume.data` is a JSON `ResumeData` object (`src/lib/types/resume.ts`): `{ personal, sections }` where each section has typed items. The builder edits this object client-side and autosaves (1200 ms debounce) through `saveResumeAction`; every save snapshots a `ResumeVersion`.

## Database

Prisma 7 with driver adapters — PostgreSQL via `@prisma/adapter-pg` (`src/lib/db/client.ts`). The datasource URL lives in `prisma.config.ts` (Prisma 7 convention). For local development, point `DATABASE_URL` at a local Postgres or a free Neon/Supabase instance.

- Schema: `prisma/schema.prisma`
- Migrations: `npx prisma migrate dev`
- Seed: `npm run db:seed` (creates the `demo@resumeforge.app` user + sample data)

## Design decisions

- **Custom auth instead of NextAuth** — full control over session shape, OAuth PKCE, and email flows; zero magic.
- **Local AI fallback** — deterministic behavior in dev/demo and graceful degradation without an API key.
- **Middleware replaced by `src/proxy.ts`** — Next.js 16 convention; export the proxy from `src/proxy.ts`.
- **JSON resume data** — flexible schema without migrations for every new field; validated with zod on every write.
- **Server Actions for mutations** — less client-server boilerplate, RSC-friendly; heavy/AI/third-party work lives in route handlers.
