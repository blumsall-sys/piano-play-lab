# Using the M-Audio Keystation Mini 32 MK3

## Connect on your Windows computer
1. Use the keyboard's USB cable and plug it into your computer. The controller is USB powered.
2. Launch `START_WINDOWS.bat` and open `http://localhost:8000/` in **Chrome** or another Web MIDI-capable browser.
3. Open **Settings → Choose your piano** and select **M-Audio Keystation Mini 32 MK3 (32 keys)**.
4. Click **Connect USB MIDI keyboard**. Approve any browser MIDI permission request if shown.
5. Under MIDI Input Device, keep Auto-select M-Audio or select your connected Keystation explicitly.
6. Click **Identify leftmost C key**, then press the physically leftmost **white C** key. The page should report its MIDI number (for example C3 = 48 or C4 = 60) and update all 32 labels. No pitches are silently remapped.
7. Return to **Practice**. If an F3 note is out of range, press the keyboard's hardware Octave Down button until the keyboard transmits the notes needed by the lesson. Press both hardware octave buttons together to reset the octave offset to zero if supported by its current settings.
8. Confirm that the keys highlight and piano sounds are heard when you play. If not, check **Play piano sounds when MIDI keys are pressed** in Settings. A MIDI controller has no built-in speaker.

## About the two layouts
- **Hape toy piano** is the default: F3–F5, 25 keys, microphone input for acoustic/audio-only playing. You MUST click **Start listening** (red button) to enable scoring through the microphone.
- **M-Audio Keystation** has 32 physical keys, from C through G over 2.5 octaves. The visible octave is determined by the MIDI note the device transmits, NOT solely by the physical shape of the keys.
- Selecting M-Audio disables the lesson's microphone button, since MIDI detects notes, chords and physical key releases directly. You can still open Settings and use the separate microphone controls to calibrate the Hape later.

## Tablet notes
The website is responsive, but USB MIDI is **browser and device dependent** on Android. Try Chrome with a suitable USB-OTG cable/hub if supported. If `Web MIDI unavailable` appears, test MIDI on the Windows laptop first; the Hape/microphone mode may still work on the tablet.

## Why MIDI is better for chords
The USB controller reports each press (`note-on`, pitch, velocity) and release (`note-off`). The app tracks simultaneous keys for chords and hold length from note releases. It doesn't rely on hearing several notes through a tablet microphone.

## Troubleshooting
- No MIDI devices: reconnect the USB cable, close exclusive MIDI apps, reconnect from Settings, and try Chrome on Windows.
- Wrong octave: press **Identify leftmost C**, and use the hardware octave +/− buttons if a lesson requires lower/higher pitches.
- Lights work, no sound: turn on **Play piano sounds when MIDI keys are pressed**, increase system volume, and ensure browser audio isn't muted.
- Duplicate sounds: disable the MIDI piano synth if another program is generating its own piano instrument from the same USB controller.
- Layout changes don't erase lesson progress: previously saved progress is retained locally in this browser.

## Technical notes
This app uses the standard browser Web MIDI API and Web Audio API without MIDI drivers, cloud APIs or paid services. The MIDI sound is a simple locally synthesized practice tone, not a professionally sampled grand piano.
