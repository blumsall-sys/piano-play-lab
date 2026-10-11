# Cleo's Piano Play Lab v2.5

**NEW: Three-Try Rhythm Highway.** In Practice → Perform, leave **3 tries · 1-bar breaks** enabled and press **Start with 4-beat count-in**. The melody scrolls up to three times, with four empty beats between attempts. Results list the accuracy for every try. See [`REPEAT_CHALLENGE_v2.5.md`](REPEAT_CHALLENGE_v2.5.md).

# Cleo's Piano Play Lab v2.4

**New in v2.4:** Dual keyboard layouts. Hape Toy Piano (25 keys, F3–F5, microphone) is the default. Select M-Audio Keystation Mini 32 MK3 (32 keys, C–G, USB MIDI) in Settings. Also includes a voice instruction button in the piano row, red/green microphone status, USB MIDI note sound and first-C key mapping.

**Start here:** `M_AUDIO_SETUP_v2.4.md` for the new controller, `DEPLOY_GITHUB_PAGES_v2.4.md` for website publishing, and `CHANGELOG_v2.4.md` for changes and testing.

# Cleo's Piano Play Lab — v2.3 Settings & Calibration Fix

A free, self-hosted, touchscreen-friendly HTML5 piano-learning game. Built for the 25-key Hape-style toy piano shown in the reference photo, **F3 to F5** (15 white keys, 10 black keys). Works locally on Windows and on GitHub Pages with HTTPS. No cloud or paid API is required.

## Get started on Windows
1. Extract the ZIP. Open the **Cleos_Piano_Play_Lab** folder.
2. Double-click **START_WINDOWS.bat**. Keep the PowerShell console open.
3. If the browser does not open automatically, visit **http://localhost:8000/?build=230**.
4. Click **Continue playing**, then test the on-screen piano before enabling microphone input.
5. Open **Settings > Microphone setup**, tap **Start listening** there, grant microphone permission and confirm the live meter moves before using **Piano reference check**. You can keep listening when moving back to Practice.

If port 8000 is busy, close your old Piano Play Lab server. Python alternative from inside this project folder: `py -3 -m http.server 8000 --bind 127.0.0.1`.

## GitHub Pages deployment
1. Create a GitHub repository or update your existing Piano Play Lab repository.
2. Upload **the files inside Cleos_Piano_Play_Lab**, not the parent folder. `index.html` must be at the repository root.
3. Commit/push to `main`. Under **Settings > Pages**, use **Deploy from a branch**, `main`, `/(root)`.
4. Open the GitHub Pages HTTPS URL from your Android tablet, e.g. `https://USERNAME.github.io/REPO/?build=230`. Grant microphone permission if requested.
5. If an old page is still visible, use a private tab or refresh; confirm the browser title **Cleo's Piano Play Lab · Rhythm Highway v2.3**.

Detailed instructions: `DEPLOY_GITHUB_PAGES_v2.3.md`.

## Settings calibration (v2.3)
1. Open Settings and tap **Start listening** in the microphone card. The microphone does not need to be started from Practice first.
2. The meter should respond to piano notes. Tap **1 · Capture F3**, then press and hold the physical far-left key (F3, ~174.61 Hz) for around two seconds.
3. Tap **2 · Capture C4** and hold the fifth white key (~261.63 Hz).
4. If both reference readings are stable and agree, tap **Apply measured offset**. The compensation stays saved on this browser and is used automatically when you play lessons.
5. Use **Clear correction** to return to standard pitch. Switch microphones or retake the references at any time.
6. You can move between Practice and Settings with the microphone still connected; note scoring is automatically disabled outside the Practice screen.

**Important:** Pitch calibration compensates for stable offsets; it cannot fix inaccurate harmonic or polyphonic recognition. A detected 100-cent shift may indicate a transposed instrument.

## Four screens
- **Home**: child-friendly greeting, continue, short progress summary.
- **Lessons**: twenty lessons, best result and sequential progression. Passing requires **70% or better note accuracy**. Testing override under Settings > Unlock all lessons.
- **Practice**: three checkpoints (Discover, Practice, Perform), visible current/next notes or chords, moving Rhythm Highway with fixed PLAY line, metronome/tempo, on-screen or physical piano input.
- **Settings**: narration voice, microphone settings and calibration, chord mode, optional MIDI, camera preview and an advanced lesson selector.
- **Results**: accurate key press metrics, rhythm/hold scores where measurable, stars, retry or next lesson.

## Learn and Perform
**Learn**: the notes remain at the PLAY line until the student completes each event. No timing pressure; microphone or touch recognition advances the lesson.

**Perform**: select this tab, then press **Start with 4-beat count-in**. Events travel towards and past the PLAY line at a continuous beat rate. The system grades notes/chords that are detected against the score's event times. It does not silently skip an unplayed note, so a learner who falls behind may need to restart. Adjust BPM, ¼×, ½×, 1×, 1.5× or 2× speed. Toggle audible metronome clicks.

**Notation**: the highway is a visual rhythmic note-name view, not engraved staff notation. Notes and chords are grouped and their widths show their durations. Formal MusicXML engraving remains a future enhancement.

## Three checkpoints
Every lesson shows **Discover**, **Practice** and **Perform** checkpoints spanning the beginning, middle and end of its existing events. Completed checkpoints are indicated visually. Finishing the lesson with >=70% key accuracy unlocks the next lesson. They are progress checkpoints, not three different generated exercises with separate tests.

## Input and limitations
- Microphone: note-on timing is approximate. Single-note recognition works best. Chord-building is recommended for an acoustic toy piano. Polyphonic simultaneous microphone detection is experimental.
- MIDI: compatible digital keyboards can supply accurate simultaneous note-on/note-off messages and physical held durations. Web MIDI availability depends on browser/device.
- On-screen keyboard: touch or mouse supports press duration.
- Spoken instructions use the browser's Web Speech API. Each lesson begins **“Hey Cleo, for this lesson we are going to…”**. Voice quality and available voices depend on the device.
- The webcam is a user-controlled preview only, not finger recognition; no recording or uploads occur.
- The metronome, chimes and narrated voice may be captured by an open microphone. Headphones help. Adjust microphone timing offset under Settings if responses register late.
- Practice history and unfinished-lesson position are stored in **this browser's local storage**. They do not sync across devices. Clearing site data removes saved progress. Export practice JSON on the Lessons screen to keep a copy.
- Progress is an educational estimate, not a certification of musical technique.

## Project structure
```
index.html                  Website and embedded 20-lesson catalog
css/styles.css             Retained styling and piano geometry
css/game-v22.css           Home/Map/Practice/Settings/Results styling
js/main.js                 Audio input, keyboard, MIDI, grading, lesson events
js/game-ui.js              Navigation, unlocks, checkpoints, local progress
js/rhythm-highway.js       Constant-speed canvas rhythm highway
js/rhythm.js               Timeline, timing and hold grade mathematics
js/metronome.js            Audio click and count-in scheduler
js/voice-guide.js          Free browser text-to-speech
js/progress-store.js       Completed practice history
lessons/lessons.json       Editable lesson definitions
assets/                    Editable vector artwork and piano references
START_WINDOWS.bat          Launch local server
```

## For developers
The app uses native JS modules and has no runtime npm dependencies. Run `npm test` with Node.js (optional) to execute the full regression suite. To update lesson narration or pitches, edit `lessons/lessons.json` **and** synchronize the `embedded-lessons` JSON in `index.html` to keep the two identical. Running `node --test tests/*.test.mjs` checks consistency.

## Release
v2.3 (October 2026). See `CHANGELOG_v2.3.md`.
