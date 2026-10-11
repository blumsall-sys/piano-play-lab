# Update your GitHub Pages website to v2.5

1. Extract the v2.5 ZIP archive.
2. Copy the **contents inside** `Cleos_Piano_Play_Lab` into your existing repository (not an extra nested folder).
3. Replace older versions of `index.html`, `js/` and `css/`. **Make sure `js/loop-practice.js` is uploaded as a new file**. Keep your existing Git configuration.
4. Commit changes and push to your publishing branch (normally `main`). GitHub Pages should continue using the existing root `index.html`.
5. Wait for GitHub Pages to deploy, then open the published URL with `?build=250` appended.
6. Verify the app says **v2.5 READY**, choose Practice → Perform, and look for the checked **3 tries · 1-bar breaks** control.
7. Allow mic permissions on HTTPS or connect M-Audio on desktop Chrome using USB MIDI.

For local Windows testing, close any previous launcher, extract to a new folder and run `START_WINDOWS.bat`; visit `http://localhost:8000/?build=250`.
