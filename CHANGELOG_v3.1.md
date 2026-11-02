# Cleo's Piano Play Lab v3.1 — Technique Guides & Focused Highway

## Drawing and guidance
- Replaced the loose schematic finger lines with a connected cartoon hand illustration, including a wrist, palm, nails and five fingers.
- Left and right illustrations are positioned against actual keyboard geometry; numbered contact markers still identify the precise prescribed finger/key combinations.
- Adjustable overlay opacity (0–100%) and a master **Show finger guides** checkbox; preferences saved in browser storage.
- Technique illustrations are instructional suggestions, not webcam-based hand tracking or validation of posture.

## Rhythm highway
- Highway now shows **8 beats** ahead by default, with choices for 6 or 12 beats.
- Drag the grip between the falling notes and the piano, or use Up/Down while the grip is focused, to resize the highway; width stays aligned with the keyboard.
- Beat horizon and height are saved locally.

## Fullscreen practice
- **Fullscreen practice** opens a clean gameplay view showing the lesson, vertical highway, piano and compact Start/Stop/Fingers/Exit controls.
- Browsers denying the Fullscreen API receive a CSS focused-view fallback.
- At lesson completion a game-style result overlay shows key accuracy, presses, expected presses and mistakes. **Try again**, **Next lesson** (only if passed/unlocked) and **Exit fullscreen** reuse the original lesson logic.
- Escape or Exit returns to the normal view.

## Compatibility
- Existing 50 lessons remain in \`lessons/lessons.json\`.
- MIDI, microphone, sound balance, narration, calibration, timing and three practice repetitions are unchanged.
- Backup of v3.0: \`backup/pre-hand-art-fullscreen-2026-11-01\`.
- Local automated tests plus isolated DOM/visual tests were run. Physical MIDI and mobile browser fullscreen still require device tests.

## Update
- Open the published site with \`?build=310\` after deployment to avoid confusing an older cached version.
