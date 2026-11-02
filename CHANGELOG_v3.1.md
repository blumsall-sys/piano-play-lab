# Cleo's Piano Play Lab v3.1 — Illustrated Hands & Focus Mode

## Backup
The previous v3.0 branch was saved before this change:
`backup/pre-hand-art-fullscreen-2026-11-01`

## What's new
- Replaced floating schematic hand strokes with connected SVG illustrated hands, with five anatomically arranged fingers, visible palm and wrist, and numbered contact markers for lesson-specified fingering.
- Left/right hand guides remain independent. Missing fingering metadata is not invented.
- Added hand-guide master on/off and adjustable opacity from 0–100%. This includes numbered finger markers.
- Vertical Rhythm Highway defaults to eight look-ahead beats and offers six, eight, or twelve beats.
- Added a drag-to-resize handle between the falling-note view and piano. Arrow keys on the focused handle also change its height.
- Fullscreen practice mode keeps just the piano, falling-note Highway and essential Start / Stop / Fingers / Exit controls.
- When a lesson completes in fullscreen, its accuracy and expected/actual key presses appear in the game. Retry and Next Lesson are available; Next is disabled unless the lesson passes.
- Escape returns to normal layout. Fullscreen API is attempted, with an in-page fullscreen-style fallback when unsupported.
- The player's tempo, three repetitions with four-beat rests, MIDI/microphone recognition, calibration, chime/piano volume, 50-lesson catalog and saved lesson progression are unchanged.

## Tests
- JavaScript source syntax verified for changed core modules.
- Four new tests cover beat choices, finger-code parsing, height bounds and fullscreen control wiring; they passed locally.
- A Chromium simulated-ui focus interaction passed opacity changes, entering focus mode, in-game completion and returning to results.
- Live MIDI, microphone, mobile fullscreen and physical technique still require device testing.

## Development
- Editable hand art: `js/finger-guides-v3.js`
- Falling notes: `js/falling-highway-v3.js`
- Focus mode: `js/focus-mode-v31.js`
- Player UI integration: `js/game-ui.js` and `js/main.js`
- Styling: `css/game-v22.css`
- Lesson data stays in `lessons/lessons.json`.

To test GitHub Pages, open the site with `?build=310` and hard-refresh.
