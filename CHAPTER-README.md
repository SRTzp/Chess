# Chessia — Chapter 1: Friends in the Mist

Playable route: `/chapter/`. This is a twelve-lesson prototype across Pawn Valley and Knight Bridge, not the full planned curriculum. `/shrine/` and the original root prototype are preserved.

## Included
- Akin (อคิน) and Prin (ปริน) local profiles, separate completion, current board, hint state and full-round undo history.
- English story introductions and short guidance with profile names; replay and mute.
- Approved original dragon A v3: generated transparent 4×4 animation atlas (idle, flap, celebration, hint). Shared runtime scale and foot-anchor normalization. Existing hero atlas/environment reused. No PixelLab connection.
- Lessons: one-step movement, a blocking friendly pawn and explicit scripted demonstration, diagonal capture, moving before capturing, initial two-square option, two-pawn enemy-response challenge.
- Demonstration ghosts, legal-move highlights early, unassisted mixed lessons, on-demand threat/hint overlays, and no score/Undo penalty.
- Non-violent capture particles, ambient effects, reduced motion, keyboard/touch controls, completion dragon badge.
- Save after accepted moves and settled replies. Reloading an in-progress enemy turn settles it once before resuming. Undo restores the complete round.

## Boundaries
- Local browser profiles, not a parent login service. No cloud sync, remote child accounts, telemetry or purchases.
- Speech uses an installed English Web Speech voice, not prerecorded voice acting. Voice quality/availability depend on device. Missing English support is reported in the UI; visuals remain usable. Normal speech interruption is not treated as a missing voice.
- This chapter uses a 5×6 training area with designated starting rows; it does not teach promotion, en passant, kings or checkmate. Pawns retain correct forward/capture directions and blocker/double-step checks. In these isolated lessons, the enemy passes if it has no legal move; this is not presented as a full-chess stalemate rule.
- Friendly opening move in lesson 2 is a tutorial cutscene, not the child's chess turn.
- Hint defaults fade by lesson; no claim of a validated adaptive mastery model.
- Art/voice/story staging remain prototype quality. This build has not been playtested with children.

## Development
`pnpm install`
`pnpm chapter` serves http://127.0.0.1:4175/chapter/
`pnpm test` runs the chapter and shrine suites.
`pnpm build` typechecks and builds both routes into dist.

Rules live in chapter/src/rules.ts; scene.ts is rendering only; main.ts coordinates input, local storage and cancellable turns. speech.ts manages English Web Speech and synthesized effects.

## Validation
14 tests passed across both prototypes, including winning routes for all six chapter lessons, forward vs diagonal movement, blocked double-step, enemy capture, full-round undo, pending-turn undo, save shape validation, and capture occupancy.
Browser walkthrough completed all 6 levels, tested profile isolation (Akin completed while Prin remained new), undo during animation then reload, desktop visuals and 390×844 responsive layout. No browser console errors observed during the checks. Build warning: Phaser bundle about 350 kB gzip; public asset URLs resolve at runtime.

## Dragon A v3 update
Atlas has 16 frames on a 1254×1254 alpha PNG. Runtime cuts cells at integer boundaries, crops alpha bounds and uses one shared scale. Idle/blink and occasional flap loop; lesson start flaps, hints point, victory celebrates. Reduced-motion freezes to the neutral pose; Undo/reset clears the action. Hint button uses the same art. TypeScript and production build passed. In-engine animation QA remains pending: network permission was not granted when restarting the local preview server. The prior local preview was stopped for refresh and is not currently running.

## English language update
All active chapter and shrine narration, lesson copy, controls, accessibility labels, and parent notes use English. Profile names are Akin and Prin; the dragon is named Toothless. Voice selection uses an English device voice and its matching locale, not prerecorded narration. Existing local save keys and chess rules are unchanged. Build and all 14 rule tests passed. Chapter desktop and 390×844 layouts, profile screen, story and parent notes were inspected in the browser. Actual voice quality was not audited. The local chapter preview is running on port 4175. This update has not been published to the hosted site.

## Recorded opening narration
Chapter 1 introduction now uses the supplied 2026-09-26 13:39 Liam MP3 (15.65 seconds), at chapter/public/audio/chapter-1-intro-liam.mp3. The displayed introduction matches the requested recording script and is shared by both profiles. Listen and story replay repeat the recording. New speech, mute, camp, and settings stop playback; stale playback failures cannot restart audio. If the recording fails, device speech is used. Other lines still use device speech. Production build and all 15 tests passed, including recording replay, stop, mute, fallback, and stale rejection handling. Actual audible playback has not been verified in this update.

## Full lesson narration — 2026-09-28
Split the three supplied batch recordings into 27 PCM WAV clips (22.05 kHz mono), plus the existing opening MP3, for 28 recorded lines. All six intros/guides/completions and ten shared cues now map to recordings through narration.ts; captions match the supplied script. Specialized extra hints still use device speech. Enemy turns wait for the recorded announcement to end, and cancellation/mute resolves that wait.

Segmentation used local faster-whisper base.en word timing and quiet-window cuts; recordings were not uploaded to a transcription service. Each output was transcribed again to check boundaries. One shared-line boundary was corrected and rechecked. Minor ASR wording differences remain in the report; no claim of human listening review. Cut manifest and transcript check are in scripts/. Build and all 16 tests passed. Browser preview loaded and the level 4 completion screen displayed the updated script without console errors; a concurrent state change prevented a controlled timing walkthrough. Local server restarted at port 4175. Hosted site not updated.

## iPhone and iPad access
Touch navigation uses 44-pixel targets on phones/coarse pointers. Safe-area padding protects the header/footer from display cutouts and the Home indicator. The Site root opens /chapter/. Responsive views checked at 390×844 and 820×1180; this is not a physical iOS Safari test. Saves remain browser-local and do not transfer from desktop. The existing private Site audience is preserved.

## Knight Bridge
Six lessons unlock after Pawn Valley: pawn review, knight L move, jumping over friends, safe landings against a rook, a two-rook fork with a legal enemy escape, and a mixed pawn/knight rescue. All positions use chess movement and capture rules; these are puzzles without kings, not complete chess games. Chapter 2 uses device English speech pending recorded narration. Existing chapter 1 recordings and local Akin/Prin saves are preserved.

Validation: 22 automated tests cover routes, knight geometry, rook blocking, unsafe capture, fork response, undo, old saves and audio lifecycle.
