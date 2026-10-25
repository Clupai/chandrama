# Taekwondo Sparring Scoreboard

A live sparring scoreboard for the dojang. It runs in a web browser, so there is nothing to install.

| Screen | Who uses it | What it does |
| --- | --- | --- |
| **Big screen** (`board.html`) | TV, tablet or laptop | Blue vs Red names, scores, gam-jeom, round and clock. Sound at round end. |
| **Referee** (`referee.html`) | Referee's phone | Start/pause the clock, +1/−1 corrections, penalties, stop the match, next match, QR codes. |
| **Judge** (`judge.html`) | 1–3 judges' phones | Technique buttons: punch 1, body 2, head 3, spinning body 4, spinning head 5. |
| **Watch** (`board.html?viewer=1`) | Parents and coaches | Live score, read-only. |

## Match rules built in
- 2 rounds of 1:30 with a 15-second rest between rounds.
- If it's a draw after round 2, there's a round 3. If it's still a draw, a golden point round follows and the first point wins.
- A judge's point counts only when most judges press the same button within 1 second (1 of 1, 2 of 2, 2 of 3).
- A gam-jeom gives the opponent +1.
- The match ends early on a 12-point gap or 5 gam-jeom, or when the referee stops it.

The numbers live at the top of `js/match.js` if you ever want to change them.

## Getting started
See **[SETUP.md](SETUP.md)** for step-by-step instructions.

## Tech
Plain HTML, CSS and JavaScript, with no build step. Firebase Realtime Database (free plan) keeps every device in sync.
Without Firebase settings it runs in demo mode, where the screens connect only between tabs of one browser.
