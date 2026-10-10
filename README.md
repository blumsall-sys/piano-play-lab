# Piano Play Lab v1.8.1

Nine-lesson, 25-key F3–F5 toy piano learning app. Browser-based microphone pitch recognition, note labels, keyboard touch input, editable spoken lesson instructions, progress scoring and rhythmic previews. No paid APIs or backend.

## Quick start
- **Windows:** Double-click `START_WINDOWS.bat` in the extracted project folder and navigate to `http://localhost:8000/?build=181`.
- **Other platforms:** Run a static localhost HTTP server from the project folder.
- **GitHub Pages:** Upload all contents at the repository Pages root and open the HTTPS site. `index.html` must sit in the publishing root.

Verify the readiness indicator says **v1.8.1 READY · 9 lessons loaded · 5 timed melodies**. If you see only four lessons, you are viewing an older release, or the latest code has not loaded. Fully close old local servers, update the GitHub root files, then hard refresh or use `?build=181`.

## Nine lessons
1. Find the First F
2. Five-Finger Walk
3. A Little Melody
4. High and Low F
5. Twinkle Twinkle Little Star
6. Wheels on the Bus · Traditional Tune
7. Puppy Rescue Parade · Original
8. Ice Cream Truck · The Entertainer
9. Mary Had a Little Lamb

The first four use simple, even-tempo full-sequence previews. The five added melodies have individual beat lengths in lesson data. Rhythm is demonstrated but not graded.

## Project structure
- `index.html` — interface and a full nine-lesson embedded catalog (ensures no stale JSON fetch on launch)
- `js/` — SVG keyboard, audio recognition, narration and playback code
- `lessons/lessons.json` — authoring mirror of the nine lessons
- `css/` and `assets/` — styles and vector artwork
- `tools/sync-lessons.py` — updates the embedded catalog and selector from edited lessons.json
- `tests/` — automated source, pitch, lesson and release checks

## Change lessons
Edit `lessons/lessons.json` then run `py -3 tools\\sync-lessons.py`. Commit **both** `index.html` and the JSON file.

## Test suite (optional)
If Node.js is installed, run `npm test` to check all lesson files, pitch simulation, voice guide and release consistency.

## Privacy and platform limits
The microphone and camera require browser permission and localhost/HTTPS. Raw microphone analysis is local and no microphone or webcam audio/video is uploaded by this app. Device/browser voices vary. Laptop/tablet microphone pitch recognition is approximate, particularly for simultaneous notes. No physical Android microphone test was performed for this release.

For detailed troubleshooting and deployment steps see `RELEASE_FIX_v1.8.1.md`.
