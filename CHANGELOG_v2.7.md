# Cleo's Piano Play Lab v2.7 — Sound Balance + Focused Rhythm UI

## Changes

1. **Independent MIDI piano and success-chime volumes**
   - MIDI sound and correct-note chimes have separate Web Audio `GainNode` buses.
   - MIDI keyboard default: **90%**; success chime default: **25%**.
   - Success chime volume also controls the end-of-lesson celebration sound.
   - Moving the slider changes the gain *while notes are playing*, without restarting audio or affecting MIDI recognition.
   - Volume can be set from **Settings → Keyboard & chime volumes** or the small **Sound levels** expander below the Practice buttons. Both controls stay synchronized.
   - Level settings are saved only on the current browser/device (localStorage key `cleos-piano-audio-mix-v2.7`). A value of 0% fully mutes the respective sound bus. Headphone/system volume remains independent.
   - Other audio (metronome clicks, voice instructions, Hear next note, and Hear whole melody) deliberately remains at its previous level. The MIDI piano slider adjusts the software instrument played by *physical MIDI keys*, not the external toy's own speakers.

2. **Rhythm Highway layout reordered**
   - Controls for tempo, repeat, count-in and metronome now sit **above** the actual scrolling note highway.
   - Compact beat status follows those controls, so the moving notes and keyboard appear directly next to each other.

3. **Cleaner piano presentation**
   - Removed the visible “The Music Room / Your M-Audio MIDI Keyboard” heading.
   - Preserved a hidden accessible label for screen-reader users.
   - Moved “Find this key / Played key” colour indicators to the dark Highway footer alongside the timeline legend.

## Retained
- 20 lessons; Learn/Perform; 3 tries with one-bar breaks; M-Audio MIDI and Hape microphone input; chord recognition; settings/calibration; home and lesson progression; score history and voice guidance.

## Test summary
- 86 Node automated tests passed (83 existing tests + 3 new sound/control tests).
- Chromium self-contained UI test passed: Practice layout order, removed heading, transferred key legend, two volume controls, cross-screen slider sync, and localStorage persistence; no JavaScript errors.
- Simulated Web Audio tests confirmed MIDI voices connect to the MIDI bus, chimes/celebrations to feedback bus, and sliders change the two bus gains independently.
- Physical M-Audio hardware and Android audio still require user testing.

## Deployment
1. Close the old local server and extract the ZIP to a new folder.
2. Run `START_WINDOWS.bat` (or use the existing GitHub Pages HTTPS site).
3. Refresh the page at `http://localhost:8000/?build=270` or add `?build=270` to the GitHub Pages URL.
4. Open **Settings → Choose your piano → M-Audio**, connect the device, then navigate to **Settings → Keyboard & chime volumes**.
5. Try **MIDI piano 90%**, **chime 25%**, adjust to taste, then optionally use **Sound levels** during practice to fine-tune.

For GitHub Pages, upload all files INSIDE `Cleos_Piano_Play_Lab/` to the existing repository root; replace the old `index.html`, `css/` and `js/` files. Commit and push. Keeping existing browser storage preserves scores and previous instrument selection.
