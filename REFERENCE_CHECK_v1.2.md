# Piano Play Lab v1.2 · Pitch accuracy and reference check

## Why can C4 show as C♯4?

Standard middle C (C4) is approximately **261.63 Hz**, while C♯4 is **277.18 Hz**, a whole semitone (100 cents) higher. The name-conversion code uses the correct equal-tempered pitches (A4 = 440 Hz). A digital keyboard should not systematically sound one semitone sharp just because it's electronic.

Potential causes include:

- Digital piano **Transpose** setting at +1 semitone; less commonly pitch/tuning shifted dramatically in instrument settings.
- Acoustic pickup from electronic piano speakers, distortion, strong harmonic content, background sound, or an incorrect microphone/input effect.
- Browser note detector misestimating the fundamental of a complex piano sound. The v1.1 prototype used a coarse average-downsample operation. v1.2 uses the original audio samples with extra frame stabilization to reduce bias.
- A note right near a classification boundary: a frequency near 269 Hz can round to C♯4 despite being only ~50 cents above C4.

Holding the key longer helps stability and separates note attack noise from the sustained pitch; it doesn't retune the note. Microphone sensitivity sets the minimum accepted loudness, not tuning.

## Quick diagnostic first

1. Close the old Windows server before running the new version (both default to port 8000).
2. Start `START_WINDOWS.bat`, open `http://localhost:8000/` and hard-refresh (Ctrl+Shift+R).
3. Start listening. Play one **C4** and read the **Raw microphone reading** beneath the controls.
4. If it reads around **261.6 Hz**, the piano is correctly pitched. If it reads 269–285 Hz, the signal is being heard as C♯4.
5. Verify that **Transpose** is `0` (or off), tuning is close to `A4 = 440 Hz`, and effects such as pitch shifting or harmonizers are off on the electronic piano.
6. If you have headphones, connect them directly to the electronic piano so the room mic stops hearing the instrument. This is useful for distinguishing acoustic/microphone pickup from a sound-program setting; note detection will require the piano speakers or an external input to be heard again.
7. For a very accurate future version, digital piano USB MIDI should be prioritized if the instrument supports it. Unlike a microphone, MIDI input sends the actual note number and usually has dependable chord detection.

## Optional two-note reference capture

This check is for **diagnosis** and *optional compensation*, not changing piano tuning.

1. Click `Start listening` and ensure the signal meter responds.
2. Click `1 · Capture C4`, then press and hold **Middle C** on the piano for approximately two seconds. Keep the room quiet. A measured Hz and cent offset appears.
3. Release the key. Click `2 · Capture G4`, then press and hold **G4** (the G above Middle C).
4. The program compares the measured offsets of the two notes. Both need enough stable readings, and their offsets must agree within 28 cents.
5. If they disagree significantly, calibration is **refused**: check input signal and pitch detector, not software compensation.
6. If offsets agree, `Apply measured offset` becomes available. It is deliberately **never automatic**. Large offsets (>40 cents) trigger a warning to check the piano's transpose settings before applying.
7. The exact change is shown under `Correction`. Click `Clear correction` to return to standard A4=440Hz tuning.

What this does: if C4 is consistently measured at 277.18 Hz and G4 is consistently measured at about 415.30 Hz, the detector sees both as +100 cents. You can apply a -100 cent correction to the app for a demonstration. **The real piano will still sound a semitone higher**; fixing transpose on the keyboard is preferred.

## Changes since v1.1

- Pitch analysis now uses the original time-domain audio samples and the AudioContext's actual sample rate instead of the lossy 4× averaging/downsample path.
- Rolling multi-frame median stability filtering added to reduce transient and low-confidence note mistakes.
- Clear frequency readout in Hz with cents offset, alongside the adjusted lesson note.
- Added separate C4 and G4 captures, median measurement, stability validation, agreement check, warning for large offsets, and explicit Apply / Clear controls.
- Calibration notes cannot accidentally earn lesson credit.
- Added automated tests for rich harmonic piano-like tones, consistent +100-cent offsets and inconsistent reference measurements.

## Scope and limitations

- Monophonic microphone recognition only. No chord separation, verified fingering or hand tracking.
- Calibration is not a solution for arbitrary harmonic/algorithm errors: offsets must agree across both notes.
- Microphone input pitch can vary due to the electronic piano's internal speaker/voice presets and the pickup environment.
- This code cannot be physically tested on your exact laptop or piano from here. Please report the raw Hz values for C4 and G4, plus the correction result, if anything remains inaccurate.
