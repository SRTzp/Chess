# Chessia — learning MVP and full-game entry/AI (2026-10-10)

The A–D implementation is complete locally. It is a bounded authored learning MVP with explicit asset and validation limits; no commit, push or deployment was made in this completion run.

-55 lessons remain:12 original Pawn/Knight quests and43 campaign quests. The map keeps prerequisites; optional full chess is now available early. Authored safe king/development alternatives and recapture-based defence replace exact-square-only judgements for those outcomes.
-Forest school adds56 finite authored positions across6 roles and8 tactic/strategy categories. Discover, changed practice, first-attempt independent use, actual enemy replies, bounded multi-turn promotion/weak-pawn games, due/manual reviews and early full games are playable.
-Separate validated per-profile/per-skill local evidence records seen FENs, shown support, bounded receipts, review dates and owned cosmetics. Hints, Undo, invalid landings and repeat boards retain rewards but cannot create new independent evidence. Configurable thresholds are practice1 / independent role variants2 / tactic or strategy new outcome1. They are learning signals, not certified mastery or Elo.
-Legacy saves and already-owned Pawn/Knight gear are preserved. Existing campaign badges remain journey milestones. New gear belongs to each role; tactics and plans have separate cosmetic badges and scene accents. No XP, gacha, economy, kill farming or chess-stat buffs.
-Forest is the default visual route. Rook uses a block tower silhouette; King uses a crown, cape and staff. Original Rook golem skins remain selectable in School. Pawn/Knight use existing raster tiers; King uses existing poses/accent tiers; Bishop/Queen use explicit chess-vector fallbacks. Standard symbols and8×8 coordinates bridge fantasy and real chess.
-School loads on demand, forest skips unused classic art preloads, and the village scene pauses behind the map/school. Direct knight flights and effects cancel on Undo/resize/reduced motion; promotion uses four in-page choices. No voice wait blocks input. Late narration still uses device English speech/text.

## Verification

60/60 tests pass: original50 baseline plus10 meaningful new strategic/evidence/mini-game tests. All43 campaign witnesses remain valid. All56 new trial witnesses are playable through Match, meet the goal and survive the real bounded opponent reply; legal negative moves fail. Tests cover journal dedup/isolation/support/review/legacy retention, validated drafts and corrupt saves, round Undo, multi-turn mini-games and all four promotion choices. TypeScript and Pages production build pass.

Browser QA completed the Pawn learning loop, Knight Help/Undo and blockers, all3 tactics and5 strategic categories, Bishop/Queen moves, due review, saved resume, profile isolation, early full chess, campaign king/development alternatives and forest map navigation. Stage-access fixtures were used for selected campaign checks; this does not claim a new manual replay of all55 lessons. Final console reads had no errors. A stale/mismatched browser image was excluded and final game screenshots were recaptured on a fresh tab with saved move count0.

School viewport cells:390×844 ~46.55px;375×667 ~44.75px;768×1024 and1440×900 ~69.75px;844×390 landscape ~46.5px. Original Knight cells ~46.75px at390×844. No horizontal overflow was observed. QA storage and viewport overrides were restored.

## Remaining limits

The bank is finite and the thresholds are uncalibrated. No claims of complete chess coverage, child engagement, long-term retention or playing strength. Bishop/Queen fantasy raster art and most later recorded VO remain unfinished; functional fallbacks are visible. Physical iOS/Android, slow devices/networks and a full accessibility/device matrix were not tested. Short legacy village layouts can have smaller squares; School provides the compact8×8 practice view.

Initial forest images total ~7.47MiB before cache/compression; the Phaser bundle remains ~1.6MB minified/~390KB gzip and Vite warns about chunk size. School is a small lazy chunk, and King/original Rook art/audio load when used. This is not a slow-phone performance guarantee.

## Build and upload

Run pnpm install --frozen-lockfile, pnpm test, pnpm build:pages in the existing repository. Relative asset URLs support Pages repository subpaths. Use GITHUB-PAGES.md for deployment instructions; uploads and deployment are user actions. Reports include coverage-55.csv, variant-bank.json, QA.md, completion/checkpoint documents, exact asset budgets and SHA256 manifests in the dated delivery folder.

## Full-game follow-up

Direct per-profile Play/Resume, actual saved thumbnails, recoverable Previous game and Worker-based full-game AI are complete locally. Full-game history/FEN/tier validates through chessia-full-game-v1; legacy full games are copied without deleting original stores. AI now includes bounded iterative tactical search and development/king/endgame evaluation. Teaching reply policy remains separate.

Latest validation:67/67 tests, TypeScript and Pages build pass. Browser Play →exit →Resume →reload →Undo, New/Previous, profile isolation and exit while AI thinks passed. Responsive views375/390/768/1440 and844 landscape showed no horizontal overflow. Desktop benchmark exposes actual completed depths and budget limits; difficulty has no calibrated Elo or mobile performance guarantee. See fullgame-entry-ai-2026-10-10/QA.md and benchmark.json in delivery reports. Earlier60-test learning validation above remains its historical checkpoint.

## Fantasy/preferences/failure recovery follow-up (2026-10-10)

Latest delivery has69/69 passing tests, TypeScript and Pages production build. Bishop/Queen now use8 repo-native fantasy SVG skins through the existing cosmetic tiers; they are readable vector refinements, not final pixel art. Full-game/School symbols and motion persist in validated per-profile preferences; adventure shares the motion setting. Preferences have a separate key and preserve OS fallback if no explicit override.

Legal landing dots, checked-King warning, labelled promotion and visible endgame New game were verified. Both Worker constructor failure and actual missing-module load error recovered through Retry with exactly one AI reply. No-English-voice fallback retained visual input. Physical devices, slow hardware, child comprehension, complete accessibility and recorded VO remain unverified. Earlier60/67-test checkpoints remain historical; the AI search and pedagogy were not rewritten. See latest fantasy-polish delivery reports for exact scope and upload instructions.


## Latest curriculum and finished-art delivery (2026-10-10)

77/77 tests, TypeScript and Pages build pass. All original55 lesson identities/order retained. School now24 finite topics/96 trial positions and36 bounded short-game starts (18 kinds ×2), including role games, actual multi-turn mates, opening development/castling, threats/prevention and creating/escorting/defending passed pawns. Actual-position goal acceptance and current legal hints prevent stale answers. Map explicitly opens Forest plans; Next friend progresses the24-topic trail. Lessons keep authored teaching replies separate from full-game Worker AI. Coverage and actual replay witnesses are in CURRICULUM-COVERAGE.md and the latest reports.

SVG drafts are superseded at runtime by genuine raster Rook/Bishop/Queen tier/action atlases. Approved stone-golem Rook identity retained, distinguished from humanoid crown/cape/scepter King at45px. Only computer Bishop/Queen wear dark Knight-style masks/eye slits. Three atlases total1,128,770bytes; reduced motion uses still frame. Original Pawn/Knight/King and reward thresholds retained. School/full-game browser integration passes; final console error read empty. Large Phaser bundle warning and physical-device/child-recognition/Elo limits remain. Source/static ZIP includes prior fixes, curriculum closure, selected art/prompt provenance and full hash manifest. No commit, push or deployment.

## Animation completion — 2026-10-10

Pawn/Knight/King real pose atlases and disposable visual travel are integrated. All80 tests, TypeScript and Pages build pass. Engine logic, AI tickets, original curriculum and reward rules are retained. This pass does not claim a new engine benchmark or Elo measurement. See the updated animation package QA/state coverage.
