# Chessia — Pegasus & Golem prototype

Three introductory lessons at `/shrine/`, built with Phaser 3.90, TypeScript and Vite. The original prototype remains at `/`.

## Run
`pnpm install` then `pnpm dev` (http://127.0.0.1:4174/shrine/).
`pnpm test` checks the pure simulation; `pnpm build` typechecks and builds to dist/shrine.
Serve dist as the web root; opening index.html directly from disk is not supported.

## What is implemented
- Uniform 6×6 stone grid in a fantasy shrine; one square equals one chess coordinate.
- Exact knight L moves and rook straight-line captures, alternating turns.
- Three very short lessons: watch and copy, avoid rook attacks, capture the rook without automatic movement hints.
- Deterministic enemy patrol, not a full chess AI. No kings, check, checkmate or special rules in this isolated lesson.
- Undo restores both pieces and patrol state for a complete round. No penalty.
- Cancellable move animations, light idle motion, reduced-motion setting, sound effects, progressive hints and local completion storage.
- Thai speech uses an installed Thai Web Speech voice. Availability depends on device/browser; a visible notice appears if unavailable. No prerecorded Thai voice assets are shipped.
- Touch controls and keyboard arrow/Enter navigation.

## Structure
shrine/src/simulation.ts owns rules, turn state and hint search.
renderer.ts owns Phaser drawing and animation; main.ts coordinates DOM controls, audio and cancellable turns.

## Verification
7 simulation tests passed, including all lesson solutions, illegal moves, capture/loss, full-round undo and undo before enemy reply. TypeScript and production build passed.
Browser inspection: desktop scene, highlighted threats, enemy response, undo, final capture/completion, responsive 390×844 layout. No console errors observed in the test tab. This is not a playtest with children; difficulty and learning transfer are not validated yet.
Build notes: Phaser's bundled JS triggers Vite's >500 kB chunk warning (about 347 kB gzip). The public sprite URL resolves at runtime.

## Art provenance
AI-generated shrine environment: orthographic SNES-style ruined forest shrine, plain central clearing, perimeter stone ruins and river, no prepainted gameplay grid, UI or characters. Generated using the available GPT image tool. Existing project hero atlas reused, with a violet tint for the opposing rook golem. PixelLab was not connected. Sprite movement is tween animation, not authored multi-frame walk cycles.

Suggested next research: observe whether a child can repeat the knight move without highlights, recognize the rook's threat before moving, and transfer the same move to a plain chess diagram. Tune lesson length after that observation.

## Visual polish update
Added bounded firefly/leaf particles outside the board, water highlights mapped to the background image, moss and stone variations, character grounding shadows, banking knight jumps, rook sway, landing dust, capture sparks and local victory particles. Ambient motion and movement tilt stop in reduced-motion mode; Undo clears pending particles and movement transforms. No changes to simulation rules or lesson progression.
Validation: typecheck/build and all 7 simulation tests passed; browser walkthrough covered capture, complete-round Undo and reduced-motion settings, with no console errors observed.
