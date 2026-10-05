# Chessia campaign status

Local implementation and verification completed 2026-10-05. No push or deployment was made.

## What is playable

- The original 12 Pawn Valley and Knight Bridge lessons remain in place. The Adventure Map continues with 43 new quests, then unlocks a full chess game with gentle, steady, and challenge opponents.
- New worlds teach rook, bishop, queen (called the winged light guardian in the story), king safety, check, castling, promotion, en passant, fork, pin, discovered attack, checkmate, stalemate, and opening basics. The Mist Boss is an independent checkmate quest. The two-step fork includes a legal enemy reply and a useful capture.
- Akin and Prin have separate local saves. The `chessia-pawn-chapter-v1` saves and original levels are preserved. Existing `chessia-lab-v1` progress is migrated into `chessia-campaign-v2` where it matches the new sequence; old preview achievements are retained separately. Earlier 37-quest campaign saves retain their unlocks when the six inserted lessons are credited during migration.
- Hints, Undo, replay, badges, sound toggle, reduced motion, and an in-page four-choice promotion picker are available. Visual paths mark straight moves, diagonal moves, captures, castling, and the knight's two-then-one L shape. The knight's ghost makes one direct jump; measuring corners are never treated as occupied squares. Discover lessons show a demo that can be replayed or skipped. Apply lessons preview the path and require a second tap on the landing square. Independent lessons begin without target markers or a path; Help restores markers first and then the path. Demo, voice, and preview state cancel on Undo, level changes, map navigation, resize, and reduced motion changes. Hints after a move use the current board. There is no timer or hint penalty. Capture text is nonviolent. New quests use English text, chess symbols, and device speech as a placeholder; no new art or recorded audio was added.

## Engine and validation

- `chapter/src/engine/chess.ts` wraps chess.js 1.4.0 for legal moves and endings. Save/restore validates the starting FEN, exact move history, and round boundaries. `session.ts` evaluates goal outcomes from legal positions, replays saved sessions, and rejects invalid completion flags.
- The opponent runs in a Worker with bounded search: gentle depth 1 / 700 nodes, steady depth 2 / 5,000 nodes, challenge depth 3 / 18,000 nodes. Illegal responses fall back to legal moves. These settings are not Elo ratings.
- Every new quest has a legal witness replayed by automated tests against its actual reply policy. Pin goals require a new pin created by the moved piece, and countercheck counts as escaping a check when the player's move is legal. Queen diagonal, check capture/block, and multi-move opening mini games fill curriculum gaps. Piece count, legal choice count, planning depth, ladder stage, and hint tier are recorded. Choice count alone is not a calibrated difficulty measure.

## Verification performed

- `pnpm test`: 44/44 passing at the final run. Tests cover edge rules, draws and repetition, promotion alternatives, castling rights, en passant expiry, save corruption, Undo, bounded AI search, equivalent goals, negative tactic moves, adaptive hints, countercheck, old save migration, all 43 quest witnesses, visual move geometry, blockers, and demo cancellation.
- `pnpm build` and `pnpm build:pages`: passed. Vite reports a large chapter JS chunk warning; this is a size warning, not a build failure.
- Browser UI: played all 12 original lessons and the original 37 new quests from a clean Akin profile, then entered full game. After the review fixes, replayed the six inserted lessons and revised fork/guard quests, verified unrelated king moves do not finish a pin, hints follow a changed board, independent legal-square glow appears after requesting help, and old saves still unlock full game. Also verified AI response, Undo during and after search, save/reload, Akin/Prin separation, and map unlocks. The promotion UI was fixed after the browser exposed an unsupported native prompt. Final browser console showed no errors.
- Visual-aid browser checks: original knight Discover showed two measuring segments, a direct-jump ghost, and replay; a knight jumped over a friendly piece and still completed the lesson. Original and new Apply quests previewed without moving a piece until the second tap. Original and new Independent quests showed no path initially, target markers at Help 1, and a path at Help 2. New Discover replay worked, and Undo canceled an active original demo. Reduced motion showed static segments without a ghost. Responsive checks at 390px and 768px showed aligned overlay endpoints and no horizontal overflow. Browser console had no errors during these checks. This is a layout and interaction sanity check, not a full device/browser matrix.

Child enjoyment and calibrated difficulty still need observation with children. Opponent playing strength and slow-device search time have not been measured. No hosted deployment was tested.

## Reproduce locally

```sh
PATH=/Users/peach/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm test
PATH=/Users/peach/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm build
PATH=/Users/peach/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm build:pages
PATH=/Users/peach/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm chapter
```

Open the chapter URL printed by Vite, choose a profile, then select **Adventure Map**. Completing the original 12 lessons unlocks the new quests.
