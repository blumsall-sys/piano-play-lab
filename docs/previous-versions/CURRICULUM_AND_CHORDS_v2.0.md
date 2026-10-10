# Piano Play Lab v2.0 — 20 lessons + chord practice

## What's included
The original 25-key **F3–F5** SVG keyboard remains unchanged: 15 white keys, 10 black keys. No decorative toy buttons were reintroduced. Previous features remain: English Web Speech API lesson voice, mic input level and tuning/reference check, rhythmic demonstrations, note highlights, chimes, results/accuracy screen, and responsive desktop/tablet layout.

## Curriculum
1. Find the First F — five F3 presses
2. Five-Finger Walk — five-note ascending/descending path
3. A Little Melody — repeated pitches and jumps
4. High and Low F — three octaves of F within the keyboard
5. Twinkle Twinkle Little Star — traditional melody excerpt
6. Wheels on the Bus — simplified tune inspired by the traditional Mulberry Bush melody
7. Puppy Rescue Parade — original tune (not PAW Patrol TV theme)
8. Ice Cream Truck — short simplified *The Entertainer* excerpt
9. Mary Had a Little Lamb — stepping motion
10. Two Notes Together — F3 + C4 fifth
11. Happy and Moody Thirds — F–A vs F–A♭
12. Build an F Major Chord — F3 A3 C4
13. Build a C Major Chord — C4 E4 G4
14. Build a B-flat Major Chord — B♭3 D4 F4
15. Major or Minor? — F major vs F minor
16. Build D Minor — D4 F4 A4
17. F to C Chord Changes — alternate full triads
18. Three-Chord Parade — F, B♭, C, F
19. Broken Chord, Full Chord — compare arpeggio and full triad
20. My First Chord Song — eight chord events using F, C, B♭, D minor

## How chord recognition works
Each chord is one **lesson step** containing multiple MIDI note numbers, e.g. `[53,57,60]` = F3+A3+C4. All three virtual piano keys illuminate. A chord step completes only after all required notes have been accepted.

### Input options
- **Build chord (default/recommended for the Hape toy):** The microphone continues listening for single stable pitches. Play the required notes one by one, *releasing between each*. The app marks each correct key and completes the chord after all have been detected. This teaches chord shapes but does **not** prove simultaneous playing.
- **Together (experimental microphone):** The app analyses several frequency peaks in an 8192-sample audio buffer, rejects likely neighbouring-bin ghosts/harmonics, and waits for stable candidate sets. It credits a chord only if the detected group matches the required notes. Results may be unreliable for real toy piano speakers, reverberation, polyphonic timbres, small speakers, or background noise. This is a prototype, **not a reliable or validated polyphonic transcription system**.
- **USB MIDI (best for genuine simultaneous detection):** Click **Connect USB MIDI keyboard** on a supported browser and attach a compatible MIDI keyboard. The app receives actual note-on/off events and completes a chord when all required keys are physically held together. Browser/device support varies; most miniature toy pianos (including the photographed one unless it has a MIDI output) do not send USB MIDI.
- **On-screen keys:** Tap/click the required keys to assemble the chord; this works without hardware and is useful for testing on Android tablets. Touch input doesn't verify a simultaneous chord press.

### Scoring
- **Expected key presses** = total number of individual pitches requested by every note/chord event.
- **Actual key presses** = key events accepted by the lesson engine, including wrong or duplicated presses. A 3-note chord takes three correct presses.
- **Accuracy** = correct key presses ÷ actual key presses. Timing, hand position, finger choice and microphone misdetections are *not* assessed.
- Short preview clips, voice narration and synthetic testing do not count as attempts.

### Built-in diagnostics
- **Check note detector** tests generated mono sound.
- **Test chord detector** tests a generated F major triad using the same FFT-based experimental recognition code (does not prove the real microphone detects chords).
- The microphone input meter, measured frequency, and F3/C4 calibration from previous versions are retained.

## Updating lessons
`lessons/lessons.json` is the editable curriculum. A number indicates a single pitch, an array of numbers indicates a chord. For example:

```json
"notes": [53, 57, [53,57,60], [60,64,67]]
```

`melodyBeats` (if present) contains **one duration per lesson step**, including chord steps. `bpm` controls demo playback tempo. `spokenInstructions` supplies the English narration. After modifying the JSON, run `python tools/sync-lessons.py` from the project root to update the inline catalog and selector in `index.html` (important for GitHub Pages).

## Local test
1. Extract ZIP. Open the `PianoPlay_Phase2A_v2.0` folder.
2. Double-click `START_WINDOWS.bat` in Windows. Open http://localhost:8000/?build=200.
3. Check the version line reports **v2.0 READY · 20 lessons · 11 chord lessons**.
4. Select lesson 12, **Build an F Major Chord**. All three keys F3, A3 and C4 should turn gold.
5. Tap those three on-screen keys. The progress advances one *step*, not three steps. On the third chord completion the congratulations metrics should show nine ideal key presses.
6. Select **Hear whole melody** to preview chords (not graded).
7. Start the microphone and test with the toy piano using **Build chord**. Try **Together** only as an experiment.
8. If available, connect a true USB MIDI keyboard to verify simultaneous-note detection.

## GitHub Pages
Replace the existing site's files with all files **inside** this project folder (not an extra nested project directory): `index.html`, `js/`, `css/`, `assets/`, and `lessons/`. Commit changes to the Pages branch and verify the live site shows the **v2.0 READY** label. Open `https://YOUR-USERNAME.github.io/YOUR-REPO/?build=200` to help bypass a stale cached page. Browsers need HTTPS and permission for microphone access.

## Important limitations
The microphone implementation was tested with synthesized test tones, not against your physical Hape toy piano or Android hardware. Real polyphonic detection might fail or report false notes; use Build chord mode on the toy. The webcam remains an optional local preview only. Proper finger technique and reading sheet music are not assessed in this phase.
