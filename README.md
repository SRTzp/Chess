# Chessia

A pixel-art chess learning adventure with 12 lessons: Pawn Valley and Knight Bridge.

## Publish the game
After uploading all files, open Settings → Pages and choose GitHub Actions as Source. Then open Actions → Publish Chessia to GitHub Pages → Run workflow.

## Development
Use Node.js 24 and the pnpm version in package.json.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build:pages
```

The playable build is in pages-dist/. All game artwork and 28 recorded narration clips are included. Chapter 2 uses device English speech. Akin and Prin progress is stored separately in the current browser, without cloud sync. Moving to a different domain does not transfer existing saves.
