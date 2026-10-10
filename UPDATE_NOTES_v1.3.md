# Piano Play Lab – v1.3 Update Notes

## What changed

### 1) Toy piano layout update
- The on-screen keyboard now uses a **25-key toy piano range from C4 to C6**.
- The SVG piano was redrawn to more closely match the miniature toy piano layout in the provided photo.
- The interface now presents the keyboard inside a compact toy-piano-style body with top controls and side panels.

### 2) Lesson completion / congratulations screen
- Added a dedicated **Congratulations / Lesson Complete** section.
- Displays:
  - **Accuracy percentage**
  - **Actual key presses**
  - **Ideal key presses**
  - **Wrong / extra key presses**
- Includes buttons to:
  - **Restart lesson**
  - **Move to next lesson**

### 3) Progress scoring
- Lesson tracking now counts:
  - total attempts
  - correct attempts
  - incorrect attempts
  - expected number of notes
- Accuracy is computed as:
  - `correct presses / total attempts * 100`

### 4) Success chimes
- A short **success chime** plays on every correct note.
- A longer **celebration chime** plays when the lesson is completed.

### 5) Lesson range update
- The previous C3–C5 keyboard range was changed to **C4–C6**.
- Lessons were updated to fit that toy piano range.

## Files mainly changed
- `index.html`
- `css/styles.css`
- `js/main.js`
- `js/keyboard.js`
- `js/lesson.js`
- `js/music.js`
- `js/sound.js`
- `lessons/lessons.json`
- `tests/core.test.mjs`

## Validation
- Automated tests updated and passing.
