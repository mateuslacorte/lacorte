# lacorte.dev

Personal developer site — blog, online tools, games, projects, anonymous chat, jobs directory, and article feed.

## Stack

- **Next.js** (App Router) + React 19 + TypeScript
- **Tailwind CSS** with class-based dark mode
- **Supabase** — Postgres + RLS + Realtime + anonymous + email/password auth
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

Apply SQL migrations under `supabase/migrations/` in your Supabase project. Enable **Anonymous sign-ins** (used by chat) and email/password authentication in Auth settings. Add your user id to `admin_users` for `/admin`.

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

### Shared password login

Blog and Members must use the same `NEXT_PUBLIC_SUPABASE_URL` and keys from that project. One Supabase email/password account works on both apps; each app keeps its own session cookies. Blog admin access is still enforced through `public.admin_users` and RLS. Login does not create accounts.

Set `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY` to a Google reCAPTCHA v3 key pair. Register both application hostnames (plus localhost for development). Set `NEXT_PUBLIC_SITE_URL` to each application's actual origin. Rebuild after changing public environment variables. Missing keys disable login; CAPTCHA failures never reach password authentication. Tokens must match the application hostname, use the `login` action, and score at least 0.5.

The login API permits 5 attempts per normalized email and 20 per platform-verified IP within 15 minutes and returns HTTP 429 with `Retry-After`. These additional counters are per Node process and reset on restart; Supabase's built-in token endpoint rate limits also apply across instances. On non-Vercel hosting, requests share an IP bucket until a trusted proxy integration is added. For stricter limits shared across both apps and all replicas, replace the local counter with a shared Redis or database limiter.

Magic-link login is removed from the blog UI and callback. This does not disable Supabase's project-wide OTP API; configure provider policies separately if required. Keep anonymous auth enabled for existing chat functionality.
