# ResumeForge — API reference

All routes are Next.js route handlers. API routes authenticate via the same session cookie as the browser (`requireApiUser`), so no bearer token is needed. Unauthenticated requests get `401`.

Errors are `{ "error": "<message>" }` with an appropriate status code.

## AI

### `POST /api/ai/rewrite-bullet`

Improve a resume bullet for a target role. Pro-gated per plan limits.

```json
{ "bullet": "Worked on the dashboard", "context": "Senior Product Manager at a B2B SaaS startup" }
```

Returns `{ "rewritten": "…" }`.

### `POST /api/ai/summary`

Generate a professional summary from resume data.

```json
{
  "data": { "personal": {}, "sections": [] },
  "targetRole": "Senior Product Manager"
}
```

Returns `{ "summary": "…" }`.

### `POST /api/ai/cover-letter`

Generate a cover letter from resume data + job description.

```json
{
  "data": { "personal": {}, "sections": [] },
  "jobDescription": "…",
  "company": "Stripe",
  "tone": "PROFESSIONAL"
}
```

`tone` is one of `PROFESSIONAL | CONCISE | CONFIDENT | FRIENDLY`. Returns `{ "letter": "…" }`.

## ATS

### `POST /api/ats/score`

Score a resume against a job description. Requires `{ resumeId }` or inline `{ data, jobDescription }`.

```json
{ "resumeId": "…", "jobDescription": "…" }
```

Returns an `AtsScore`:

```json
{
  "total": 87,
  "keywordMatch": 90,
  "formatting": 82,
  "completeness": 88,
  "matchedKeywords": ["product roadmap", "a/b testing"],
  "missingKeywords": ["sql"],
  "formattingFlags": [],
  "scannedAt": "2026-08-01T00:00:00.000Z"
}
```

When `resumeId` is provided, `Resume.aiScore` is persisted.

## Export & import

### `POST /api/export`

```json
{ "resumeId": "…", "format": "pdf" }
```

or inline:

```json
{ "data": { "personal": {}, "sections": [] }, "format": "pdf", "accentColor": "#2563eb", "font": "Inter" }
```

`format` is `pdf | docx | txt`. Free plan allows `pdf` only; Pro allows all. Returns the file as an attachment.

### `POST /api/import`

`multipart/form-data` with a `file` field (PDF or DOCX, max 10 MB). Pro feature. Returns `{ data: ResumeData, rawText }`.

## Share

### `GET /api/share/[slug]`

Public JSON of a shared resume. `404` if the slug is inactive or missing.

## Email

### `POST /api/email`

Send an email with a resume attached as PDF.

```json
{ "to": "hiring@example.com", "resumeId": "…", "message": "Please find my resume attached." }
```

or inline: replace `resumeId` with `data`, `title`, `accentColor`, `font`. Pro-gated (`email` export). Uses Resend when `RESEND_API_KEY` is set, otherwise logs to console and returns success.

## Stripe

### `POST /api/stripe/checkout`

```json
{ "interval": "year" }
```

`interval` is `month | year`. Requires `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` or the corresponding default price. Returns `{ url }` (Stripe Checkout session).

### `POST /api/stripe/portal`

Opens the Stripe billing portal for the user's customer. Returns `{ url }`.

### `POST /api/stripe/webhook`

Stripe-signed webhook (`stripe-signature` header, verified with `STRIPE_WEBHOOK_SECRET`). Handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` — upserts the `Subscription` row and updates `User.plan`. Returns `{ received: true }`.

## OAuth

- `GET /api/auth/oauth/[provider]` — start Google/GitHub OAuth (PKCE).
- `GET /api/auth/oauth/callback/[provider]` — exchange code, create session, redirect.

## Status codes

| Code | Meaning |
| --- | --- |
| 401 | Not authenticated |
| 403 | Plan limit / Pro-gated feature |
| 422 | Invalid input or unreadable file |
| 503 | Integration not configured (Stripe/email) |
| 502 | Upstream AI failure |
