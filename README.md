# Cleo's Piano Play Lab v2.8 — 50-Lesson Curriculum

A free, self-hosted music-learning game. This update **retains the first 20 lessons** and adds 30 beginner lessons covering finger positions, left/right-hand coordination, theory, rhythm, familiar public-domain songs and easy chords.

**New:** Lessons are now loaded from **`lessons/lessons.json` first**, instead of relying exclusively on the copy embedded in `index.html`. Once you deploy v2.8, adding lessons using the existing schema requires updating only `lessons/lessons.json` on GitHub. No recompilation or additional deployment configuration is required. The embedded 50-lesson catalog is a last-known-good backup if the JSON fails to load.

## Quick start — Windows
1. Extract the ZIP. Open the `Cleos_Piano_Play_Lab` folder.
2. Run `START_WINDOWS.bat`. Keep the server console open.
3. Open `http://localhost:8000/?build=280` in Chrome or Edge.
4. Confirm the status says `v2.8 READY · 50 lessons ... lessons.json`.
5. Open **Lessons**. You should see 50 cards. To try Lessons 21–50 immediately, go to **Settings → Unlock all lessons for testing**.
6. To test your physical Hape piano, select Hape, start the microphone, and allow browser access. For M-Audio, select the M-Audio layout and connect via USB MIDI.

## Publish to GitHub Pages
1. Upload the contents **inside** the extracted project folder to your existing GitHub repository, replacing older files. Keep `index.html` at the repository root.
2. Commit/push to `main` and wait for GitHub Pages to deploy.
3. Open your HTTPS GitHub Pages site with `?build=280` appended; confirm 50 lessons and `lessons.json` in the status. Refresh if an older cached version is visible.
4. Future curriculum updates: edit/upload **only `lessons/lessons.json`**. See [ADDING_LESSONS_ON_GITHUB.md](ADDING_LESSONS_ON_GITHUB.md).

## Gameplay overview
- **Home:** welcome, Continue and saved progress.
- **Lessons:** 50 sequentially unlocked lessons and best scores (70% note accuracy to pass). A Settings toggle unlocks all for testing.
- **Practice:** Rhythm Highway, upcoming notes/chords, note timing, three attempts with one-bar rests, Learn and Perform modes, metronome and sound-balance controls.
- **Finger guide:** Lessons 21–50 display left/right hand (`LH`/`RH`) and suggested finger numbers (1 thumb through 5 little finger) wherever specified.
- **Settings:** choose Hape F3–F5 microphone or M-Audio Mini 32 MK3 USB MIDI, connect MIDI, choose volume levels and voice, calibrate microphone F3/C4, optional webcam preview.
- **Results:** completed/expected presses, note accuracy, on-beat grading where available and saved local history.

### Input limitations
The app can verify **notes and timing**, not actual fingers or posture. Finger numbers show suggested technique, not measured technique. Hape microphone chord recognition is experimental; **Build Chord** mode is recommended. For simultaneous chords and held notes, USB MIDI is more reliable. The M-Audio has no internal piano sounds; the browser supplies them.

No cloud account, paid API, or runtime npm installation is required. Progress is stored in the current browser and does not automatically sync between devices. In the lesson map, Export Practice JSON makes a backup. Clearing browser data removes saved progress.

## Files
```
index.html                    Main application + 50-lesson offline fallback
lessons/lessons.json         PRIMARY curriculum source for GitHub edits
js/catalog-loader.js         JSON-first loader with validation/fallback warnings
js/lesson.js                 Lesson validation and note/chord progression
js/game-ui.js                Home, map, practice, settings, saved progress
js/rhythm-highway.js         Continuous beat-driven notes with finger cues
js/main.js                   App initialization, microphone, MIDI, audio
css/                         Styling and layout
assets/                      SVG artwork
START_WINDOWS.bat            Windows localhost server
ADDING_LESSONS_ON_GITHUB.md  One-file lesson authoring instructions
CURRICULUM_50_LESSONS.md     Full updated curriculum outline
```

Run `node tools/validate-lessons.mjs` to check the current JSON catalog, or `node --test tests/*.test.mjs` to run the entire optional developer regression suite. For producing a new ZIP release with a synchronized offline fallback, run `python tools/sync-lessons.py`; **that sync is not needed for normal GitHub lesson edits**.
