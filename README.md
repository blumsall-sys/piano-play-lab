# Piano Play Lab v1.6 — F3 to F5 toy-piano range

This update shifts the pitch labels and recognition by **one octave down** to match the observed leftmost key on the Hape miniature piano. The physical SVG key count and layout are unchanged: **25 keys, 15 white, 10 black**, with black-key groups **3–2–3–2**. There are no decorative toy-piano hardware buttons.

## Pitch mapping

| Key | MIDI | Reference frequency |
|---|---:|---:|
| Leftmost F3 | 53 | 174.61 Hz |
| Fifth white key C4 | 60 | 261.63 Hz |
| Middle F4 | 65 | 349.23 Hz |
| Rightmost F5 | 77 | 698.46 Hz |

**Important:** This mapping assumes the leftmost physical key sounds F3. The note group pattern can be established from the photograph, but pitch must be established by listening or measurement. You can see measured raw frequency while the mic is active. The reference-capture tool corrects small tuning/estimation offsets, **not octave mismatches**.

## Windows setup

1. Extract the ZIP, enter the `PianoPlay_Phase2A` folder and run `START_WINDOWS.bat`.
2. Open `http://localhost:8000/` if the browser does not open.
3. Hard-refresh the page (`Ctrl+Shift+R`) if you are replacing an earlier version.
4. Test a virtual key with your mouse, then press **Start listening** and allow microphone access.
5. Play the leftmost physical F key on its own. It should show F3 near 175 Hz.
6. To calibrate small deviations, use **Capture F3** then **Capture C4** (fifth white key).

## Android / GitHub Pages

1. Upload the *contents* of the `PianoPlay_Phase2A` folder to the **root** of a GitHub repository (so `index.html` is at the root).
2. In the repository Settings → Pages, deploy `main` / `(root)`.
3. Use the HTTPS GitHub Pages link in Android Chrome, allow microphone permission, and play one note at a time.
4. The `.bat` launcher is for local Windows use only.

## Features

- SVG keyboard, touch controls, all four beginner lessons, chimes and congratulations/results screen.
- Microphone single-note recognition with a pitch stability filter and optional two-reference calibration.
- Diagnostic input meter, optional camera preview, restart/next buttons.

## Limitations

- Single notes only, not polyphonic chords. Complex toy-piano timbres or room noise can fool frequency estimation.
- Score counts **recognized note events**, not verified finger presses.
- Camera preview does not perform finger recognition.
- A physical toy piano might emit inharmonic tones or have tuning differences; compare measured raw Hz against the reference frequencies before assuming a software issue.

## Development

- `js/music.js`: range and note helpers
- `js/audio-input.js`: microphone analysis
- `js/keyboard.js`: 25-key layout
- `lessons/lessons.json`: 4 beginner lessons
- `tools/export-keyboard-preview.mjs`: generated SVG reference
- `tests/core.test.mjs`: unit tests (`npm test`, Node 20+)
