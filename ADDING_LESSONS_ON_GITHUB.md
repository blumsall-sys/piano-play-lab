# Add new lessons on GitHub by editing one file

**After deploying v2.8 once**, edit only **`lessons/lessons.json`** in the published GitHub repository. The application now fetches this file on every page load with cache bypass. `index.html` contains an offline backup, but is NOT the source to edit for daily lesson additions.

## Updating the current lessons
1. On GitHub, open your repository and go to `lessons/lessons.json`.
2. Click the pencil/edit icon (or upload a replacement JSON file at the same path).
3. Find the lesson you wish to change. Keep its existing `id` and its position in the list unchanged so saved scores continue to refer to the correct lesson.
4. Change `title`, `description`, `hint`, `notes`, `melodyBeats`, `bpm`, `spokenInstructions`, or optional `handGuide` / `handAssignments`.
5. Commit to the same branch from which Pages deploys (commonly `main`).
6. Reload your published site. Look for `lessons.json` in the version status. If it shows `embedded fallback`, read the warning: your JSON is missing, malformed or incompatible.

## Adding Lesson 51+
- Add a comma after the last existing lesson object, then append another complete lesson object **before the last `]`**.
- Use a unique, stable `id`. Append new lessons at the END; don't reorder or remove earlier lessons.
- Keep each MIDI pitch in **53–77 (F3–F5)** for both original toy piano and the current common lesson range. The M-Audio can send other notes, but the default Hape layout uses F3–F5.
- `notes` can contain a single MIDI integer or an array of 2–5 different MIDI integers for simultaneous keys/chords.
- `melodyBeats` is an OPTIONAL array of positive beat lengths, exactly one for each item in `notes`. Examples: `0.5` eighth note; `1` quarter; `2` half; `4` whole. Without it, each event lasts one beat.
- `bpm` is a default practice speed, typically **55–95** for beginner lessons.
- `spokenInstructions` should begin **Hey Cleo, for this lesson we are going to...**.
- `category` should be `hands`, `rhythm`, `theory`, `song`, `chords`, `original` or `traditional` (other values display as melody).

Example lesson object to append:

```json
{
  "id": "new-tune-51",
  "title": "Finger Friends Again",
  "description": "Practice left and right hands taking turns.",
  "hint": "Play a low F3, then a high F4.",
  "category": "hands",
  "bpm": 65,
  "notes": [53, 65, [53, 65], 55, 67],
  "melodyBeats": [1, 1, 2, 1, 2],
  "handGuide": "LH means left hand, RH means right hand. Finger 1 is the thumb.",
  "handAssignments": ["LH5", "RH1", ["LH5", "RH1"], "LH4", "RH2"],
  "spokenInstructions": "Hey Cleo, for this lesson we are going to play a low note, a high note, then both together!"
}
```

### Finger notation
`LH5` = left-hand little finger; `RH1` = right-hand thumb. An event with two notes needs two assignments in the SAME order, for example: `[53,65]` → `["LH5","RH1"]`. `handAssignments`, when supplied, must have exactly as many events as `notes`. Finger labels are learning suggestions and are **not verified** by the microphone/MIDI input.

### Why the JSON might be rejected
- A note is outside the allowed F3–F5 range.
- An event contains duplicate pitches, too many chord pitches, or an invalid array.
- `melodyBeats` / `handAssignments` doesn't match `notes` length.
- A lesson `id` duplicates or changes an existing lesson ID.
- A lesson has been removed or moved ahead of another pre-existing lesson.
- The JSON has a syntax error (missing comma, brace or quotation mark).

If the JSON cannot load, the app shows a **visible warning** and uses the 50 lessons embedded in `index.html` rather than breaking completely. That backup is not automatically extended to new lessons; for a new distributed ZIP/offline fallback release, use `tools/sync-lessons.py` after editing the JSON.

### Testing
You can use [jsonlint.com](https://jsonlint.com/) to check the file's JSON syntax before committing, or run `node tools/validate-lessons.mjs` locally for the current edited catalog. You don't need to update application JavaScript to add new lessons with this schema.
