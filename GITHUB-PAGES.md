# GitHub Pages — Chessia

Latest cumulative delivery: `chessia-attack-scale-upload-2026-10-10.zip`.
It includes `source/`, the production build in `site/`, and verification in `reports/`.
The quick-upload kit contains repository-root source batches with fewer than 100 files
each and a separate static-site batch. Full artwork sources and QA reports remain in
the full delivery, outside the quick source batches.

## Upload source to an existing repository

1. Extract the full delivery and overlay the **contents of `source/`** onto the existing
   repository. Alternatively, extract both quick source batches into the same folder;
   their contents merge at the repository root. Preserve `chapter/src/`,
   `chapter/public/`, and `.github/workflows/`. Do not flatten the files.
2. For GitHub's browser uploader, upload one extracted source batch at a time. A ZIP
   uploaded as one file is not automatically extracted. Use a temporary branch until
   every source batch is uploaded and checked: the existing workflow publishes on a
   push to `main`. The workflow is included in the last source batch.
3. Run `pnpm install --frozen-lockfile`, `pnpm test`, and `pnpm build:pages`.
   This delivery passed **84 tests**, TypeScript checking, and the production Pages
   build. The output is `pages-dist/`.
4. Choose GitHub Actions in Settings → Pages. The included `Publish Chessia to GitHub
   Pages` workflow publishes on `main` pushes or manual dispatch. This task did not
   push or deploy.

## Upload an already-built site

Use the **contents of `site/`**, or extract the quick kit's static-site batch at your
hosting root. Keep `index.html` and its asset folders together. Do not mix the static
batch into the source application's folders. Relative asset URLs support Pages roots
and repository subpaths. Serve through HTTP: opening `index.html` as a file does not
support the opponent Worker correctly.

## Included behavior

- 55 journey lessons; Forest school has 24 topics, 96 authored positions, and 36
  short-game starts. Early full chess remains available.
- Full-game Play/Resume cards show actual saved thumbnails. Akin and Prin have separate
  saves. New game retains the previous board; Undo returns the player/AI round.
- All six roles use four existing raster poses. Capture holds the action pose for
  330 ms within an 820 ms attack. A noninteractive victim snapshot stays through
  contact, then fades. Reduced motion uses a static contact cue.
- Stable per-role scale makes Pawn a smaller foot soldier and preserves Knight's
  larger rider-and-horse silhouette. Approved friendly faces and computer masks remain.

Runtime artwork and recorded narration are bundled; later narration uses device speech
with visible text as its fallback. Saves are local to a browser/origin and profile;
there is no account or cross-device sync. Existing village/campaign saves are preserved.
Full games use `chessia-full-game-v1`, preferences use `chessia-ui-preferences-v1`, and
School drafts are separate. Legacy full-game saves are copied without deleting old keys.
Changing domains does not transfer local saves automatically.

`?preview=forest-adventure` isolates QA saves while retaining the whole journey.
`?preview=rook-grove` is the bounded two-quest art preview. Test fixtures, browser
observers, and review pages are excluded from the production site. See `ENGINE-STATUS.md`
and `reports/QA.md` for observations, timing evidence, and physical-device limits.
