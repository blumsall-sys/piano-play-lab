# v2.1 – Rhythm Practice and Score Following

- All 20 lessons retained; F3–F5, microphone recognition, chord modes, narration, chimes, Android and USB MIDI remain.
- Added live rhythm engine (four-beat count-in, 30–220 BPM, speeds ¼/½/1/1.5/2).
- Metronome tick toggle and live beat HUD; audio ticks scheduled with Web Audio.
- New look-ahead teaching-score strip above the piano: upcoming notes/chords, rhythmic lengths and scheduled playhead; not full sheet music engraving.
- Optional early/on-time/late grading with tolerance based on tempo; per-lesson speed settings.
- MIDI and on-screen key hold duration tracking. Acoustic microphone key-up cannot be accurately identified.
- Added adjustable microphone onset-latency correction (0–450 ms).
- Added completed-session practice history in localStorage and JSON export.
- Added timing/hold result cards; key-press accuracy still tracked separately.
- v2.1 modules: `js/rhythm.js`, `js/metronome.js`, `js/score-strip.js`, `js/progress-store.js`.
- Updated regression tests plus browser-interaction tests using local inline JavaScript modules.
