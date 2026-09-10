THE GILDED ACE — POKER FIX PACK
================================

FILES
-----
poker.html
poker.css
poker.js
poker-fix.sql

WHAT THIS FIXES
---------------
1. Leave Table now calls poker_leave_room(), removes your seat, unsubscribes
   from Realtime, returns you to the lobby, and refreshes your Ace Credit balance.

2. The SQL patch makes betting rounds advance:
   PRE-FLOP -> FLOP -> TURN -> RIVER -> SHOWDOWN

3. If everyone except one player folds, the remaining player wins immediately.

4. Bots continue automatically when their seat becomes the current turn.

5. A completed hand attempts to start the next hand after about 3.5 seconds
   when at least two seated players still have chips.

INSTALL
-------
STEP 1:
Open Supabase -> SQL Editor -> New query.

Paste the ENTIRE contents of poker-fix.sql and click RUN.

STEP 2:
In GitHub, replace these files:
- poker.html
- poker.css
- poker.js

with the versions in this ZIP.

STEP 3:
Commit the changes.

STEP 4:
Wait for GitHub Pages to deploy, then open poker.html and press Ctrl+F5.

IMPORTANT
---------
This patch expects the poker tables/functions that were created during the
original multiplayer poker setup.

The current poker build still intentionally does not implement full side-pot
logic. A player who cannot cover a call receives an error instead of making a
partial all-in call. Side pots/all-in support can be added as the next upgrade.

PLAY-MONEY ONLY
---------------
Ace Credits are fictional and have no cash value.
