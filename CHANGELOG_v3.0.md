# Cleo's Piano Play Lab v3.0 — Vertical Rhythm Highway and Hand Guides

## Backup and compatibility
- Original main commit was preserved on GitHub as `backup/pre-vertical-highway-2026-11-01` before deployment.
- All 50 lessons, the Hape F3–F5 and M-Audio 32-key mappings, microphone/MIDI input, chime and piano-volume controls, rhythm clock and three-repetition practice remain intact.
- Lesson data remains in `lessons/lessons.json`. No change to existing lesson IDs or browser progress-storage keys.

## Falling-notes visualizer
- Uses a vertical, top-down Rhythm Highway instead of notes traveling from right to left.
- Upcoming notes fall down toward a PLAY line immediately above their corresponding keyboard keys.
- Notes with explicit LH1–LH5 fingering are blue; notes with RH1–RH5 fingering are orange. Unassigned notes are neutral yellow.
- Chords occupy separate columns simultaneously; long notes have longer bars; one-bar rests and three-pass repetition remain visible.
- Highway and SVG keyboard share one horizontally scrollable container to stay aligned on narrow screens.
- The existing rhythm and scoring engine remains authoritative: the visualization does not advance notes or grade performance.

## Optional illustrated hand guides
- Show finger guides checkbox near Learn/Perform mode.
- Draws transparent, schematic two-dimensional hand illustrations and finger numbers 1–5 directly on the keyboard, aligned to lesson notes.
- Respects provided `handAssignments` and shows no unverified finger assignments when metadata is absent.
- The guides are teaching illustrations, NOT a camera-based assessment of posture or fingering. Teacher review is recommended for physical technique.
- Toggle is saved only in the local browser. It defaults to off.

## Testing
- `npm test` passes 101 automated tests (97 prior plus four additional falling highway/fingering tests).
- A browser test checked 25-key rendering, keyboard/highway alignment, left/right hand overlay activation, settings and lesson navigation at desktop and tablet widths. Physical-device testing remains necessary.

## Deployment
- Upload the complete v3.0 project folder contents at the repository root or use the GitHub commit that accompanies this release.
- Keep `index.html` at root and preserve `lessons/lessons.json` for future curriculum-only changes.
- Use a hard refresh or append `?build=300` to the GitHub Pages URL if the old interface is cached.
