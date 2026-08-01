---
title: Network Scanner CGI Script
date: '2026-01-05'
tags:
  - portfolio
  - networking
  - bash
  - college
  - retro
description: >-
  A blast from the past: a CGI script I wrote in college for network scanning.
  It's old, it's bash, and it's probably terrible. But hey, it worked!
---


Let me take you on a journey back in time. Way back. Like, 6 years ago. When I was a fresh-faced networking student, full of dreams and questionable coding practices.


This is a story about a CGI script I wrote for a class called "Applied Programming for Computer Networks". It was supposed to be a simple network scanner using nmap. Simple, right? Well, I made it... interesting.


## The Project


The assignment was straightforward: create a web interface for network scanning. The professor probably expected something simple, maybe a basic HTML form that calls a Python script. But me? I went full bash CGI. Because why make things easy when you can make them unnecessarily complicated?


I was studying Computer Networks at the time, and I had a bunch of networking certifications under my belt:
- **Mikrotik**: MTCNA, MTCRE, MTCIPv6E, MTCSE
- **Huawei**: HCIA


So naturally, I thought I was hot stuff. Spoiler: I wasn't. But I did know my way around networks, which is more than I can say about my bash scripting skills back then.


## The Code


The script is a single bash file that does... well, everything. It's a CGI script that:
1. Checks directory permissions (because security, I guess?)
2. Handles form submissions
3. Runs nmap scans in the background
4. Shows real-time results with auto-refresh
5. Manages file I/O like it's 1995


It's all in one file. All 50+ lines of it. Because separation of concerns is for cowards, apparently.


The code is old. Like, really old. 6 years old. In tech years, that's basically ancient. But you know what? It worked. It actually worked. And that's more than I can say about some of my more recent projects.


## What It Does


The script creates a web interface where you can:
- Enter an IP address (IPv4 or IPv6, because I was fancy)
- Run an nmap scan with aggressive verbosity (`-Av -p-`)
- Watch the results update in real-time (using meta refresh, because JavaScript is for the weak)
- See your results in a terminal-inspired dark theme


It's basically a web-based nmap wrapper. Nothing fancy, but it got the job done. And honestly, for a college assignment, that's all that matters.


## The Design: Terminal Chic


I went with a dark theme inspired by terminal aesthetics. Dark background (#2b2b2b), colorful text, Orbitron font (because futuristic). It was 2019, and I thought I was being edgy. Looking back, I was just being... well, me.


The color scheme is straight out of a retro terminal:
- Green links (#60b48a)
- Cyan spans (#8cd0d3)
- Orange headers (#dfaf8f)
- Purple code blocks (#dc8cc3)


It's like someone took a terminal and made it into a website. Which is exactly what I did. And you know what? I'm not even sorry.


## The Technical Details (Or: Why This Is Terrible)


Let's be honest: this code is a mess. It's a single bash script doing everything. There's no error handling worth mentioning. The file I/O is primitive. The refresh mechanism is hacky (meta refresh every second? Really?).


But here's the thing: it worked. For a college assignment, that's what mattered. The professor probably looked at it, saw that it functioned, and gave me a passing grade. Mission accomplished.


The script uses:
- **Bash CGI** - Because why use modern frameworks when you can use 90s technology?
- **nmap** - The actual network scanning tool (the only part that's actually good)
- **File-based state management** - Because databases are overrated
- **Meta refresh** - Because real-time updates are for JavaScript developers


It's a beautiful disaster, and I love it.


## What I Learned


1. **Bash CGI is a thing** - And it's as terrible as it sounds
2. **Single-file applications are possible** - But that doesn't mean they're a good idea
3. **Meta refresh works** - But it's not pretty
4. **File permissions matter** - Especially when your script checks them
5. **Old code is embarrassing** - But also kind of nostalgic


Looking at this code now, I cringe. But I also remember the excitement of making something work. The satisfaction of seeing nmap output appear on a web page. The pride of turning in something that actually functioned.


It's not good code. But it's *my* bad code. And that counts for something, right?


## The Reality Check


This project is old. Really old. The code is messy. The approach is outdated. The design is... well, it's a design. But you know what? I learned a lot from it. I learned that sometimes, getting something working is more important than making it perfect. I learned that bash can do more than you think (even if it shouldn't). I learned that college assignments don't need to be masterpieces—they just need to work.


And honestly? That's a lesson I still carry with me today. Not everything needs to be perfect. Sometimes, "it works" is enough.


So there you have it. A 6-year-old bash CGI script that scans networks. It's not impressive. It's not modern. It's not even that good. But it's mine, and I'm weirdly proud of it.


If you want to see the actual code (and judge me for it), you can check it out on [GitHub](https://github.com/mmendescortes/aaparc). Fair warning: it's exactly as terrible as I described. But hey, at least it's honest.
