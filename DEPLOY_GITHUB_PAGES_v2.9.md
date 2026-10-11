# GitHub Pages upgrade to v2.9

1. Extract either the complete `Cleo's Piano Play Lab` project ZIP or the smaller patch ZIP.
2. Open your GitHub repository (normally the `main` branch where `index.html` lives).
3. For the **complete ZIP**, copy the **contents** of its `Cleos_Piano_Play_Lab/` directory to the root of your cloned repository, replacing the old files, and commit/push. Keep the `.git` directory if using GitHub Desktop.
4. For the **patch ZIP**, upload or copy the six changed files in their existing relative paths, then commit/push. Do not create another nested application folder.
5. Wait for GitHub Pages to publish. Open `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/?build=290` to force a new top-level URL.
6. Confirm that the visible indicator says **v2.9 READY** and that Lesson 21 begins with **0 / 27** expected notes in Learn Mode with repeats enabled.
7. Play the first nine notes. You should see a four-beat rest and `Repetition 2 / 3`, not the end-of-lesson screen.

### Future lesson updates
New lessons can still be added using **only `lessons/lessons.json`** after this one-time code upgrade. All new lessons automatically inherit the same three-repetition behaviour unless it is explicitly disabled in the interface for that session.
