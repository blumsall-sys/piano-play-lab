# Deploy Cleo's Piano Play Lab v2.3 to GitHub Pages

## Updating an existing repository (recommended: GitHub Desktop)
1. Download and unzip the v2.3 release.
2. Open GitHub Desktop and **Fetch origin** / **Pull origin** to ensure your existing repository is current.
3. Open the existing repository folder using Repository > Show in Explorer.
4. Copy everything *inside* `Cleos_Piano_Play_Lab` from the new ZIP into that repository folder. Choose **Replace the files in the destination**. Do not remove your `.git` directory.
5. In GitHub Desktop review the changed files, especially `index.html`, `js/`, `css/`, `lessons/` and any new modules.
6. Commit as `Upgrade Cleo's Piano Play Lab to v2.3 Rhythm Highway` and **Push origin**.
7. On GitHub, confirm **Settings > Pages** deploys from `main` / `/(root)` and wait for the Pages build to finish.
8. On Android Chrome, visit `https://YOUR-NAME.github.io/YOUR-REPO/?build=230`, and allow microphone access if prompted. Reload if necessary.

## Uploading from github.com only
Open the repository, choose **Add file > Upload files**, and drag the *contents* of the extracted project folder to the repository root. Include the new files `js/game-ui.js`, `js/rhythm-highway.js`, `css/game-v22.css`. Commit the files and verify the hosted page. Uploading the ZIP itself does not update the site.

## Testing sequence
1. Home should say **Cleo's Piano Play Lab**.
2. Continue opens Lesson 1 with three checkpoints.
3. All 25 keys should span F3 to F5. Tap the highlighted F3 five times; the Congratulations screen should appear.
4. A 70% or better completion unlocks Lesson 2. Later lessons remain locked unless you enable **Unlock all lessons for testing** under Settings.
5. Open Lesson 2, select Perform, press **Start with 4-beat count-in**, and confirm blocks scroll from right to left beneath the fixed PLAY line.
6. On the physical piano, turn on the microphone, verify the input level moves and test isolated notes. For chords start with Build Chord mode in Settings.
7. Tap **Hear Cleo's instructions** and verify the narration begins with the new phrase.

## Troubleshooting
- If the 2.1 layout still appears, you may be seeing cached files or an old repository root. Verify `index.html` is in the publishing root, wait for deployment, reload Chrome, and use `?build=230`.
- If keys animate but your toy piano does not register, inspect Settings > Microphone. Run reference calibration (F3 + C4) if notes consistently appear shifted. The toy piano's audible octave should be verified on the actual device.
- Mic access requires HTTPS or local `localhost` and an explicit permission grant.
- Mic and camera may pause when you switch applications on Android. Return to the page and restart listening.
- Android USB MIDI support is device/browser dependent; on-screen touch always remains available.
- This site does not require a database, build pipeline, subscription, or account.

## Verify Settings microphone fix
1. Open Settings directly from Home without visiting Practice.
2. Tap Start listening in the Microphone setup card, grant permission, and verify the input meter responds.
3. In Piano reference check capture F3 followed by C4 and apply the measured offset.
4. Move to Practice, then back to Settings. The microphone should still show Listening.
5. Clear correction or change input sensitivity and verify that controls update.
