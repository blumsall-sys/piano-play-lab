# Piano Play Lab v1.8 — Five New Melody Lessons

The complete application now includes **9 lessons** for the 25-key **F3–F5** Hape-style toy piano. Versions 1.6 and 1.7 keyboard layout, microphone recognition, guided calibration, scoring, chimes, and browser voice narration are unchanged.

## The five additions

| # | Title in the app | Musical content | Beginning note |
|---|---|---|---|
| 5 | Twinkle Twinkle Little Star | Beginner excerpt of the traditional tune in F major | F4 |
| 6 | Wheels on the Bus · Traditional Tune | Simplified instrumental phrase based on the old *Mulberry Bush* tune, which is commonly used for the bus song. No song lyrics are included. | C5 |
| 7 | Puppy Rescue Parade · Original | A completely new, lively rescue-pup tune. **Not** the actual *PAW Patrol* television theme. | F4 |
| 8 | Ice Cream Truck · The Entertainer | Short beginner excerpt adapted from the public-domain Scott Joplin ragtime tune, a common ice cream truck melody. | G4 |
| 9 | Mary Had a Little Lamb | Beginner excerpt of the traditional song in F major | A4 |

The original four lessons are preserved. Each new melody has an independent set of `notes`, matching `melodyBeats`, and a `bpm` value, plus child-friendly `spokenInstructions`.

## New: Hear whole melody

New melody lessons display **♫ Hear whole melody**, which uses native Web Audio oscillators to play the notes in rhythm while animating the corresponding keys. Press **Stop melody** to cancel. Notes heard from the laptop/tablet's speakers during the preview are *not* counted toward practice accuracy.

A melody preview is optional, not a performance requirement. Students can still tap **Hear next note**, use the mic, or press the virtual keys directly. **Tempo/rhythm are not graded** in v1.8; scoring measures correct recognized key attempts only.

## What changed

- `lessons/lessons.json`: 5 added melodies and TTS scripts, now 9 total.
- `js/melody.js`: new pure beat-based preview timeline generator.
- `js/sound.js`: scheduled full-melody Web Audio playback and cancellation.
- `js/main.js`: buttons, visual key highlighting, input suppression, and stop on lesson changes.
- `js/lesson.js`: validates note durations and tempo.
- `index.html`, `css/styles.css`: preview controls and responsive message.
- `tests/melodies.test.mjs`, `tests/voice.test.mjs`: expanded test coverage.

## Editing or adding songs

Open `lessons/lessons.json`. Every new `notes` MIDI number must be in the allowed **53–77** range. `melodyBeats` contains **one positive duration per note**, where `1` means one beat and `2` means two beats. `bpm` sets the speed of the demonstration. `spokenInstructions` is read aloud by the existing Web Speech API on the student's tap.

Example:

```json
{
  "id": "example-three-note-melody",
  "title": "Three Notes",
  "description": "Play three little notes.",
  "hint": "Start on F4.",
  "notes": [65, 67, 69],
  "melodyBeats": [1, 1, 2],
  "bpm": 90,
  "spokenInstructions": "Try these three little notes. Listen first, then play!"
}
```

## Local setup / GitHub Pages

1. Extract the ZIP.
2. On Windows, open the extracted `PianoPlay_Phase2A_v1.8` folder and double-click `START_WINDOWS.bat`.
3. Test at `http://localhost:8000/`.
4. To update GitHub, upload the **contents** of that folder to the repository's publishing root (where `index.html` lives). Replace existing files and add the new `js/melody.js` file.
5. Wait for Pages deployment, then reload the HTTPS site on Android Chrome. A hard reload or private tab may be needed to bypass old cached files.

No API key, hosted services, paid libraries, audio downloads or additional Node dependencies are required for using the website. `npm test` needs Node.js only if you want to run the developer tests.

## Known limitations

- The *PAW Patrol* theme is not supplied. The puppy lesson is original; for an exact theme you would need authorized source music.
- The Wheels lesson uses a simple traditional tune associated with the song, not a modern recording or proprietary arrangement.
- “The ice cream truck song” varies geographically; this package uses *The Entertainer*, not every possible truck jingle.
- For melody scoring, **one note at a time** is expected. Simultaneous chords and verified finger technique are not part of v1.8.
- Physical Android microphone and actual toy-piano audio have not been tested in this environment. Browser access was blocked during this release's manual visual test; automated unit tests and JavaScript syntax checks passed.
