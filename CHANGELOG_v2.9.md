# v2.9 — Repeat every lesson three times

## Root causes found in the actual v2.8 archive
- The repeat engine was instantiated only after pressing the timed **Start with 4-beat count-in** button. Learn Mode completed after the first sequence (Lesson 21: nine notes).
- The Perform Mode repeat engine ended the challenge early as soon as the first successful pass completed, even though the option said three tries.
- Results and progress did not include all repetitions, and the lesson counter initially displayed one pass rather than three.

## Changes
- All 50 lessons use **three full repetitions** by default, including chord and two-hand lessons.
- **Learn Mode** is untimed for notes and fingers: after finishing a sequence, a one-bar four-beat break counts down at the lesson tempo, then the same sequence starts over. Optional audible metronome ticks during breaks; microphone/key input ignored during the break. Completion occurs after the third repetition, not the first.
- **Perform Mode** retains the 4-beat count-in and beat-driven highway, plays all three full passes, and inserts the same 4-beat break. A good first attempt does **not** end the session early.
- Progress counts all repetitions. Lesson 21 now shows **0/27** initially and **27/27** after three complete runs (previously 0/9 and early completion).
- End-of-lesson results show aggregate key presses, total expected presses, and per-repetition scores. Lesson unlock still uses the best complete repetition with at least 70% accuracy; all three repetitions must have finished before results or unlocking.
- Next two repetitions include the same hand/finger guides, notes, durations, and chord targets. No lesson content was modified.
- Existing Hape microphone, M-Audio MIDI, sound balance, narration, Settings/calibration, lesson map, GitHub Pages deployment and JSON lesson updates remain supported.
- Added `tests/repeat-50-v29.test.mjs` to test all fifty lesson structures through three guided loops plus timed repetition logic.

## How to use
1. Choose a lesson, such as **21: Right Hand — Five Fingers**.
2. Leave **3 repetitions · 1-bar breaks** checked (the default).
3. In Learn Mode, play the full sequence; follow the four-beat rest countdown and then repeat twice more. No beat timer is applied to individual notes in Learn Mode.
4. In Perform Mode, tap **Start with 4-beat count-in**. Follow the scrolling score and four-beat rest between all three repetitions.
5. View total key presses and all three individual scores at the end.

## GitHub patch installation
Replace `index.html`, `js/main.js`, `js/loop-practice.js`, `js/rhythm-highway.js`, `js/game-ui.js`, and `js/sound.js` with the files in the patch ZIP. Keep `lessons/lessons.json` as it is. Commit to `main` and wait for Pages deployment. Open the URL with `?build=290` appended and check the version indicator.

## Notes
- A "bar" is four quarter-note beats (4/4) in this beginner prototype; this release does not add variable time signatures.
- The metronome and microphone may interfere when the laptop speakers are loud. Headphones or USB MIDI are preferable for accurate Perform Mode timing.
- Saved prior completion records are not altered or deleted.
- The application uses the existing optional repeat checkbox so you can deliberately disable repetition for diagnostics. It is ON by default.
