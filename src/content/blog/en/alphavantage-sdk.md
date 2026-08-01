---
title: Alpha Vantage SDK for Node.js
date: '2026-01-05'
tags:
  - portfolio
  - nodejs
  - npm
  - api
  - retro
description: >-
  A 7 year old NPM package I created to wrap the Alpha Vantage API. It's simple,
  it's old, and it's still on NPM. Don't judge me.
---


Let me tell you about the time I thought I was a real developer. It was 7 years ago. I was young, naive, and full of... well, mostly caffeine and questionable life choices.


I created an NPM package. A real one. Published it and everything. It's called `alphavantage-sdk`, and it's still out there, haunting the NPM registry like a digital ghost from my past.


## The Project


I wanted to use the Alpha Vantage API (which provides free stock market data, because who doesn't love free APIs?). But making HTTP requests was hard, apparently. So I did what any reasonable developer would do: I wrapped it in a library and published it to NPM.


Because why use `fetch` or `axios` directly when you can add an extra layer of abstraction? That's what good developers do, right? Right?


The package is simple. Almost embarrassingly simple. It's basically a wrapper around Node.js's built-in `https` module. But hey, it worked. And people actually used it. Some still do, probably. God help them.


## The Code


The entire SDK is... wait for it... about 50 lines of code. That's it. 50 lines. For an entire NPM package. I'm not proud, but I'm also not ashamed. It's a weird middle ground.


The code does exactly what you'd expect:
1. Takes an API key
2. Makes HTTP requests to Alpha Vantage
3. Returns parsed JSON
4. That's it. That's the whole thing.


I used Node.js's built-in `https` module because I was too lazy to add a dependency. Which, looking back, was actually a smart move. Fewer dependencies = fewer problems. Who knew?


The code uses Promises (because async/await wasn't cool yet in 2018, or I just didn't know about it). It manually concatenates response chunks because... well, because that's how you did it back then, I guess?


## What It Does


The SDK provides functions to fetch stock market data:
- Daily, weekly, and monthly time series
- Adjusted and unadjusted versions
- Full data sets (because sometimes you need ALL the data)


It's basically a thin wrapper that:
1. Takes a stock symbol (like 'MSFT' for Microsoft)
2. Calls the Alpha Vantage API
3. Returns the data


That's it. No magic. No complex logic. Just HTTP requests wrapped in functions. And you know what? Sometimes that's enough.


## The NPM Package


I published it to NPM. People installed it. Some might still be using it. I'm sorry, future developers who have to maintain code that depends on this.


The package name is `alphavantage-sdk`. It's still there. You can install it right now with `npm install alphavantage-sdk`. Please don't. But you could.


It has a README. It has examples. It even has a CONTRIBUTING.md file (because I was fancy). It's licensed under MPL 2.0, because I thought that was a good idea at the time. I still think it is, actually.


## The Technical Details


Let's be honest: this code is not impressive. It's a simple HTTP wrapper. Anyone could write this in 10 minutes. I probably did write it in 10 minutes. But I published it, and that's what counts, right?


The code uses:
- **Node.js `https` module** - Because dependencies are for the weak
- **Promises** - Because async/await was too new
- **Manual chunk concatenation** - Because I didn't know about better ways
- **Global API key** - Because configuration is hard


It's not good code. But it's functional code. And sometimes, that's enough for an NPM package.


## What I Learned


1. **Publishing to NPM is easy** - Maybe too easy
2. **Simple solutions work** - Even if they're not elegant
3. **People will use your code** - Even if it's terrible
4. **Documentation matters** - Even for 50-line packages
5. **Old code is embarrassing** - But also kind of nostalgic


Looking at this code now, I see all the things I'd do differently:
- Use async/await
- Add proper error handling
- Use a proper HTTP client library
- Add TypeScript types
- Actually test it


But you know what? It worked. People used it. And that's more than I can say about some of my more "polished" projects that never saw the light of day.


## The Reality Check


This package is old. Really old. 7 years old. In JavaScript years, that's basically ancient history. The code is simple. The approach is outdated. The implementation is... well, it's an implementation.


But here's the thing: I shipped it. I published it. People used it. And that's something. Not everyone can say they've published an NPM package, even if it's just a simple wrapper.


It's not impressive. It's not complex. It's not even that good. But it's mine, and I'm weirdly proud of it. Even if I'm also slightly embarrassed by it.


If you want to see the actual code (and judge me for it), you can check it out on [GitHub](https://github.com/mmendescortes/alphavantage-node-sdk). Or install it from NPM if you're feeling adventurous. Just don't tell me if you do. I don't want to know.
