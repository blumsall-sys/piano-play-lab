# Piano Play Lab — Microphone Fix v1.1

This is a full replacement of the previous Phase 2A demo, not an additional app.
All artwork, lessons, keyboard controls, camera preview and local-launch files remain included.

## What changed

1. **Retained an active audio processing graph.** The microphone `MediaStreamAudioSourceNode` is kept in a live variable and connected to the analyser and a 0-volume output. No microphone sound is intentionally sent to speakers.
2. **Increased quiet-sound sensitivity.** Previous fixed RMS gate was `0.012`. Updated default is `0.0025` with an adjustable `0.0008` (very sensitive), `0.008` (medium) and `0.015` (low) option.
3. **Added microphone input selection.** Use the dropdown to choose the real laptop or USB microphone rather than always taking the system default.
4. **Added live input diagnostics.** The sound meter, numeric dBFS input level, raw RMS, peak level, active input name, browser audio-context state, microphone track state and sample rate are visible.
5. **Added a synthetic pitch detector test.** The **Check note detector** button runs a generated C4 waveform through the pitch estimator. It proves the pitch algorithm works but **does not test the physical microphone**.
6. **Clearer failures.** Permission denial, a busy/unavailable microphone, a disconnected microphone and quiet input are shown more clearly.
7. **Reduced pitch confidence cutoff**, from 77% to 68%, to accommodate more real piano recordings (can mean more false positives in noisy rooms).
8. **Added more tests** for quiet note recognition and signal-level diagnostics, and disabled the local server's browser cache so edited files refresh reliably.

## How to replace the old copy on Windows

1. Close the old Piano Play Lab browser tab and **close the old START_WINDOWS.bat/PowerShell server window**. Otherwise the old server can stay on port 8000.
2. Extract the v1.1 ZIP to a **new folder**, e.g. `Documents\PianoPlay_Phase2A_v1.1`.
3. Open the included `PianoPlay_Phase2A` folder, and double-click `START_WINDOWS.bat`.
4. Open `http://localhost:8000/` if a new browser tab doesn't open.
5. Refresh with **Ctrl+Shift+R** to discard any cached previous version.
6. Look for the **Microphone input**, **Input sensitivity**, **Refresh devices** and **Check note detector** controls under the keyboard.

## Three-stage microphone test

**Test A: Pitch algorithm (no microphone needed)**

- Click **Check note detector**. It should say `Pitch algorithm PASS` for generated C4 at about 262 Hz.
- If this fails, the issue is software rather than microphone permissions or laptop hardware.

**Test B: Actual microphone signal**

- Click **Start listening**, grant microphone permission, and choose the microphone in the **Microphone input** dropdown. You may need to click **Refresh devices** after allowing access.
- Clap or speak near the microphone. The **sound meter** should move and the numeric `dBFS` should rise. Silence is near `-120 dBFS`. Visible input generally rises above `-75 dBFS` and often reaches `-55` to `-20 dBFS` while speaking or playing nearby.
- The debug line should show `running audio context`, a `live track`, and a microphone name.
- **The bar proves signal is reaching the browser even if it cannot identify a musical note.** Clapping is not expected to be recognized as C4 or any particular note.

**Test C: Real piano**

- Select the `Meet Middle C` lesson. Play Middle C (C4) alone, no pedal, holding for roughly half a second. The detected note should show `C4`, with a frequency around 262 Hz, and advance the exercise.
- If the level meter moves but you get **Sound heard · unclear pitch**, try **High** or **Very sensitive**, move the laptop nearer the instrument, stop background audio, and play a clean sustained individual note.
- If the detector identifies a different pitch, check the octave and try another instrument/register. It cannot yet reliably recognize chords.

## If the level meter stays flat

1. Select a different microphone in the app. A connected headset, webcam or virtual device may have been selected.
2. In **Windows 11: Settings → System → Sound → Input**, choose the same microphone and use the Windows input test. If Windows shows no input there, the website cannot fix that hardware/driver problem.
3. In **Settings → Privacy & security → Microphone**, turn on **Microphone access**, **Let apps access your microphone**, and **Let desktop apps access your microphone**.
4. In Chrome/Edge, click the site-settings icon beside `localhost:8000` and allow the microphone. Reload the page.
5. Close Zoom, Teams, recording software, or other apps that might be using the microphone exclusively.
6. Try Chrome or Edge and verify you are using `http://localhost:8000/`, not `file:///`.

## Interpreting diagnostics

| What you see | Likely interpretation | Next step |
|---|---|---|
| `Pitch algorithm PASS`, `-120 dBFS`, flat meter | Detector works but browser receives no audio | Check correct microphone and Windows input/permissions |
| Meter moves, no note | Sound input works but pitch extraction is uncertain | Try a cleaner, longer note and sensitivity setting |
| Note is identified, lesson does not advance | Different expected note or just played a demo (temporary scoring suppression) | Play the golden key after 1.5 seconds |
| `suspended audio context` | Audio processing not running | Stop/Start listening, bring tab to foreground |
| `ended` or disconnected microphone | Hardware capture track stopped | Refresh devices, pick mic and start again |

No audio recordings are saved, uploaded, or sent to a server. The app processes microphone audio locally in your browser.
