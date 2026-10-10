import type {Lesson} from './lessons';
// Celebrate a verified learning objective, never a capture count.
export function lessonAchievement(lesson:Lesson):string{
 const named:Record<string,string>={
  'rook-road':'Road guarded! Your rook followed one straight line.',
  'opening-center':'Center held! Your pawn gives the team room.',
  'opening-develop':'Friend ready! Your knight helps the center.',
  'opening-mini-center':'Team ready! You developed instead of taking a guarded pawn.',
  'opening-shelter':'King sheltered! Castling was safe here.',
  'opening-mini-shelter':'Team and king ready! You made room, then castled safely.',
  'king-capture-check':'King rescued! That capture stopped the check.',
  'king-block-check':'King rescued! Your bishop blocked the checking line.',
  'king-safe':'Safe step! Your king stayed away from the attack.',
  'guard-reply':'Pressure kept! Your rook holds the guard in place.',
 };
 if(named[lesson.id])return named[lesson.id];
 const messages:Record<Lesson['goal']['kind'],string>={
  move:'Path found! Your piece reached its goal.',capture:'Capture goal reached! You found the right piece and landing square.',
  defend:'Friend protected! Your pieces support each other.',check:'Check found! The other king must answer.',
  'escape-check':'King rescued! You answered the check.',fork:'Two threats found! Your piece helps the plan.',
  pin:'Pressure kept! The guard must stay near its king.',discovery:'Line opened! Your pieces work together.',
  mate:'Checkmate! Your team closed every safe escape.',castle:'King sheltered! Castling was safe in this position.',
  promotion:'Pawn promoted! You chose its new chess moves.', 'en-passant':'Passing capture learned! You used its one-turn chance.',
 };
 return lesson.setupGoal?.kind==='fork'?'Plan completed! Two threats helped you make a useful capture.':messages[lesson.goal.kind];
}
export const captureReflection='Capture played. Look at your king and the whole board.';
