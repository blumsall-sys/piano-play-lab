# Version 1.4 — Android / Responsive Update

- Responsive UI for Android phones and tablets in portrait and landscape.
- Horizontal SVG keyboard scrolling for narrow devices, with swipe-vs-tap recognition.
- 44 px minimum finger-sized controls, keyboard focus accessibility, phone status layout and safe-area padding.
- Mobile Web Audio Context startup improvements; recover from a suspended audio context with a visible Resume button.
- Mobile microphone fallback if unsupported audio constraints are rejected.
- Stops microphone/webcam on app background; explicitly guides the user to restart on return.
- Expanded high-register pitch search to recognize notes up to C6 on the current C4–C6 25-key software keyboard, rather than cutting off around D5.
- Kept v1.3 congratulations/results, scoring, lessons, reference capture, chimes and webcam preview.
- Expanded automated unit tests to cover upper-register pitch recognition.

**Testing:** 14 automated JavaScript tests passed. Chromium layout/input testing used Android phone and tablet emulation at 390×844, 800×1280 and 1280×800 and checked 25 keys, scrollable keyboard, zero page overflow, on-screen note entry and the lesson completion screen. Physical Android microphone/camera testing remains to be performed on your device.

**Music mapping:** This release retains the C4–C6 MIDI/key definitions from v1.3 so existing lessons do not change. The photographed Hape piano appears to have an F-to-F physical black-key grouping; verify actual MIDI-octave mapping with measured frequencies before relying on printed note names.
