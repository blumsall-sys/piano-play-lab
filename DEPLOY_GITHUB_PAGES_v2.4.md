# Deploy Cleo's Piano Play Lab v2.4

1. Extract the ZIP on Windows. Open `Cleos_Piano_Play_Lab`.
2. To test locally, double-click `START_WINDOWS.bat` and visit `http://localhost:8000/?build=240`.
3. In GitHub, open the existing Piano Play Lab repository and replace its files with the **contents** of that folder. Do not upload the ZIP itself and do not nest `index.html` inside a second folder.
4. Ensure new `js/keyboard-profiles.js` and updated `js/sound.js`, `js/keyboard.js`, `js/main.js`, `js/game-ui.js`, `css/game-v22.css` are present.
5. Commit the changes to the branch used for GitHub Pages (typically `main`). Push if using GitHub Desktop.
6. Verify Settings → Pages uses the correct source branch and `/(root)` if that is your existing setup.
7. Wait for the deploy action, then open the site's HTTPS URL with `?build=240` (e.g. `https://USERNAME.github.io/REPO/?build=240`).
8. On Windows Chrome test both layouts. On an Android tablet you can still run the on-screen piano; USB MIDI capability varies by browser/device.

Current build indicator: **v2.4 READY**. If an older version appears, check the uploaded `index.html`, wait for deployment, and hard reload.

For first-time M-Audio setup, read `M_AUDIO_SETUP_v2.4.md`.
