# Agreed curriculum audit — coverage and raster integration completed (2026-10-10)

Authority: CAMPAIGN-PLAN.md plus the user-requested bounded-MVP expansion brief. No advanced topics beyond that scope are added. Counts55 lessons/56 school positions were a checkpoint, not complete coverage. Existing campaign IDs, saves and earned skins are preserved.

| Planned skill | Existing implementation | Gap found | Acceptance to close |
|---|---|---|---|
|Pawn first: forward/two-step/capture/block|rules.ts original6; bank.ts4 Pawn boards|Use beyond isolated probes is narrow|Keep introduction; promotion/pawn short games with actual replies and changed board|
|Knight: L/jump/capture|original6; bank4; visual-path.ts|No role-specific short-game transfer|Changed independent boards +short game requiring multiple jumps/capture/survival|
|Rook/Bishop/Queen line/capture/block|campaign road/rescue/cover; bank4 per role|No short-game role transfer; Queen blocker context thin|Block/jump negative legality; legal multi-turn role games; distinct new independent boards|
|King step/safety|king-step/king-safe; bank4|Active endgame king treated as one step|Active king recognition plus pawn-defense/create-passer mini-game use|
|Threat/safety/check responses|king-escape/capture/block; prevent bank4|No full discover/practice/independent check/threat bank|New contextual bank outcomes accepting valid alternatives; real response tests|
|Checkmate/stalemate|mate/rook/light/stalemate-choice|No explicit stalemate outcome; mates are all mate-in-one|Differentiate draw from mate; changed boards +rook/queen two-or-more-move mates|
|Opening centre/develop/safe king/castling|opening5; team4; castle3|Opening short plans only2 moves; no castle School ladder|Castle bank, multi-turn opening team mini with development/castle outcomes|
|Promotion/en passant|campaign3 each|No separate School ladders|4 finite contexts each; all promotion choices; one-turn en-passant negative|
|Fork/pin/discovery|campaign9; bank4 each|Bank exact-square selection rejects equivalent tactical outcomes|Outcome acceptance and actual replies; transfer through existing campaign multi-turn plans/full game|
|Middle attack weakness/activate/prophylaxis|weakness/activity/prevent4 each|One move is a probe, not strategic transfer|Attack/active-rook/safety mini-games with multiple enemy replies; honest probe labels|
|Endgame attack/defend pawns|weak-pawn mini|Only capture/survive, no defense transfer|Pawn-defense and active-rook weak-pawn games, safe actual reply outcomes|
|Create/escort passed pawn/promotion|passer4, promotion mini|No creation, escort can be skipped|Creation bank +multi-turn create/escort/promotion mini; maintain legacy promotion mini|
|Independent/fade/review/rewards|ledger/draft/room|School loops one role into full game; new topics not retained in journal|Guided topic trail, validated new skill keys, existing receipts/ownership retained; no assisted/repeat mastery|
|Full-game bridge|hub/model;67-test engine checkpoint|Later plans hidden behind Practice|Visible map-to-plans route and optional early full game; history/resume/race re-evaluation|
|Art|approvedPawn/Knight/King; Rook/Bishop/Queen SVG drafts|Not finished raster art|After engine gate: actual built-in imagegen raster atlases +normalized frames +phone integration review|

## Implemented closure and acceptance anchors

| Gap | Implemented | Verification |
|---|---|---|
| Role use beyond isolated move | mini.ts role games for Knight/Rook/Bishop/Queen, safe captures and multiple replies | curriculum-closure.test.ts: all36 starts replayed; short-game-witnesses.json |
| Check, threat, castle, promotion, en-passant, mate, draw ladders | plans-bank.ts:40 new positions; bank.ts original56 preserved | learning-journal.test.ts all96 positive and negative acceptance paths |
| Active king/pawn defense/passer creation | plans-bank.ts recognition plus mini.ts create/escort/promote, pawn-defense | real check/escort and all4 promotion choices tested; create-passer manually completed in browser |
| Meaningful strategic transfer | 18 mini kinds ×2 starts, prevention before capture, distinct minor development/castle, actual forks/pins/discovery | curriculum-closure.test.ts includes counterexamples; recognition probes are not proof of strategic mastery |
| Actual-board goal acceptance | bank.ts uses last actual move before/after via public Session.goalMet; outcome checks rather than stale starting answers | changed-board false mate and fake completed draft rejected |
| Current hints/visible Watch | trialHintMove actual legal board; mini-guidance.ts only legal authored continuation, otherwise plan reminder; cancellable overlay | changed-plan hint test; browser Knight Watch/resize |
| Guided curriculum/retained evidence | trail.ts24 topics, room.ts Next friend; ledger validates24 skills; draft validates new keys with old versions | Pawn→Knight browser; assisted/repeated/review no independent credit; legacy gear/profile tests |
| Bridge/teaching opponent boundary | lab.ts Map→Forest plans and final campaign→plans; lesson replies use authored pedagogical policy, full game retains worker search | browser Map→Team; original campaign witnesses and full-game regressions pass |
| Engine/UI reevaluation | unchanged bounded full-game engine;77 tests, tsc/Pages build; phone/tablet/sample flows | ENGINE-GATE.md and fresh engine-benchmark.json; no Elo or physical-device claim |

Phase1 coverage closure and Phase2 gate passed before artwork generation. Original55 campaign lessons remain unchanged in identity/order. New School coverage is96 positions,24 topics and36 short-game starts. These are finite authored content and learning signals, not validated learning outcomes. Physical-device/child testing and recorded VO remain outside this verification. Phase3 completed: real raster Rook/Bishop/Queen atlases,4 action frames for each of4 tiers, approved Rook identity and enemy-only Knight-style faces. Phone/tablet integration and45px silhouette check passed; ART-QA.md covers exact validation and limits.
