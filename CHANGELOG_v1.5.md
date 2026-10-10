# v1.5 – F4–F6 Toy Piano Key Layout

- Removed all decorative hardware, buttons, power switch, control labels, side panels, and casing from the SVG piano display.
- Matched the supplied photo's physical pattern: **15 white + 10 black, 25 keys total, black-key groups 3–2–3–2**.
- Changed visible playable range from C4–C6 to **F4–F6**, MIDI 65–89.
- Updated every lesson, note prompt, key footer and calibration control for the new range.
- Changed baseline tuning capture from C4/G4 to **F4/C5** (both are physically available).
- Extended microphone pitch analysis from 1150 Hz to 1570 Hz so upper F6 can be detected.
- Preserved Android touch scrolling, microphone setup, camera preview, congratulation page, scores, correct-note chimes, and GitHub Pages support.
- Added tests for 15/10 key counts, black-key grouping, F4/C5/F6 simulated recognition and calibration.

The actual acoustic sounding octave cannot be verified from a photo. The app assumes the first key sounds F4 as requested, and shows the measured Hz to help verify that assumption.
