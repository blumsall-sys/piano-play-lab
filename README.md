# Piano Play Lab — Phase 2A v1.4 (Android/Tablet Ready)

**Start here:** Read [`ANDROID_GITHUB_SETUP_v1.4.md`](ANDROID_GITHUB_SETUP_v1.4.md) for uploading to GitHub Pages and testing on Android tablets/phones. The site is all HTML/CSS/JavaScript and does not need a paid service, account, build step or JavaScript dependencies. Microphone/camera access requires user permission and HTTPS (or localhost on the device serving the page).

**Compatibility:** The current v1.3 lesson/keyboard note mapping C4–C6 is retained. The photo of the Hape toy piano appears to have a different F-to-F black-key grouping, so verify the note/octave mapping before assuming it matches the physical instrument. Details in the Android setup guide.

---

# Piano Play Lab · Phase 2A v1.2 (pitch accuracy + piano reference check)

**NEW:** If your electronic piano reports notes one semitone sharp (e.g. C4 as C♯4), see [`REFERENCE_CHECK_v1.2.md`](REFERENCE_CHECK_v1.2.md). v1.2 adds raw-frequency/cents readout, a more accurate pitch-analysis path, and an optional two-note C4/G4 calibration check. The correction is never applied automatically.

**If the original app displayed "Listening for piano sound" without registering any sound:** read [`AUDIO_FIX_v1.1.md`](AUDIO_FIX_v1.1.md) first. v1.1 adds a microphone picker, a live signal meter with dBFS/RMS levels, adjustable sensitivity and a synthetic pitch-algorithm self-test.

A child-friendly 2D, browser-based piano demo with 25 SVG keys, microphone single-note recognition, four interactive lessons, synthetic note examples, optional webcam **preview**, and rewards. All code and illustrated SVG layers are included, with **no external JavaScript dependencies, accounts, or API keys**.

**Important:** this is an educational prototype, not a clinical-grade pitch detector or fingering assessor. It recognizes *one note at a time*. Chords, polyphonic recognition, MIDI, sheet-music notation and cartoon hand sprites are later phases.

## 1. Download and extract

1. Extract `PianoPlay_Phase2A_Android_Ready_v1.4.zip` anywhere on your Windows laptop, e.g. `Documents\PianoPlay_Phase2A`.
2. Open the extracted `PianoPlay_Phase2A` folder.
3. **Do not double-click `index.html` to launch**. Browser file URLs prevent the lessons JSON from loading. Use a local server.

## 2. Run locally on Windows (no extra software)

1. Double-click **`START_WINDOWS.bat`**.
2. Windows PowerShell starts a local HTTP server on `127.0.0.1:8000` and opens `http://localhost:8000/` in your browser.
3. If Windows displays a safety prompt for a downloaded script, review the supplied `START_WINDOWS.bat` and `tools/local-server.ps1` before choosing to run it.
4. Keep the server console window open while using the app. Close it or press `Ctrl+C` to stop the server.
5. If port 8000 is already occupied, close whatever is using it, or use the Python alternative below with another port.

**Alternative for anyone with Python installed:** open Command Prompt inside the project folder and run:

```bat
py -3 -m http.server 8000 --bind 127.0.0.1
```

Then open `http://localhost:8000/`. On macOS/Linux use `python3 -m http.server 8000 --bind 127.0.0.1`.

A modern desktop **Chrome or Edge** browser is recommended for the first test.

## 3. Check mouse/touch playback first

1. Open **Meet Middle C** (selected by default).
2. The next expected key is shown in **gold** on the virtual piano.
3. Click the gold key (or any other key to hear a note). It should highlight **green**, make a short tone, and advance the lesson when correct.
4. Try changing lessons, changing note labels, clicking **Hear next note**, and **Restart lesson**.
5. The virtual keyboard works even if you do not grant microphone or camera permission.

## 4. Test with an acoustic or electronic piano

1. Place the laptop 0.5–1.5 m from the piano, with the microphone facing the keys and minimal background noise.
2. Select **Meet Middle C**. Start with one note at a time (no chords or sustain pedal).
3. Select the right microphone in **Microphone input**, then click **Start listening** and allow browser permission. The green indicator means the microphone was opened. **Clap to confirm the level meter actually moves before testing notes.**
4. Play **Middle C (C4)** on the real piano and hold briefly (~0.2–0.5 s). You should see the heard note and pitch confidence displayed, then the lesson advances.
5. Release each key before playing the next. For repeated notes, pause briefly so the microphone can identify a new attack.
6. Use **Hear next note** for a reference. The app temporarily ignores its own demo sound so its speakers don't earn a point.
7. If the microphone misidentifies notes, move the laptop closer, turn down background sound, play notes separately, and check the diagnostic message.

Some instruments (especially acoustic pianos) produce strong harmonics. An inexpensive laptop mic can occasionally detect the wrong octave or fail to detect a pitch. The scoring is intentionally forgiving: no timer, no penalty for incorrect/uncertain notes.

## 5. Optional webcam preview

Click **Turn on camera preview** and grant camera permission. Point your webcam toward the keyboard. This is a local on-screen preview only, **not hand tracking**. You can mirror the preview. Audio and video are not recorded, sent to any server, or saved.

For correct note input, **the microphone alone is sufficient**. You do not need a webcam.

## 6. Put it on GitHub Pages

A GitHub account and a public repository are sufficient for this static demonstration on GitHub Free.

1. Visit <https://github.com/new> and create a public repository, e.g. **`piano-play-lab`**. Do not select an initial README since one is included here.
2. On the repository's **Code** tab, choose **Add file → Upload files**.
3. Open the extracted `PianoPlay_Phase2A` folder, **select all its contents**, and drag them into the GitHub upload page. Make sure `index.html` goes to the repository root; **do not upload just the ZIP archive**. GitHub may not preserve hidden `.nojekyll` when drag-uploading, but the site will still work without it.
4. Commit the uploaded files.
5. Open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, then choose `main` and `/(root)`, and click Save.
6. After GitHub completes deployment, open `https://YOUR_USERNAME.github.io/piano-play-lab/` (replace `YOUR_USERNAME`).
7. Test mouse keys first, then **Start listening** and grant microphone access. GitHub Pages uses HTTPS, which is required for microphone/camera permissions outside local development.

If GitHub's web uploader fails on folders, use **GitHub Desktop** to commit the extracted project folder into the repository instead. This is a standard static site with no build commands, package manager or environment variables.

**Privacy note:** GitHub Pages serves the code and SVGs. Microphone and webcam data are handled locally by the browser only; the app doesn't upload recordings or analytics. Anyone with the URL can access a public Pages site; do not put personal recordings or private data in the repository.

## 7. Troubleshooting

| Symptom | Check |
|---|---|
| Blank page or lesson not loading | Run `START_WINDOWS.bat`, visit localhost instead of opening `file:///.../index.html`. |
| Microphone button says unavailable | Use `http://localhost:8000/` or HTTPS; allow microphone in browser/site settings. |
| Camera preview does not appear | Check camera permission; close any other app holding the camera. |
| Wrong octave/note | Use one clean note, avoid sustain pedal, try another mic position. Some harmonics confuse pitch estimation. |
| False positive from speaker | Turn down or mute laptop speakers while testing microphone, or use headphones for demonstration sound. |
| Browser asks again for permissions | Permissions are saved by site origin, so localhost and GitHub Pages may each require approval. |
| Server won't start | Another program may use port 8000. Alternative: `py -3 -m http.server 8001 --bind 127.0.0.1` then visit `http://localhost:8001/`. |
| Incorrect/missing styles | Upload **all** `css`, `js`, `lessons`, and `assets` folders, not only `index.html`. |

## 8. Project structure

```
PianoPlay_Phase2A/
├─ index.html                 HTML application
├─ css/styles.css             Layout, colours, mobile styling
├─ js/main.js                 App wiring, microphone/webcam UI
├─ js/music.js                MIDI/pitch/note helpers
├─ js/pitch.js                Offline, single-note YIN pitch detector
├─ js/audio-input.js          Browser microphone capture and stabilization
├─ js/calibration.js          Reference-note measurement and correction safeguards
├─ js/keyboard.js             Generated 25-key SVG piano
├─ js/lesson.js               Pure lesson state machine
├─ js/sound.js                Demo tone playback
├─ lessons/lessons.json       Four editable note-sequence lessons
├─ assets/logo-mark.svg       Editable artwork
├─ assets/hero-notes.svg      Editable artwork
├─ assets/layers/             Original SVG keyboard and reward layers
├─ tools/local-server.ps1     Windows-only local static server
├─ START_WINDOWS.bat          One-click launcher
├─ AUDIO_FIX_v1.1.md          Mic diagnosis and replacement instructions
├─ REFERENCE_CHECK_v1.2.md    New pitch-accuracy / reference guide
├─ ANDROID_GITHUB_SETUP_v1.4.md  Tablet and GitHub Pages instructions
├─ tests/                     Automated note + pitch unit tests
└─ README.md                  This guide
```

## 9. Edit lessons / colours

- Change note sequences in `lessons/lessons.json` using **MIDI numbers**: C4=60, D4=62, E4=64, F4=65, G4=67, A4=69, C5=72, C6=84.
- The lesson engine accepts MIDI integers from **60 through 84**.
- Change main colours in `css/styles.css` `:root`, especially `--gold`, `--teal`, `--ink`.
- Change the key layout or spacing in `js/keyboard.js`.
- Change microphone sensitivity directly in the **Input sensitivity** dropdown. The default in `js/audio-input.js` is now `0.0025` RMS (formerly 0.012). Lower = more sensitive but also more false triggers.
- Each original graphic in `assets/` is an editable SVG. The live piano itself is generated with SVG shapes in JavaScript, **not** flattened to a picture.

## 10. Verification and scope

The included `tests/core.test.mjs` runs with Node 20+ (optional, only for developers): `node --test tests/core.test.mjs`. No tests require a microphone to run. Real device recognition must be checked on your own laptop and piano.

**Included:** 25 keys, four basic lessons, demo audio, single-note mic detection, keyboard highlighting, confidence + loudness diagnostics, optional local webcam preview, original editable vector artwork, Android phone/tablet layout, background microphone recovery, local server scripts, GitHub hosting instructions.

**Not included (later phases):** verified vector hand sprites, finger technique assessment, proper sheet-music renderer/MusicXML, chords/polyphonic pitch recognition, MIDI input, video recording, or live score synchronization.

Copyright © 2026. Example artwork and code were generated for this prototype; the runtime does not load third-party artwork or scripts.
