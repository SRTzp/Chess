# GitHub Pages — Chessia learning and full game

The Pages target contains the12 original lessons,43 campaign quests, Forest school’s56 authored boards and optional early full chess. Runtime assets and existing recorded narration are bundled; most later VO uses device speech/text.

1. Unzip the delivery package. Overlay the contents of source/ onto the existing Chessia repository, retaining unrelated files. Review the changes before committing them.
2. Run pnpm install --frozen-lockfile, pnpm test and pnpm build:pages. The expected result is77 passing tests and output pages-dist/.
3. To deploy through the existing workflow, choose GitHub Actions in repository Settings → Pages, then run Publish Chessia to GitHub Pages. The included workflow also publishes when main is pushed. No deployment was made by this task.
4. The site/ folder in the delivery package is the already-built static result. Upload its contents, including index.html and all asset folders, to a static hosting root. A ZIP uploaded as one repository file will not be unpacked or hosted automatically.

Relative URLs support both a Pages root and repository subpaths. Test through HTTP, not by opening index.html as a file: the opponent Worker needs an HTTP origin. The optional ?preview=forest-adventure isolates local QA saves while retaining the whole forest journey; ?preview=rook-grove is the intentionally bounded two-quest art preview.

Saves are per browser/origin and profile. Existing village/campaign keys are preserved; the learning journal and drafts are separate. Account sign-in, sync and automatic save transfer between domains are not implemented. Back up local progress before changing origins. See ENGINE-STATUS.md and the delivery reports for exact limits and asset budgets.

Full-game update: direct Play/Resume cards use actual saved thumbnails, a per-profile chessia-full-game-v1 store and bounded Worker AI. Legacy campaign/School full-game saves are copied without deleting old keys. New game retains a Previous game. Use the latest chessia-fullgame-upload-2026-10-10.zip delivery; reports/QA.md records validation and limitations.

Latest polish delivery: chessia-fantasy-polish-upload-2026-10-10.zip includes all preceding changes plus Bishop/Queen SVG character skins, saved presentation preferences and visual action cues. Expected test count69. The static companion ZIP has the same site at archive root. Preferences key chessia-ui-preferences-v1 stores only validated per-profile view choices; no progress/reward fields. See reports/QA.md for tested Worker/no-voice recovery and vector/device/performance limits.


Latest completed bundle: chessia-curriculum-raster-upload-2026-10-10.zip. It contains source/, site/ and reports/ with original55 lessons, School24 topics/96 positions/36 short-game starts, all preceding full-game/worker/preferences fixes, and finished raster Rook/Bishop/Queen animations. Run pnpm test (77 tests) and pnpm build:pages from source/. The companion pages ZIP places production site files directly at archive root. New raster assets have relative Pages URLs, true alpha and per-tier shared frame anchors. See reports/UPLOAD.md, CURRICULUM-COVERAGE.md, ENGINE-GATE.md and ART-QA.md. QA previews and storage fixtures are excluded from site/.
