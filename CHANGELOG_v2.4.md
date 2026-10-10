# Cleo's Piano Play Lab v2.4 — Dual keyboards & MIDI controller

## Major changes
- Moved **Hear Cleo's instructions** into the piano control row as the FIRST playback button, matching the styling and size of the other buttons.
- The **Start listening** button is now RED until the microphone is enabled. It turns GREEN while listening.
- In **M-Audio MIDI mode**, the microphone button displays a disabled USB MIDI indicator instead of inviting the user to turn on a microphone.
- Added Settings → **Choose your piano** with two layouts:
  - Hape toy piano — 25 keys, F3–F5 (MIDI 53–77), default
  - M-Audio Keystation Mini 32 MK3 — 32 keys, C–G (starting MIDI C initially C3, customizable)
- Added **Connect USB MIDI keyboard**, live MIDI input selection and device/activity readouts.
- Added **Identify leftmost C key**: press the controller's first white C and the display moves to the octave actually sent by the device. The app does not arbitrarily shift MIDI pitches or lessons.
- Added synthesized piano sound for the USB MIDI controller, with velocity-sensitive attack, independent polyphonic notes and key-release detection. Disable it in Settings if using another instrument app.
- Preserved MIDI chord input, accurate note-on/off/hold tracking, scoring, 20 lessons, Rhythm Highway, voice narration, saved progress and microphone calibration.
- Added a warning when a lesson needs pitches outside the currently selected MIDI octave; use the controller's octave buttons to reach those notes.
- Bumped browser asset versions to 2.4 to avoid stale scripts after GitHub Pages deployment.

## Testing
- 71 automated tests pass, including new layout, message parsing, voice button placement, persistence and sound wiring.
- Headless browser checked both 25-key and 32-key views, button ordering, Settings → Practice navigation and no JavaScript errors.
- Simulated USB MIDI input checked device detection, first-C mapping, note-on/note-off, one-note lesson scoring and 3-note simultaneous chord scoring.
- Physical M-Audio device and Android USB MIDI were not available for hardware verification. Test with the actual controller after deployment.
