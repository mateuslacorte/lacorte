---
title: 'RouterOS Script For BetterStack: Why Did I Do This?'
date: '2026-01-10'
tags:
  - routeros
  - mikrotik
  - betterstack
  - logs
  - portfolio
description: >-
  I created a RouterOS script to send logs to BetterStack at a completely
  inopportune moment. I should have rested. But I didn't. And now I'm here
  writing about it.
---


Hello, dear readers. Today I'm going to tell you about one of the most unnecessary and exhausting projects I've ever created at a completely wrong time. Yes, we're talking about a RouterOS script to send logs to BetterStack. Exciting, isn't it? *No.*


## Could The Timing be Any Worse?


Let me contextualize the mess I made. I was going through one of those phases where depressive mood decided to show up, combined with an absurd exhaustion that made any simple task feel like a marathon. The kind of exhaustion that isn't physical, but mental—that exhaustion that makes you question why you're still awake messing with RouterOS scripts when you should be sleeping.


But no. Instead of simply **turning off the computer and going to rest** like any sane person would do, I decided it was the perfect moment to create a script that sends RouterOS logs to BetterStack. Why? **I don't even know.** Honestly, looking back, I have no idea what went through my head. Maybe it was a way to procrastinate something important. *Yes, it was...* Maybe it was the exhaustion making me believe this was necessary. *This too...* Or maybe it was just my depressed brain trying to create anything to feel useful. *Same-same, but different...*


## The Project


The script itself is relatively simple—and here's the irony: I could have simply *bought* a ready-made solution or used something that already exists. But no. My tired and depressed brain decided it was time to reinvent the wheel and waste my whole afternoon.


### What The Script Does


The script basically:


1. Gets logs from RouterOS stored in memory
2. Converts RouterOS date format (which is ridiculous) to a readable ISO format
3. Processes each log individually
4. Sends via HTTPS to BetterStack using curl
5. Does all this every 30 seconds because yes


Seems useful, right? **It's not.** At least not at this moment. I wasn't working on any project that needed this. I didn't have any client asking for it. I didn't have any urgent need. It was literally just my tired and depressed brain creating unnecessary work for myself.


## The Script Breakdown: Block by Block


Now, let me explain how this script actually works. Because if you're going to suffer through reading about it, you might as well understand what's happening. Fair warning: RouterOS Script is... special. It's like if someone took a programming language and removed all the nice parts.


### Block 1: Cleanup (Lines 6-10)


```routeros
:do { /system scheduler remove [find name="betterstack-sender"] } on-error={}
:do { /system script remove [find name="betterstack-sender"] } on-error={}
```


This is the cleanup section. Before creating anything new, we remove any existing scheduler or script with the same name. The `on-error={}` means "if it doesn't exist, that's fine, just continue." RouterOS doesn't have a nice "if exists" check, so we just try to remove it and ignore errors. Elegant, right? (No.)


### Block 2: Global Variables (Lines 12-16)


```routeros
:global betterstackToken "your-better-stack-token"
:global betterstackEndpoint "your-betterstack-endpoint-for-curl"
```


Here we define global variables that will be used throughout the script. These need to be configured manually by the user. The token is your BetterStack source token, and the endpoint is your BetterStack ingestion URL. You have to set these manually because RouterOS doesn't have environment variables or a nice config file system. You just... set global variables. Welcome to RouterOS.


### Block 3: Date Conversion Function (Lines 18-49)


```routeros
:global convertRouterOSDate do={
    :local routerOSDate $1
    :local formattedDate ""
    :local dateParts [:toarray $routerOSDate]
    
    :if ([:len $dateParts] >= 3) do={
        :local monthStr [:pick ($dateParts->0) 0 3]
        :local day ($dateParts->1)
        :local year ($dateParts->2)
        
        :local monthNum "01"
        :if ($monthStr = "jan") do={ :set monthNum "01" }
        :if ($monthStr = "feb") do={ :set monthNum "02" }
        # ... and so on for all months
        
        :set formattedDate ($year . "-" . $monthNum . "-" . $day)
    }
    
    :return $formattedDate
}
```


This is where the fun begins. RouterOS uses a date format like "jan/06/2026" which needs to be converted to "2026-01-06". This function:


1. Takes the RouterOS date string
2. Splits it into an array using `:toarray`
3. Extracts the first 3 characters of the month (jan, feb, mar, etc.)
4. Maps each month abbreviation to its numeric equivalent using a series of if statements (because RouterOS doesn't have switch/case or dictionaries)
5. Concatenates everything into ISO format


Yes, there are 12 separate if statements. No, there's no better way in RouterOS Script. This is your life now, embrace it!


### Block 4: Main Script - Configuration Check (Lines 55-68)


```routeros
/system script add name="betterstack-sender" source={
    :global betterstackToken
    :global betterstackEndpoint
    :global convertRouterOSDate
    
    :if ($betterstackToken = "YOUR_BETTERSTACK_SOURCE_TOKEN") do={
        :return
    }
    
    :if ($betterstackEndpoint = "YOUR_BETTERSTACK_ENDPOINT") do={
        :return
    }
```


This is the start of the main script. First, we access the global variables we defined earlier. Then we check if they've been configured. If they still have placeholder values, we just return early and do nothing. It's a basic validation, but it's better than nothing considering these fuckers vanish on reboot.


### Block 5: Fetching Logs (Lines 70-74)


```routeros
:local logs [/log print as-value where buffer="memory"]
:local logCount [len $logs]
:local successCount 0
:local errorCount 0
```


Here we fetch all logs from the memory buffer. RouterOS can store logs in memory, and we're getting all of them. We also initialize counters to track how many logs we successfully send and how many fail.


### Block 6: Processing Each Log - Date Conversion (Lines 77-133)


```routeros
:foreach log in=$logs do={
    :local logMessage ($log->"message")
    :local logTopics ($log->"topics")
    :local logTime ($log->"time")

    # Converts RouterOS date format to ISO format
    :local formattedDate ""
    :if ([:len $logTime] > 0) do={
        :local dateParts [:toarray $logTime]
        :if ([:len $dateParts] >= 3) do={
            :local monthStr [:pick ($dateParts->0) 0 3]
            :local day ($dateParts->1)
            :local year ($dateParts->2)
            
            # Month mapping (12 if statements...)
            :local monthNum "01"
            :if ($monthStr = "jan") do={ :set monthNum "01" }
            # ... all 12 months ...
            
            :set formattedDate ($year . "-" . $monthNum . "-" . $day)
        }
    }
    
    # Fallback to current date if conversion failed
    :if ([:len $formattedDate] = 0) do={
        :local currentDate [/system clock get date]
        # ... same conversion logic for current date ...
    }
}
```


For each log, we extract the message, topics, and timestamp. Then we convert the date format. If the conversion fails (because RouterOS date formats are inconsistent), we fall back to using the current system date. Notice how we have to duplicate the entire month mapping logic? Yeah, RouterOS Script doesn't have functions you can call from within other functions easily. It's... special.


### Block 7: Time Extraction (Lines 135-150)


```routeros
:local logHour ""
:if ([:len $logTime] > 0) do={
    :local timeParts [:toarray $logTime]
    :if ([:len $timeParts] >= 2) do={
        :set logHour ($timeParts->1)
    }
}

:if ([:len $logHour] = 0) do={
    :set logHour [/system clock get time]
}

:local utcTimestamp ($formattedDate . " " . $logHour . " UTC")
```


We extract the time portion from the timestamp. If we can't extract it, we use the current system time. Then we combine date and time into a UTC timestamp string. Simple enough, but again, lots of manual string manipulation because RouterOS doesn't have nice date/time libraries.


### Block 8: JSON Escaping (Lines 152-163)


```routeros
:local cleanMessage ""
:for i from=0 to=([:len $logMessage] - 1) do={
    :local char [:pick $logMessage $i ($i + 1)]
    :if ($char = "\"") do={ :set cleanMessage ($cleanMessage . "\\\"") } else={
        :if ($char = "\\") do={ :set cleanMessage ($cleanMessage . "\\\\") } else={
            :set cleanMessage ($cleanMessage . $char)
        }
    }
}
```


This is the JSON escaping nightmare. RouterOS doesn't have a JSON library, so we have to manually escape special characters. We iterate through each character in the log message and escape quotes and backslashes. This is done character by character because RouterOS doesn't have a `replace` function. Yes, this is as tedious as it looks.


### Block 9: JSON Construction and HTTP Request (Lines 165-177)


```routeros
:local jsonData "{\"dt\":\"$cleanTimestamp\",\"message\":\"$cleanMessage\"}"

:local authHeader "Content-Type: application/json,Authorization: Bearer $betterstackToken"

:do {
    /tool fetch http-method=post http-header-field="$authHeader" http-data="$jsonData" url="$betterstackEndpoint" keep-result=no check-certificate=no
    :set successCount ($successCount + 1)
} on-error={
    :set errorCount ($errorCount + 1)
}
```


Here we build the JSON payload manually (because no JSON library) and send it via HTTP POST. The header format is... interesting. RouterOS expects headers as a comma-separated string, not separate header fields. We disable certificate checking because RouterOS certificate validation can be problematic. We wrap it in a try-catch (the `:do { } on-error={}` block) to handle failures gracefully.


### Block 10: Buffer Reset (Lines 180-185)


```routeros
:if ($successCount > 0) do={
    /system logging action set [find name=memory] memory-lines=1
    :delay 200ms
    /system logging action set [find name=memory] memory-lines=100
}
```


After successfully sending logs, we reset the memory buffer. We do this by temporarily setting it to 1 line (which clears it), waiting 200ms, then setting it back to 100 lines. It's a hack, but it works. RouterOS doesn't have a "clear buffer" command, so we work with what we have.


### Block 11: Scheduler Setup (Lines 190-194)


```routeros
/system scheduler add \
    name="betterstack-sender" \
    start-time=startup \
    interval=30s \
    on-event="betterstack-sender"
```


Finally, we create a scheduler that runs the script every 30 seconds. It also runs on startup. This ensures logs are sent regularly in batches, except no fucking globals on startup. Yes, again... those fuckers vanish on reboot!


## Why This Was A Bad Idea


Let me be clear: **I should have rested.** Period. There was no reason to be creating this script at this moment. It was unnecessary, exhausting, and only made my depressive mood worse because it made me feel like I was wasting time and energy on something useless.


But here's the irony: now I'm here, writing about it on my blog, as if it were important or interesting. Life is funny like that, isn't it? (It's not.) And the worst part about it is me writing this fucking useless post that nobody will read, after doing all the useless work for something I don't need. What a great moment... Epic!


## What I Should Have Done

1. **Turn off the computer**
2. **Go to sleep**
3. **Rest**
4. **Do this on a better day, if it was really necessary**


But no. I made the script. Now it's here. And I'm writing about it as if it were an achievement.


## The Lesson If There Is One


**Yes, resting is important.** Sometimes, we keep awake thinking we will get more XP that wat. Sometimes, that only makes things worse. Sometimes, sleep does give XP.


I should have rested. I shouldn't have made this script. That's the truth...


And if someone really needs the script (which I doubt), it's available. But please, use it when you're rested and have your head in the right place. Don't do like me and create unnecessary scripts at inopportune times when you should be sleeping.


---


The script is available on [GitHub](https://github.com/mateuslacorte/betterstack-for-mikrotik) if you really need it. But again: **you probably don't need it.** And if you do, go rest first.
