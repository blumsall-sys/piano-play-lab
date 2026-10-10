# Piano Play Lab v1.8.1 — Nine-Lesson Reliability Fix

## Root cause / audit
The previous v1.8 ZIP **did** contain nine entries in `lessons/lessons.json` and the melody preview code, but `index.html` initially contained only four hard-coded lesson options. JavaScript had to load the JSON asynchronously to replace them. If an old `index.html`/JavaScript was served, or the boot sequence failed or stalled, the page still showed four entries. The preview button was also intentionally hidden for the first four lessons. An outdated local server or browser cache can make this look like a failed upload.

## Corrections
1. All **nine lessons** are included as native HTML dropdown options and an embedded lesson catalog in `index.html`.
2. Lesson initialization reads the embedded catalog **synchronously**. `lessons.json` remains an editable source mirror, not a runtime network dependency.
3. Listing microphone devices is **non-blocking** and cannot delay lesson initialization.
4. The **Hear whole melody** button is visible in *all nine* lessons. Original lessons use a steady-beat preview; the five added melodies retain their individual rhythm patterns.
5. Added a version/readiness indicator: `v1.8.1 READY · 9 lessons loaded · 5 timed melodies`.
6. Updated browser cache-buster query strings to `v=1.8.1`.
7. Added a build-consistency test to detect missing embedded lessons, missing controls and stale versions before releases.
8. Added `tools/sync-lessons.py` for future edits to synchronize the HTML catalog from `lessons/lessons.json`.

## Test sequence
1. Fully close any previous local server window. If port 8000 is already in use, a new START_WINDOWS.bat cannot replace the old server.
2. Extract v1.8.1 to a **new** folder; open that folder and run `START_WINDOWS.bat`.
3. Open `http://localhost:8000/?build=181` and hard-refresh (Ctrl + Shift + R).
4. The small line below the lesson selection should say `v1.8.1 READY · 9 lessons loaded · 5 timed melodies`.
5. Open the lesson list. There should be nine lessons, with *Twinkle Twinkle Little Star* at #5.
6. `Hear whole melody` appears for all nine lessons. Test playing and stopping a preview, then tap a displayed key to check the lesson advances.
7. For GitHub Pages, upload all project contents **without an extra enclosing folder**. Confirm the public `index.html` shows **1.8.1**. Visit your site with `?build=181` on the end of the URL to bypass a stale index cache.

## Editing lessons later
Change `lessons/lessons.json`, then run `py -3 tools\\sync-lessons.py` on Windows (or `python tools/sync-lessons.py`). Upload/commit both `lessons/lessons.json` and `index.html` with the code changes.

## Known limitations
- This is still **single-note microphone pitch detection**, not live polyphonic chord recognition.
- Exact microphone recognition with an acoustic toy keyboard varies by device and room. No real hardware testing was performed in this container.
- Browser voices depend on the operating system.
