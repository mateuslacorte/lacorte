---
title: How to Select All E-mails on Old Gmail Interface
date: '2026-01-13'
tags:
  - portfolio
  - firefox
  - extension
  - gmail
  - javascript
description: >-
  I created a Firefox extension to add a 'select all e-mails' button to the old
  Gmail interface. It worked. It was simple. And I just archived it. Classic.
---


Let me tell you about a Firefox extension I created. Not because it was revolutionary, not because it solved a world-changing problem, but because... well, because I needed it. And apparently, I was the only one.


## The Problem


So, Google decided to update Gmail. Shocking, I know. They created a new interface with modern design, **shittier** UX, all that jazz. But you know what they forgot? The ability to easily select all e-mails in the old interface when you needed to do bulk actions.


Actually, wait. They didn't forget. They just moved it somewhere else. Or maybe they removed it entirely. I honestly don't remember. All I know is that one day, I was trying to select all my e-mails in the old Gmail interface (because I'm a creature of habit and refuse to adapt to change), and I couldn't find the damn button.


So I did what any reasonable developer would do: I created a Firefox extension to add it back. Because why adapt to change when you can write code to avoid it? Even more when the change is a piece of trash...


## The Project


The extension is... simple. Almost embarrassingly simple. It's literally just a button that says "Select All" that you can click to select all e-mails on the current page. That's it. No magic. No complex logic. Just a button.


But here's the thing: it worked. And sometimes, that's enough.


### What The Extension Does


The extension basically:

1. Injects a button into the old Gmail interface
2. When you click it, it selects all e-mails on the current page
3. That's it. That's the whole thing.


I know. Revolutionary, right?


The extension uses a content script that runs on Gmail pages. It finds the email list container, looks for all the checkboxes, and... checks them. Because that's how you select things in Gmail. You check the checkboxes. Profound, I know.


### The Technical Details


The code is... well, it's JavaScript. Vanilla JavaScript. No frameworks. No dependencies. Just pure, unadulterated DOM manipulation. The way God intended.


Here's basically what it does:

1. **Waits for the Gmail page to load** - Because timing is everything
2. **Finds the email list container** - Using good ol' `querySelector`
3. **Adds a button to the interface** - Because why not?
4. **Listens for clicks** - Because buttons need to do something
5. **Finds all checkboxes** - The checkboxes that select individual e-mails
6. **Checks them all** - Because that's the whole point


The code uses DOM manipulation to inject the button into Gmail's interface. It looks for specific CSS classes and IDs that Gmail uses (which is always risky because they could change, but hey, it worked when I made it... Spoiler: It doesn't anymore!).


The button is styled to look like it belongs in the Gmail interface. It's not perfect, but it's good enough. Because perfection is overrated. Or at least that's what I tell myself.


### The Firefox Extension


The extension is built using the WebExtensions API, which is the standard for Firefox extensions. It has:

- A `manifest.json` file - Because every extension needs one
- A content script - The JavaScript that runs on Gmail pages
- Icons - Because extensions need icons (I think?)
- A README - Because documentation is important, even for simple things


The manifest specifies that the extension should run on Gmail pages (`*://mail.google.com/*`). When you visit Gmail, the content script loads, finds the right place to inject the button, and does its thing.


### Why The Old Gmail Interface?


You might be wondering: "Why the old Gmail interface? Why not the new one?"


Good question. Here's the honest answer: because that's what I was using at the time. And when I couldn't easily select all my e-mails, I got frustrated. So I fixed it.


### The Archival


I just archived the repository. January 4th, 2026. Fresh archival, still warm from the oven.


Why? Because Gmail changed. Again. They're probably phasing out the old interface entirely. Or maybe they fixed the issue. Or maybe I just stopped using the old interface. I honestly think it's a combination of all those options...


But the extension is still there. It's just... archived. Like a digital fossil. A reminder of a time when I cared enough about selecting all my e-mails to write a Firefox extension for it.


## What I Learned

1. **Simple problems need simple solutions** - Sometimes a button is just a button
2. **Browser extensions are easier than you think** - The WebExtensions API is actually pretty straightforward
3. **Google changes things constantly** - Writing extensions for Google services is a losing battle
4. **Sometimes you're the only user** - And that's okay
5. **Archiving projects is cathartic** - Sometimes you just need to let things go


## The Code


It's archived, but it's still there. You can look at it. Judge me for it. Install it if you want. I don't care. It's archived. It's not my problem anymore.


The code is simple. It's JavaScript. It manipulates the DOM. It used to work... And that's enough.


## The Reality Check


This extension is not impressive. It's not complex. It's not even that useful. But it solved a problem I had, at the time I had it. And sometimes, that's enough.


It's a small project. A simple project. A project that I probably spent more time thinking about than actually writing. But it's mine. And I'm writing about it. So here we are.


The extension worked. It did what it was supposed to do. And then I archived it because... well, because reasons. Classic developer behavior.


If you're still using the old Gmail interface and you need to select all your e-mails, this extension might help. Or it might not. It's archived, so I make no promises. But hey, it's there if you want it.


---


The extension is available on [GitHub](https://github.com/mateuslacorte/select-all-e-mails-on-old-gmail-interface) if you really want to see it. It's archived, so don't expect updates. But if you need to select all your e-mails in the old Gmail interface, and you're using Firefox, and you're feeling adventurous... go for it. I won't stop you.
