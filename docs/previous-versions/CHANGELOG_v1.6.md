# Piano Play Lab v1.6 — F3 to F5 octave correction

The 25-key photo-matched keyboard now starts at **F3 / MIDI 53 / 174.61 Hz**, and ends at **F5 / MIDI 77 / 698.46 Hz**. The piano key geometry is unchanged: 15 white, 10 black, 3–2–3–2 black-key group order, no hardware buttons.

- Transposed all lesson note numbers and labels down 12 semitones.
- Shifted the pitch detector to cover 145–850 Hz and revised the internal pitch self-test.
- Updated guided calibration to capture **F3** followed by **C4**.
- Updated on-screen note labels, accessibility text, README, Quick Start and editable SVG reference.
- Preserved touchscreen/Android, lessons, progress metrics, chimes and completion screen.

**Note:** A pitch estimator may be affected by the miniature piano's sound; if F3 is misidentified, inspect the raw frequency and clarity rather than applying a full-octave calibration offset.
