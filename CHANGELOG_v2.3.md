# v2.3 — Settings microphone and calibration repairs

- Added dedicated **Start/Stop listening** and **Resume microphone audio** controls inside Settings. These operate the same microphone engine as the Practice button, with synchronized status.
- Fixed navigation that previously stopped the microphone when leaving Practice for Settings. It remains connected until explicitly stopped or the browser/device goes into the background.
- Disabled lesson note/chord scoring outside Practice, while keeping the raw microphone meter and pitch readout active for calibration.
- Forced single-note detection in Settings even when experimental chord mode was previously selected.
- Added real-time reference capture progress, Settings feedback messages, selected microphone status and clear error messages.
- Two-note F3/C4 calibration still rejects unstable or conflicting readings and requires explicit confirmation before applying a correction.
- Applied pitch offsets now save to local browser storage and are restored on refresh; **Clear correction** also deletes the saved setting.
- Switching the microphone input clears old un-applied reference captures and restarts the selected device.
- Added stored sensitivity preferences.
- Added version 2.3 cache-busting for updated browser files.
- Preserved 20 lessons, F3–F5 toy piano, chord modes, metronome, rhythm highway, narration and progress data.

## Testing
- 64 Node.js tests pass, including 4 new Settings wiring/regression tests.
- Chromium test with a simulated microphone passed: Settings start/stop, input meter, F3 capture, C4 capture, Apply measured offset, navigation with mic running, detector self-test, Clear correction.
- A real acoustic/electronic toy piano and physical Android microphone were **not** tested in this environment.
