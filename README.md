# lacorte.dev

Personal developer site — blog, online tools, games, projects, anonymous chat, jobs directory, and article feed.

## Stack

- **Next.js** (App Router) + React 19 + TypeScript
- **Tailwind CSS** with class-based dark mode
- **Supabase** — Postgres + RLS + Realtime + anonymous/magic-link auth
- **Vercel** — hosting, Analytics, Speed Insights, Cron; Blob optional for assets
- **PeerJS** — P2P anonymous chat transport (signaling via Supabase)

## Setup

```bash
cp .env.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET

npm install
npm run dev
```

Apply SQL migrations under `supabase/migrations/` in your Supabase project. Enable **Anonymous sign-ins** and **Email magic link** in Auth settings. Add your user id to `admin_users` for `/admin`.

Set `OPENROUTER_API_KEY` for OpenRouter content curation (admin → Content tab; model `nvidia/nemotron-3-ultra-550b-a55b:free`).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run verify` | Content quality checks |

Public UI is bilingual: English at `/…` and Brazilian Portuguese at `/pt/…`.

## Branding

Site name/URL live in `src/lib/site.ts` (`lacorte.dev`). localStorage keys use the `lacorte_*` prefix.
