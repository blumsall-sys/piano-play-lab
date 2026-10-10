# Piano Play Lab v1.4 — Android and GitHub Pages

## What this version changes

- Responsive phone and tablet layout; touch-sized controls; horizontal keyboard swipe on narrow screens.
- Touch handling distinguishes actual taps from scrolling, so swiping the keyboard doesn't submit accidental notes.
- A mobile audio-start attempt runs during the button press; compatible browsers can unlock Web Audio before asking for microphone permission.
- Mobile microphone constraints have a fallback for devices that reject advanced capture settings.
- Audio analysis supports the full current 25-key **C4–C6** software range (the old algorithm ignored pitches above roughly 575 Hz).
- When browser audio is suspended, a **Resume microphone audio** button is shown.
- When the Android app/browser is backgrounded, microphone/camera capture is stopped for privacy and reliable recovery. After returning, tap **Start listening** again.
- Keeps the lessons, calibration, chimes, results page, scores, and optional camera preview from v1.3.

### Compatibility

- Recommended: current **Google Chrome for Android**. Other up-to-date Chromium browsers may work, but aren't verified on physical devices.
- Works on both tablets and phones via HTTPS.
- Your tablet's built-in microphone is sufficient for testing **one note at a time**.
- Polyphonic chords and finger recognition are **not** part of this version.
- A phone/tablet must be running the site via HTTPS for microphone and webcam access. GitHub Pages provides HTTPS. `http://localhost:8000` works **on the same computer**, but a tablet visiting `http://<laptop-LAN-IP>:8000` generally **will not** be a secure context. Do not use the Windows `.bat` as your Android hosting method.

## GitHub Pages deployment (easiest path)

1. Extract the ZIP on your Windows computer.
2. Sign into GitHub in a browser, and create a **new public repository**, e.g. `piano-play-lab`.
3. Click **Add file → Upload files**. Upload the CONTENTS of `PianoPlay_Phase2A`, not the ZIP itself, and not the extra top-level folder. Make sure `index.html` is directly at the repository root and subfolders `js/`, `css/`, `assets/`, `lessons/` are preserved.
4. Commit the files to your `main` branch.
5. Open **Settings → Pages → Build and deployment**. Under **Source**, select **Deploy from a branch**; choose `main` and `/(root)`, then save.
6. Wait for Pages to publish. The link is usually `https://YOUR-GITHUB-USERNAME.github.io/piano-play-lab/`. Use the actual link shown in Settings → Pages.
7. Open that HTTPS link in Chrome on the tablet.
8. Tap **Start listening**, tap **Allow** for microphone, then look for the level meter moving. Play one isolated piano key.
9. Optionally tap **Turn on camera preview** and grant camera permission. This is a preview only and is not needed for note recognition.

If updating an existing repository, upload/replace the full project (including `index.html` and updated JS/CSS), commit, wait for redeployment, then refresh the tablet tab. If Chrome keeps an old page, open in a fresh tab or clear site data; no service worker/offline cache is installed by this prototype.

## Testing on Android

1. Set the device on a stable stand near your daughter's piano and turn off backing beats / demo music on the piano.
2. Hold the tablet in landscape for more keyboard width or portrait for a taller interface. On a narrow display, **swipe the keyboard left/right**; tapping, not dragging, plays notes.
3. Check **Check note detector** to run a synthetic pitch test (does not test the microphone).
4. Select microphone input (often only **System default** is available on Android) and choose **High** sensitivity.
5. Click **Start listening** and grant access. Clap to check the sound meter. The level meter should change, even if a clap does not register as a note.
6. Play and hold a single key. Watch the note/frequency readout. Turn up the toy piano's volume or move the tablet slightly closer if the mic meter is weak.
7. If the pitch is consistently sharp/flat, try the existing C4/G4 reference calibration. This is a microphone-frequency offset, not a way to change the physical keys.
8. Complete a lesson. Verify the accuracy percentage, attempts/ideal/wrong counts, success chimes and Restart/Next buttons.
9. Switch to another app and return. Capture will have stopped; tap **Start listening** to resume.

## Permissions and troubleshooting

- In Chrome, tap the icon near the site address → **Permissions / Site settings → Microphone → Allow** (the wording varies by Android/Chrome version). Android system settings may also need **Apps → Chrome → Permissions → Microphone → Allow while using the app**.
- If microphone access is unavailable, check the URL starts with `https://`. Don't open `index.html` as a file on Android.
- If the microphone meter moves but the pitch is wrong, try the default **Piano** tone on the Hape keyboard, disable **Smart Play** and drum/backing music, and play a single note. Complex tones can cause octave or harmonic mistakes.
- If a success chime triggers false notes, lower the tablet's speaker volume or place the tablet microphone farther from its speakers.
- If you return to the tab and detection stops, click **Stop listening** (if present), then **Start listening**, or use **Resume microphone audio** if it appears.

## Local Windows testing

Continue using `START_WINDOWS.bat` and `http://localhost:8000/` on your laptop; nothing else is required. The launcher is not needed after GitHub Pages deployment.

## Current musical-layout caveat

This release retains the v1.3 C4–C6 mapping, so it doesn't silently change your existing lessons. In your Hape photo, the left-hand black-key grouping appears to start with a three-black-key sequence, which suggests an F-to-F *physical key layout* rather than C-to-C. The precise **octave numbers and emitted pitches should be verified by playing the physical keys and checking their detected frequencies** before treating the printed note names as authoritative. A future keyboard-range/profile control can represent this explicitly.

## Files changed

- `index.html` — Android guidance, secure-audio-resume button, responsive metadata.
- `css/styles.css` — phone/tablet media queries and keyboard scrolling.
- `js/keyboard.js` — touch tap vs swipe recognition.
- `js/audio-input.js` — Android audio start/resume and high note recognition.
- `js/main.js` — suspended audio status, foreground/background handling, error messages.
- `tests/core.test.mjs` — high-register pitch-detection test coverage.
