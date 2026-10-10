# Cleo's Piano Play Lab — v2.2 Rhythm Highway

## New
- Personalized branding: **Cleo's Piano Play Lab** on the homepage, header and page title.
- Voice instructions for all 20 lessons open with **“Hey Cleo, for this lesson we are going to…”**.
- Responsive Home, Lessons, Practice, Settings and Results screens instead of one tall page.
- Rhythm Highway: constant-speed right-to-left note and chord movement based on the same `RhythmSession` beat clock used for scoring.
- Fixed PLAY timing indicator; current event is gold, future events are blue, completed ones green. Longer notes occupy longer horizontal space.
- Learn Mode freezes the timeline on the required event and waits for a correct key or chord.
- Perform Mode displays a running beat timeline with the existing count-in, adjustable BPM and speed presets, timing grades and metronome toggle.
- Three progress checkpoints per lesson: Discover, Practice, Perform.
- Lesson map shows 20 levels, best percentage, unlocked status and 70% passing requirement; later lessons unlock in order.
- Results have stars and 70% pass/retry messaging. History and local progress saving are retained.
- Option to unlock all lessons for developer/parent testing in Settings.
- Unfinished lesson position, key-press counts and active lesson saved locally for resuming on the same device.
- Microphone setup, voice selection, MIDI, experimental chord mode and optional camera preview moved to Settings.

## Kept from v2.1
- 25-key F3–F5 interactive toy piano and note labels.
- Twenty melody and chord lessons, including existing custom melodies, rhythmic preview and audio.
- Microphone note recognition, optional two-note calibration, MIDI chord detection, experimental polyphonic microphone chords.
- Lesson scoring, chimes, metronome, tempo presets, voice narration, JSON practice-history export.
- Windows BAT local server and GitHub Pages/Android support.

## Important limitations
- Score-following highway uses named-note rhythm blocks rather than formal engraved sheet music.
- Physical key release and hold time cannot be determined precisely through a room microphone. MIDI or on-screen touch gives better hold measurements.
- Perform Mode scrolls continuously, but the student must still complete the required notes; it does not silently credit or automatically skip missed notes.
- Progress is saved locally per browser and does not sync between different devices.
- Browser-tested with simulated speech/microphone signals and piano mouse input. Acoustic Hape piano and Android tablet must still be tested on the target hardware.
