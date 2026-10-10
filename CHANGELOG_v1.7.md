# Piano Play Lab v1.7 — Voice-Guided Lessons

## New features

- Added optional **Read instructions / Replay instructions** voice button for each of the four first-phase lessons.
- Added **Stop voice**.
- Added English voice selector and speech-rate choices.
- Added an on-screen text transcript of the spoken lesson.
- Wrote dedicated friendly narration for each existing lesson in `lessons/lessons.json`.
- Automatically pause microphone lesson scoring during narration and for ~1.1 seconds afterward to avoid speech being counted as key presses.
- Reset the microphone note latch when narration starts and ends.
- Cancel narration on lesson change, restart, next lesson, background tab switch, or page exit.
- Kept a strong reference to the active utterance for Chrome/Android reliability.
- Preserved F3–F5 key-only piano, mobile/tablet layout, pitch correction, accuracy scoring, success chimes and optional camera preview.

## Tech

- Native `window.speechSynthesis` with `SpeechSynthesisUtterance`.
- No extra npm package, TTS server, credentials, paid services, or recordings.
- `js/voice-guide.js` cleanly isolates voice playback from the microphone module.
- English voice names are detected from the browser, and a feminine-sounding name is preferred if present; gender is not guaranteed.
- Custom reading scripts are editable via `spokenInstructions` in `lessons/lessons.json`.
- Versioned script/style imports updated to `?v=1.7` for GitHub Pages caching.

## Testing

- 23 automated Node tests passed, including 6 new voice-guide tests.
- Page behaviour validated in headless Chromium with a simulated browser speech engine: correct lesson 1 text, voice menu, read/replay, stop, lesson switching, and no page errors.
- Live microphone input and real speech playback on an Android tablet were not available for hardware verification in this environment. Test on your device after publishing.
