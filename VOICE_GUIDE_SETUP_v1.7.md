# Piano Play Lab v1.7 — Browser Voice Guide

## What is new

The original 25-key **F3–F5** toy-piano layout, the microphone detector, pitch reference capture, four lessons, chimes, and congratulations screen are preserved. v1.7 adds:

- **Read instructions** button for the selected lesson.
- Four short spoken introductions, written for a young beginner, stored as the editable `spokenInstructions` field in `lessons/lessons.json`.
- English voice dropdown. **Automatic English voice** prefers certain traditionally feminine voice names if present, but the browser does **not** expose a dependable gender selector and not all devices offer such a voice.
- Talking speed control: Slow, Gentle, Normal, Fast.
- **Replay instructions** and **Stop voice** controls.
- Live text of the narration for reading along.
- Microphone **note scoring pauses during voice playback and for about 1.1 seconds afterward**, so the narrator is not graded as a piano note. The microphone level indicator may still respond to the speaker.

This is browser text-to-speech, **not a conversational AI voice assistant**. It does not listen for spoken commands or upload recordings. It uses whichever speech voices are offered by Windows/Android and the browser. No subscription or API key is needed. Availability and whether a voice works fully offline depend on the device and installed voice engine.

## Windows testing

1. Extract this archive.
2. Open the `PianoPlay_Phase2A_v1.7` folder and double-click `START_WINDOWS.bat`.
3. Open `http://localhost:8000/` in Chrome or Edge.
4. Choose lesson 1, **Find the First F**.
5. Click **Read instructions**. Listen for the English voice. Voice starts after a tap, not automatically.
6. To change the voice, use **English voice**. If the list is empty or only shows Automatic, Chrome may still use its system default. You can refresh after a moment to load voices.
7. Set **Talking speed** to Gentle or Slow if preferred. Tap Replay instructions to hear it again.
8. Start the microphone and try voice narration while the mic is active. The app should not advance lesson notes during narration.
9. When speech ends, wait briefly, then play the F3 piano key and continue normally.

## Android tablet / phone testing

1. Publish **all files in the extracted folder** to the GitHub repository root with `index.html` at root.
2. In GitHub **Settings → Pages**, publish `main` / `/(root)` if not already configured.
3. Wait for the green deployment in GitHub Actions, then open your existing GitHub Pages HTTPS URL using **Chrome for Android**.
4. Tap **Read instructions**. The browser/Android text-to-speech engine will provide the voice if supported. No microphone permission is required just to hear instructions.
5. To detect the physical piano, tap **Start listening**, grant microphone access and play a note **after narration ends**.
6. If Android blocks playback, use Chrome, turn media volume up, and try the Read instructions button again. You may need to configure Android text-to-speech voices in device settings.
7. Swiping to another app stops listening and narration; restart them on your return.

## Editing what the voice says

Open `lessons/lessons.json`. Each lesson has a `spokenInstructions` property. Edit this text without changing note arrays, filenames or IDs. Use words like **F three** and **B flat three** for understandable speech. Restart or refresh the app after editing.

## Code files involved

- `js/voice-guide.js` — speech engine wrapper, English voice filtering, play/stop state and cancellation protection.
- `js/main.js` — voice UI wiring and microphone-scoring suppression.
- `index.html` — accessible speech controls and visible spoken-script text.
- `css/styles.css` — responsive voice card for phones and tablets.
- `lessons/lessons.json` — spoken text for lessons 1–4.

## Limitations and troubleshooting

- Voice availability, accents and audio quality depend on the operating system and browser. A female-sounding English voice is *preferred*, not guaranteed.
- The browser may use cloud-backed voices depending on Android's speech engine; for guaranteed offline narration, prerecorded local voice files would be the next option.
- Browser microphone scoring is paused during narration and resumes after a short gap, but speakers can still produce real audio. Keep tablet volume moderate or use headphones if false positives occur.
- On Android, a browser tab can be suspended in the background; returning may require tapping Start listening again.
- The Voice Guide does not add any speech recognition or control of the microphone from speech.

## Testing

Run `node --test tests/*.test.mjs` to execute both the original detector tests and new voice-guide unit tests if Node.js is installed. The ordinary app does **not** require Node.js or npm to run; GitHub Pages serves the files statically.
