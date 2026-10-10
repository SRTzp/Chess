# GitHub Pages — Chessia learning MVP

The Pages target contains the12 original lessons,43 campaign quests, Forest school’s56 authored boards and optional early full chess. Runtime assets and existing recorded narration are bundled; most later VO uses device speech/text.

1. Unzip the delivery package. Overlay the contents of source/ onto the existing Chessia repository, retaining unrelated files. Review the changes before committing them.
2. Run pnpm install --frozen-lockfile, pnpm test and pnpm build:pages. The expected result is60 passing tests and output pages-dist/.
3. To deploy through the existing workflow, choose GitHub Actions in repository Settings → Pages, then run Publish Chessia to GitHub Pages. The included workflow also publishes when main is pushed. No deployment was made by this task.
4. The site/ folder in the delivery package is the already-built static result. Upload its contents, including index.html and all asset folders, to a static hosting root. A ZIP uploaded as one repository file will not be unpacked or hosted automatically.

Relative URLs support both a Pages root and repository subpaths. Test through HTTP, not by opening index.html as a file: the opponent Worker needs an HTTP origin. The optional ?preview=forest-adventure isolates local QA saves while retaining the whole forest journey; ?preview=rook-grove is the intentionally bounded two-quest art preview.

Saves are per browser/origin and profile. Existing village/campaign keys are preserved; the learning journal and drafts are separate. Account sign-in, sync and automatic save transfer between domains are not implemented. Back up local progress before changing origins. See ENGINE-STATUS.md and the delivery reports for exact limits and asset budgets.
