---
title: 'This Site (Yes, The One You''re Reading Right Now)'
date: '2026-01-04'
tags:
  - portfolio
  - nextjs
  - vercel
  - meta
description: >-
  A meta post about lacorte.dev — the bilingual developer site you're on —
  not the old Fallout-terminal blog that used to live in my head.
---

So, you're reading a blog post... *about the site you're reading it on*. How delightfully meta of us. Welcome to peak navel gazing, my friend — except this time the navel is called **lacorte.dev**, not a green CRT cosplay.

## The Project

This is my personal developer site. I built it. I'm writing about it. On it. It's still Inception-adjacent, but with fewer spinning tops and more browser tools.

I used to treat "portfolio" as code for "a blog with a dark theme." That wasn't enough. LinkedIn and GitHub prove you exist; a site like this proves you *ship*. So lacorte.dev is a learn-in-public journal **plus** small things people can actually use: tools, games, article and job feeds, and even anonymous chat. If you only came for the post, the rest of the nav is optional. If you came for a JSON formatter at 2 AM — you're welcome, internet.

Start at [`/about`](/about), skim [`/posts`](/posts), or skip straight to [`/tools`](/tools) and [`/games`](/games).

## The Tech Stack (Because Everyone Cares)

### Why Not WordPress?

You might be wondering: "Why didn't you just use WordPress like a normal person?" Well — I *do* use WordPress. For e-commerce sites, client projects, and all that jazz. It's fine. It works. It gets the job done.

But I don't like it enough to park my personal brand on it. WordPress is the reliable coworker who ships fast and that HR loves — until the plugin zoo and "quick AI fix" turn the codebase into spaghetti. For clients who want WordPress? Sure. Their data, their call. For *my* site? I want a stack I can explain end to end. When it breaks, I know who to blame (spoiler: me).

### Why Not Ghost CMS?

**Ghost** is beautiful, clean, and modern. It's also a lot of machinery for "Markdown in a folder." Great if you're running a media company. For a personal site that also hosts tools and games? Overkill. I tried it once; my server made noises I didn't know servers could make. lacorte.dev stays on Next.js instead — not because Ghost is bad, but because I want one app that does more than a glorified Blogspot.

### Next.js, React, TypeScript

I chose **Next.js** (App Router) because it's actually a good fit: SSR and SSG where they help, API and cron routes for aggregators, and a deploy path that doesn't fight me. This site runs on **Next.js 16**, **React 19**, and **TypeScript** — because JavaScript alone wasn't confusing enough, and arguing with the IDE about `string | null` builds character.

### Markdown for Posts

Posts still live as Markdown under `src/content/blog/{en,pt}/`. No fancy CMS. Write in the editor, commit, deploy. It's the 90s with better syntax highlighting — and a locale folder so Portuguese isn't an afterthought.

### Supabase, PeerJS, and Friends

The site isn't static-only anymore. **Supabase** backs Postgres, RLS, auth (including anonymous sessions for favorites/recents), and realtime where it matters. **PeerJS** carries anonymous chat traffic; signaling goes through Supabase, not Firebase. Crons on Vercel keep article and job feeds from going stale. Optional Blob storage exists for assets when we need it.

### Tailwind and Theme Toggle

UI is **Tailwind** with class-based light/dark mode — zinc-ish surfaces, a violet primary, Pretendard for type. No terminal flicker. No "hacking the mainframe" LARP. The old Fallout CRT aesthetic was fun for a weekend; for a site people use as a toolbelt, readable contrast and a theme toggle win.

## Features (The Ones That Actually Exist)

### Bilingual Public UI

English at `/…`, Brazilian Portuguese at `/pt/…`. Blog posts are translated where it matters. Admin and login stay English-only — ops don't need a second locale.

### Blog and Comments

You're in the blog. Posts are Markdown per locale. Comments are wired through Supabase for posts that support them — not a guest room I pretend works on Vercel while it doesn't.

### Tools and Games

Dozens of browser tools (JSON, regex, bcrypt, image helpers, timers, and friends) and a pile of small games. They're part of the product, not a sidebar afterthought.

### Articles and Jobs

Aggregated tech/dev articles and IT job listings from company career pages — refreshed on a schedule so the site is more than my own writing cadence.

### Anonymous Chat

Peer-to-peer chat with Supabase signaling. It lives under the tools-ish surface, not always screaming from the main nav — but it's real.

### About, Contact, Privacy

Because a personal site without those is just a vibes folder. Email works the old-fashioned way when forms aren't the point.

### SEO and Analytics

Sitemaps, `robots.txt`, Open Graph images, Vercel Analytics and Speed Insights. Will Google care? Maybe. Did I still wire it? Yes.

## Deployment: Vercel

I deploy on **Vercel** because it fits Next.js, the free tier is honest enough for a personal site, and one push still feels like magic — with more environment variables and fewer rabbits.

Serverless has tradeoffs (ephemeral filesystems, cold starts, "just put that in Blob"). That's not a gotcha unique to Vercel; it's the model. For lacorte.dev, the tradeoff is worth it: previews, crons, Analytics, and a boringly reliable production alias at [www.lacorte.dev](https://www.lacorte.dev).

## What I Learned

1. **Don't ship nostalgia as the whole design** — Terminal green was cute; a usable light/dark UI is what people keep open.
2. **Markdown is still your friend** — Simple content wins. Locales make it twice as much work, and that's fine.
3. **TypeScript will save you** — Even when you hate it, it's saving you from yourself.
4. **A "blog" can be a platform** — Tools and games aren't scope creep if they're why people return.
5. **i18n is a product decision** — `/pt` from day one beats "we'll translate later."
6. **Serverless is a contract** — Design for it instead of fighting the filesystem.

## The Reality Check

Is lacorte.dev over-engineered for "a place to write"? Probably. Could I have used Medium? Sure. Building your own site is still a rite of passage — and now it's also a playground for experiments I don't want to dump on a client.

Is it perfect? No. Will I keep tinkering? Absolutely. Will I ever be satisfied? Probably not. That's the job.

You can find the code for this mess [here](https://github.com/mateuslacorte/lacorte).
