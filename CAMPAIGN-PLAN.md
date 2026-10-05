# Chessia campaign plan

Status: implementation and local verification complete on 2026-10-05. Work stays in this checkout; no push or deploy.

## 1. Engine audit — complete
Acceptance: legal/illegal chess edge cases, draw and repetition after restore, Undo around async opponent responses, save validation, legal enemy fallback, bounded worker search, and equivalent goal outcomes have meaningful tests. Fix failures and rerun tests/build before completing this gate.

## 2. Curriculum — complete
Acceptance: each of pawn, knight, bishop, rook, queen, king; capture, defense, check, king safety, special moves, tactics, mate/stalemate, opening basics, and full game has discover/apply/independent evidence where relevant. Every fixture has a legal witness against its actual reply policy. Difficulty metadata is measured; progression increases gradually. The fork includes an enemy response and a useful second move. Equivalent legal solutions are accepted by outcomes.

## 3. Campaign — complete
Acceptance: one child-facing progression from original introduction through mini games to full game, with map/unlocks/next/replay, skill-linked missions and boss, local Akin/Prin saves and migration, cosmetic rewards without rule changes, hints/Undo without penalty, no timer, accessible English symbols/voice placeholders, skip or reduced motion, and an understandable mapping between fantasy and chess pieces.

## 4. Verification and handoff — complete locally
Acceptance: automated witness replay for all lessons, UI browser path from profile to final game without injected state, desktop/tablet/mobile sanity, promotion/Undo/save/reload/profile/unlock/return/full-game checks, no material browser errors/missing assets, both builds pass, reproducible evidence, and accurate ENGINE-STATUS.md. No claim of child-tested fun or Elo strength.

## Working log
- 2026-10-04: Existing Chess Lab preview has nine fixtures and 28 passing tests. This is the starting point, not accepted as a finished campaign.
- 2026-10-05: Replayed all 12 original lessons and all 37 new quests through the browser UI from a clean Akin profile. Verified the promotion picker, two-move tactics with guard replies, progression to full game, AI response, Undo during and after AI search, save/reload, and Akin/Prin separation. Browser console reported no errors in the final run.
- 2026-10-05: Acceptance review found false pin completion from an unrelated king move, stale hints after a changed position, a countercheck escape edge case, and over-eager legal-square highlights. These were fixed with regression tests.
- 2026-10-05: Curriculum grew to 43 new quests. Queen diagonal movement/capture, capturing and blocking check, and two opening mini games bridge to full chess. Queen fork and guard pursuit now include meaningful legal guard replies. Old 37-quest saves keep their unlocks through migration.
- 2026-10-05: Replayed all six added quests and the revised fork/guard quests in the browser, checked negative pin completion, adaptive hints, fading guidance, and full-game unlock. Tested 390px mobile and 768px tablet layouts without horizontal overflow. No child playtest, Elo measurement, or hosted deployment was performed.
- 2026-10-05: Final verification after review fixes: `pnpm test` passed 41/41; `pnpm build` and `pnpm build:pages` passed. Browser showed the correct second-move guidance and no console errors.
- 2026-10-05: Added visual teaching paths across the original 12 lessons and 43 new quests. Discover animates a legal example with replay/skip, Apply previews before a confirming tap, and Independent adds markers then a path through Help. Knight examples show the two-then-one measure with a direct jump over occupied intermediate squares. Browser checks covered original and new ladders, cancellation, reduced motion, 390px mobile, and 768px tablet. `pnpm test` passed 44/44 and `pnpm build:pages` passed after this addition.
