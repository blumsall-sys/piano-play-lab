# Piano Play Lab v2.1 — Rhythm Practice + Look-Ahead Score

## What is this feature called?
**Rhythm Practice** (tempo, count-in, metronome, timing/hold feedback) + **Score Following** (a look-ahead score strip). The strip in v2.1 is a **note-name/rhythm teaching aid, not conventionally engraved sheet music**. A future release can render MusicXML using OpenSheetMusicDisplay.

## What's new
1. **Look-ahead notes and chords.** A horizontally scrollable strip above the piano shows the whole exercise, automatically following the current note/chord while keeping upcoming events visible. Cards display note names, rhythmic value, and starting beat. Gold = current step, mint = completed, teal outline = scheduled beat position.
2. **Metronome.** Clicks are optional. There is a four-beat count-in, a live beat counter, per-lesson default BPM, and a BPM input (30–220). The selected BPM can be adjusted per lesson; settings persist locally.
3. **Playback speeds.** ¼, ½, 1×, 1.5×, 2×. Effective tempo = BPM × speed. The full-melody demonstration also uses the selected effective tempo.
4. **Rhythm grading.** When Grade rhythm is enabled and Start beat has been pressed, each recognized **correct** event is compared with its scheduled score time. The display reports Early, On time, or Late, with estimated millisecond offset. Beat tolerance scales with tempo (minimum 85 ms, maximum 420 ms).
5. **Hold durations.** For MIDI: note-on/note-off timestamps measure physical duration; a chord is measured until its first required key is released. For onscreen keys: pointer-down/up elapsed duration is available. For microphone input: pitch decay cannot establish physical key-up, so **hold duration is not graded**. Chord-building via separate microphone or screen taps is also **not graded as a simultaneous onset**.
6. **Microphone timing offset.** The local pitch detector needs several buffers to identify a note, so it reports after the actual onset. Adjustable offset 0–450 ms, initially 160 ms, lets you roughly align recognition with the metronome. USB MIDI is preferable for fine timing assessment.
7. **Practice history.** Completed sessions store timestamp, lesson, attempts, correct/incorrect keys, optional rhythm grades, optional hold grades, and the note attempt log. Nothing is uploaded; there is no audio recording. Sessions are saved only in local browser storage; use Export practice JSON to back them up.

## How to use, step by step
1. Run `START_WINDOWS.bat` and open `http://localhost:8000/`. Or publish to GitHub Pages and open the HTTPS site on Android Chrome.
2. Choose a lesson. Read several upcoming notes/chords in **Read ahead, then play**.
3. To practice without grading, leave **Grade rhythm** unchecked. You can play freely, or enable metronome clicks and press **Start with 4-beat count-in**.
4. For timing practice, check **Grade rhythm**. Set **Base BPM** and **Speed**. Tap **Start with 4-beat count-in**, wait for the four ticks, then play in the displayed rhythmic sequence.
5. Tap Stop beat to pause. Changing BPM or speed requires starting a **new count-in** (the previous tempo timeline is no longer valid).
6. If the microphone marks every note as late, adjust **Mic timing offset**. This approximates note-detection latency and is not a microphone calibration of musical pitch. Start with 160 ms, try 100–300 ms as needed; note detection speed varies by device.
7. Finish a lesson to view separate **key accuracy** and **on-beat event counts**. Hold duration appears only when measured. Scroll to **Practice history**, and tap **Export practice JSON** to download your records.

## Important limitations and recommended testing
- **A microphone cannot measure exact key release.** The instrument keeps sounding as the key is lifted. A stable pitch gives an estimate of what note is present, not accurate key travel. MIDI is the source for accurate key-down and key-up durations.
- **The browser microphone analyzes small chunks of audio**, so its reported onset is delayed and has jitter. Advanced rhythm grading, fast eighth notes, and simultaneous chords should be practiced over USB MIDI when available.
- **Hape toy piano may have imperfect pitch/timbre.** Before timing practice, check notes and pitch calibration with the instrument. At very high speed microphone recognition may miss closely repeated notes.
- **Metronome clicks, voice and success chimes may enter the microphone.** Prefer headphones for demos/metronome if possible and keep tablet speaker volume moderate. Chimes are still enabled. The detector uses short stability gating, but unwanted detections remain possible.
- **Rhythm timing is evaluated against a fixed timeline**, not a score that continuously waits for the player. If a child misses or repeats notes, subsequent notes may become late. Switch Grade rhythm off for forgiving note-by-note beginner practice.
- **BPM is a teaching setting** and does not guarantee each legacy melody uses authentic published rhythm. Lessons without `melodyBeats` default to one beat per step. Add or edit `melodyBeats` in both `lessons/lessons.json` and embedded index catalog, using `python tools/sync-lessons.py` to keep both copies synchronized.
- **Look-ahead strip is not standard engraved music.** The next stage should integrate MusicXML and staff rendering via OpenSheetMusicDisplay if you need exact notation, measures, beams, ties, rests, key signatures and finger numbers.

## Recommended future work
- A count-in plus **tap-tempo** button that lets a child set their comfortable pace.
- **Loop this measure** so the child repeats a hard phrase without restarting the entire song.
- Two recognition difficulty levels: **Guided** (no tempo penalty) and **Performance** (timed).
- MusicXML score engraving, a moving cursor, and finger-number sprites.
- Adaptive tempo (reduce speed after repeated mistimed notes; only increase it when accurate).
- Exported MIDI-like performance event history and teacher-facing timing chart once direct MIDI note events are in widespread use.
