# Cleo's Piano Play Lab v2.5 — Rhythm Highway Repeat Challenge

## New in v2.5

**Three-try Rhythm Highway** is enabled by default in the Practice screen. Each attempt plays the full score once. The scrolling note blocks then leave the screen for a **four-beat (one 4/4 bar) rest**, before the next copy of the melody scrolls into view. The beat and visual timeline use the same tempo clock.

- Four-beat count-in before the first attempt.
- Three tries, with a four-beat rest between consecutive tries.
- Each try independently tracks correct key presses, wrong attempts, skipped/missed notes and timing grades.
- Notes and chords appear again in the scrolling highway for the next attempt.
- The keyboard's expected note(s) reset for each try.
- Completing **all** required notes/chords in a try with no misses and at least 70% correct key-press accuracy passes the melody. In Perform Mode, at least 70% of event onsets must also be judged on time (except microphone chord-building mode, which cannot verify simultaneous onset reliably).
- A successful attempt finishes the challenge early. Otherwise, after the third try the results show all three attempts, and the lesson remains available to retry.
- Missing a note or chord no longer leaves the lesson stuck waiting for a note that has already passed the PLAY line; it is recorded as missed and the current target advances.

## Using it

1. Open the app and choose your lesson.
2. Select **Perform · on beat**.
3. Make sure **3 tries · 1-bar breaks** is selected (enabled by default).
4. Choose BPM, speed (¼×, ½×, 1×, 1.5×, 2×), and whether to hear metronome clicks.
5. Press **Start with 4-beat count-in**.
6. Play when the notes or chords reach the turquoise **PLAY** line. When a run finishes, the highway shows **REST · 4 BEATS** before the next try.
7. Review the results screen or restart and try again.

To use the old single-pass mode, **uncheck `3 tries · 1-bar breaks`** before starting. The original Learn Mode still supports patient untimed note practice.

## Understanding the score

- **Key accuracy**: correct physical/on-screen note presses divided by accepted presses plus missed expected notes. Missed notes count against accuracy rather than being ignored.
- **Timing**: MIDI key-on timestamps or detected microphone onsets relative to the musical beat. Microphone timing is approximate and uses the offset in Settings.
- **Chords**: the USB MIDI mode is the most reliable option for simultaneous chords and precise key release. Microphone chord-building mode may need slower tempo settings.
- **Best try**: results highlight the best attempt and list each completed try separately. A failed three-try challenge will not unlock the next lesson even if it contains some correctly detected notes.

**Important:** On some computers/tablets the built-in speaker's metronome or chimes can be picked up by the microphone. Headphones or USB MIDI are recommended for accurate timing.

## Files changed

- `js/loop-practice.js` — new framework-independent repeat and scoring controller
- `js/main.js` — reset, grading, rest transitions, results, UI handlers
- `js/lesson.js` — record expected notes that were missed
- `js/rhythm.js` — per-attempt rhythm/hold grading
- `js/rhythm-highway.js` — render repeated scores and the rest bar continuously
- `js/game-ui.js` — separate pass/fail results and progression
- `index.html` — new repeat toggle and feedback elements
- `css/game-v22.css` — repeat HUD and results styling
- `tests/loop-v25.test.mjs` — new loop, chord, and success/fail tests

All existing 20 lessons, Hape F3–F5 and M-Audio Mini 32 layouts, narration, calibration, chords, saved progress, Windows launcher, and GitHub Pages support remain included.
