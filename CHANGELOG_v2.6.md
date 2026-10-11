# Cleo's Piano Play Lab v2.6 – MIDI Connection Fix

## Fixed

- M-Audio layout selection now immediately attempts a Web MIDI permission request (on explicit user interaction); existing selection from saved settings still needs Connect after page load.
- Added **Connect / Reconnect** directly on the Practice screen, as well as Settings.
- Added **Scan / reconnect** and clear port and browser-permission states in Settings.
- MIDI inputs are explicitly opened; stale input listeners are removed on unplug and reattached after reconnect.
- Incoming raw notes and velocities show in a **Last MIDI event** diagnostic to distinguish hardware communication from lesson scoring.
- Added `midi-test.html`, a standalone browser hardware test that does not depend on the lessons.
- Added permission and USB checks for blocked sites, unsupported browsers, missing inputs, and disconnected/closed ports.
- Updated build labels and cache busters from 2.5 to 2.6.

## Preserved

20 lessons, 3-try Rhythm Highway, score/progress history, both Hape and M-Audio layouts, microphone calibration, voice, chord/timing grading, and MIDI sound playback.

## Verification

83 automated Node tests passed. A simulated Chromium MIDI device was opened, emitted a note, mapped the first C, and was disconnected/reconnected without JavaScript errors. The standalone MIDI test page also received a simulated MIDI note. **No physical M-Audio controller was accessible in the test environment.**
