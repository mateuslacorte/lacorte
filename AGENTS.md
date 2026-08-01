# Repository Guidelines

## Structure
- `src/app/[locale]/(site)/` — localized public pages (en unprefixed via middleware rewrite; pt under `/pt`)
- `src/app/(ops)/` — admin + login (English-only)
- `src/app/api/` — API/cron routes
- `src/components/` — UI (`tools/`, `games/`, `jobs/`, `articles/`; `dashboard/` + `llm-wiki/` kept for reference, routes archived)
- `src/content/blog/{en,pt}/` — Markdown posts per locale
- `src/data/` — tools/games/projects configs (SEO keyed by `Language`)
- `src/i18n/` — catalogs `{ en: '…', pt: '…' }` + `localizePath` / middleware helpers
- `src/lib/` — blog, chat/rooms, supabase, exchange rates, userData
- `supabase/migrations/` — schema + seed

## Commands
- `npm run dev` / `build` / `start`
- `npm run verify` — content quality

## Conventions
- TypeScript strict, 2-space, single quotes, semicolons
- Path alias `@/*` → `src/*`
- Public UI: English + pt-BR via `/pt` URL prefix; admin English-only
- No Firebase — use Supabase clients in `src/lib/supabase/` and `src/lib/rooms.ts`

## Secrets
Use `.env.example`. Never commit service-role keys or cron secrets.
