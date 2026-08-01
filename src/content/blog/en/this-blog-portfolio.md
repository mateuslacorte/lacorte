---
title: 'This Blog (Yes, The One You''re Reading Right Now)'
date: '2026-01-04'
tags:
  - portfolio
  - nextjs
  - vercel
  - meta
description: >-
  A meta post about the blog you're currently reading. Because nothing says 'I
  have too much time' like writing about your own blog.
---


So, you're reading a blog post... *about the blog you're reading it on*. How delightfully meta of us. Welcome to peak navel gazing, my friend.


## The Project

This is my blog. I built it. I'm writing about it. On it. It's like Inception, but way less cool and with significantly fewer spinning tops.


I decided to create this blog because apparently, having a LinkedIn profile and a GitHub account wasn't enough to prove I exist on the internet. So here we are, adding another website to the already overcrowded digital landscape. You're welcome, internet.


## The Tech Stack (Because Everyone Cares)

### Why Not WordPress?

You might be wondering: "Why didn't you just use WordPress like a normal person?" Well, here's the thing! I actually *do* use WordPress. For e-commerce sites, client projects, and all that jazz. It's fine. It works. It gets the job done.


But here's the catch: I don't like it enough to put my personal data on it. **11 out of 10 WordPress instances catch viruses**... Yes, I know that's mathematically impossible, but WordPress finds a way. It's like that reliable coworker who always gets the job done fast, everybody from the HR and Management love him, but there is a catch, he also fuck up the whole codebase with AI slop and spaghetti code every time he touches it.


For my simpleton clients who ask for WordPress? Sure, why not. They want it, they get it. It's their data, their problem. But for *my* personal blog? Nah. I'll stick with my custom built solution where I know exactly what's happening and when it breaks, I know exactly who to blame... (spoiler: it's me).


So WordPress is great for business, but for personal stuff, I prefer something I actually control. Call me picky, but I like my personal projects to be... well, personal.


### Why Not Ghost CMS?

Ah, **Ghost CMS**. My beloved. The one that got away. Or rather, the one I ran away from.


Ghost is beautiful. It's clean. It's modern. It's also a resource hog that makes my server cry. Why does it need so much RAM and CPU just to display text on a screen? It's like using a Formula 1 car to go to the grocery store! Technically impressive, but completely overkill.


I tried Ghost once. My server started making sounds I didn't know servers could make. It was using more resources than a small country, and for what? To be a glorified Blogspot? Don't get me wrong, Ghost is great if you're running a media company or need all those fancy features. But for a personal blog where I write about... well, my blog? It's like bringing a flamethrower to a birthday party.


So here I am, with my lightweight Next.js blog that probably uses less resources than Ghost's loading screen. Sometimes the simple solution is the right solution. Or maybe I'm just cheap. You decide.


### Next.js

I chose **Next.js** because I'm a basic developer who follows trends. Also, because it's actually pretty good. Server-side rendering? Check. Static site generation? Check. API routes? Check. My sanity? Debatable.


I'm using the App Router because I like living on the edge (or at least, the edge that was stable six months ago). The Pages Router is for cowards, and I'm definitely not a coward. I'm just... fashionably late to the party.


### TypeScript

Because JavaScript wasn't confusing enough, I added types. Now I can spend hours arguing with my IDE about whether `string | null | undefined` is the same as `string?`. (Spoiler: it's not, and TypeScript will make sure you know it.)


### Markdown for Posts

I store posts as Markdown files because I'm old school like that. No fancy CMS, no database, just good ol' `.md` files sitting in a folder. It's like the 90s, but with better syntax highlighting.


The best part? I can write posts in VS Code, which means I get to feel productive while procrastinating. It's a win-win.


### The Design: Fallout Terminal Aesthetic

I went with a **Fallout-inspired terminal design** because:
1. I have a friend, yes... a very good friend...
2. He loves the Fallout series, he really do...
3. Green text on black background is easier on the eyes at 3 AM
4. It makes me feel like I'm hacking into a mainframe (I'm not)
5. It's retro, which is code for "I couldn't be bothered to learn modern design"

The CSS is a beautiful mess of animations, keyframes, and questionable color choices. There's a flicker effect that makes it look like an old CRT monitor, which is either charming or annoying depending on how much coffee you've had.


## Features

### Comments System

Yes, there's a comments system. No, nobody uses it. But it's there, and that's what matters. It's like having a guest room in your apartment—you'll probably never use it, but it makes you feel like a responsible adult. (Note: Does not work at all in Vercel where this is hosted... You're welcome!)


### Contact Form

There's a contact form because apparently, email addresses are too complicated for people to use directly. I'm not judging (I'm totally judging), but hey, if it makes someone's life easier, who am I to complain? (Note: Does not work... YET!!!)


### Newsletter Signup

Because what's a blog without a newsletter that nobody subscribes to? It's the modern equivalent of a guestbook, but with more spam potential. (Note: Same-same, but different! Not actually...)


### Web Workers & WebAssembly

I added Web Workers and WebAssembly because I wanted to feel smart. Do I actually need them? Probably not. Do they make the blog faster? Marginally. Do they make me look like I know what I'm doing? Absolutely.


### SEO Optimization

I optimized for SEO because Google needs to know that I exist. I added sitemaps, robots.txt, and all that jazz. Will anyone find this blog through Google? Probably not. But at least I tried, and that's what counts, right?


## Deployment: Vercel

I deployed this on **Vercel** because:
- It's free (and I'm cheap)
- It's easy (and I'm lazy)
- It works with Next.js out of the box (and I'm basic)

The deployment process is so smooth, it's almost suspicious. One push to GitHub, and boom—your site is live. It's like magic, but with more environment variables and slightly less rabbits.


## What I Learned

1. **Don't overthink the design** - I spent way too much time on CSS animations that nobody notices
2. **Markdown is your friend** - Simple is better. Always.
3. **TypeScript will save you** - Even when you hate it, it's saving you from yourself
4. **Vercel sucks** - Seriously, read-only filesystems? I get it's serverless, but man... It sucks!
5. **Nobody reads blogs anymore** - But here we are anyway, because we're optimists (or masochists)

## The Reality Check

Let's be honest: this blog is probably over-engineered for what it does. I could have used WordPress or Medium or literally any other platform. But where's the fun in that? Plus, building your own blog is a rite of passage for developers, like getting your first "it works on my machine" moment.


Is it perfect? No. Will I keep tinkering with it? Absolutely. Will I ever be satisfied with it? Probably not. But that's the beauty of being a developer, we're never done, we're just temporarily out of ideas.


You can find the code to this mess [here](https://github.com/mateuslacorte/blog).
