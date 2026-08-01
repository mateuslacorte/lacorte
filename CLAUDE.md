# lacorte.dev — AI / contributor notes

## Stack
Next.js App Router, React 19, Tailwind, Supabase (Postgres + Realtime + Auth), Vercel.

## Rules
- Brand: lacorte.dev only (see `src/lib/site.ts`)
- Public UI is bilingual: English (unprefixed) + Brazilian Portuguese (`/pt/...`)
- i18n catalogs use `{ en: '…', pt: '…' }` shape (`src/i18n/`)
- Blog posts live in `src/content/blog/{en,pt}/` — translate posts only (not articles/jobs bodies)
- Admin / login / API stay English-only (no `/pt` variants)
- No Firebase — chat signaling is `src/lib/rooms.ts` + Supabase Realtime; messages via PeerJS
- Favorites/recents sync through `src/lib/userData.ts` (localStorage + anon auth)

## Commands
`npm run dev` · `npm run build` · `npm run verify`
