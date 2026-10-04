# GitHub Pages

This target publishes the current 12-lesson adventure directly at the repository's Pages URL. It does not require Sites hosting or a backend. All game images and recorded audio are bundled.

1. Push the project to the chosen GitHub repository on `main`.
2. In repository Settings → Pages, choose **GitHub Actions** as the source.
3. Run **Publish Chessia to GitHub Pages** from Actions (or push to main).
4. Open the URL shown by the deployment job.

Local verification: `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm build:pages`. Output: `pages-dist/`. The relative asset URLs support a repository subdirectory without knowing its name in advance.

Pages is normally publicly accessible. GitHub Free supports Pages from public repositories; paid plans also support private source repositories, but private source does not by itself make the game private.

Akin and Prin progress remains in each device/browser's local storage. Saves from the previous Sites domain do not automatically transfer to the new GitHub Pages domain. New chapter narration uses device English speech; chapter 1 retains recorded narration.
