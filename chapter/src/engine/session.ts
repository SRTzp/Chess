import {Chess,Match,DEFAULT_POSITION,bestMove,discoveries,forkTargets,pins,status,input,type ChessSave,type InputMove,type OpponentTier,type Move} from './chess';
import {lessons,type Goal,type Lesson} from './lessons';
export type SessionSave={version:1;mode:'lesson'|'game';lessonId?:string;tier:OpponentTier;match:ChessSave;hintLevel:number;finished:boolean};
const same=(a:InputMove,b:InputMove)=>a.from===b.from&&a.to===b.to&&(!b.promotion||a.promotion===b.promotion);
export class Session{
 match:Match;readonly lesson?:Lesson;readonly mode:'lesson'|'game';readonly tier:OpponentTier;hintLevel=0;finished=false;private setupSatisfied=false;
 constructor(lesson?:Lesson,tier:OpponentTier='gentle'){this.lesson=lesson;this.mode=lesson?'lesson':'game';this.tier=tier;this.match=new Match(lesson?.fen??DEFAULT_POSITION);this.hintLevel=lesson?.hintTier??0;}
 get chess(){return this.match.chess;}
 get turn(){return this.chess.turn();}
 get end(){return status(this.chess);}
 get onFinalStep(){return !!this.lesson?.setupGoal&&this.setupSatisfied&&this.turn==='w'&&this.chess.history().length===2&&!this.finished;}
 get teachingMove():InputMove|null{if(!this.lesson||this.turn!=='w'||this.finished)return null;const ply=this.chess.history().length;if(this.lesson.setupGoal){if(ply===0){const wanted=this.lesson.setup;if(!wanted)return null;return this.chess.moves({verbose:true}).some(m=>same(input(m),wanted))?wanted:null;}if(!this.setupSatisfied||ply!==2)return null;}const goal=this.lesson.goal;const candidates=this.chess.moves({verbose:true});const winner=candidates.find(move=>{const after=new Chess(this.chess.fen());after.move(input(move));return this.goalMet(this.chess,after,move,goal);});return winner?input(winner):null;}
 get hint(){if(!this.lesson||this.hintLevel===0)return '';if(this.chess.history().length===0)return this.lesson.hint[Math.min(this.hintLevel-1,2)]??'';
  if(this.turn==='b')return 'Wait for the guard to move.';
  if(this.lesson.setupGoal&&!this.setupSatisfied)return 'That move missed the first part of the plan. Try Undo or Try again.';
  if(this.lesson.setupGoal&&this.chess.history().length>2)return 'The two-move plan has changed. Try Undo or Try again.';
  const suggested=this.teachingMove,candidate=suggested?this.chess.moves({verbose:true}).find(m=>same(input(m),suggested)):undefined;
  if(!candidate)return 'The lesson path has changed. Try Undo or Try again for a fresh plan.';
  if(this.hintLevel<2)return 'Look for a move that completes this quest from the current board.';
  if(this.hintLevel<3)return `Look at the ${{p:'pawn',n:'knight',b:'bishop',r:'rook',q:'guardian',k:'king'}[candidate.piece]} on ${candidate.from}.`;
  return `Move ${candidate.from} to ${candidate.to}${candidate.promotion?' and choose a new piece':''}.`;
 }
 askHint(){this.hintLevel=Math.min(3,this.hintLevel+1);return this.hint;}
 play(m:InputMove):Move|null{if(this.finished||this.turn!=='w')return null;this.match.beginRound();const ply=this.chess.history().length;const before=new Chess(this.chess.fen());const move=this.match.move(m);if(!move){this.match.undoRound();return null;}if(this.lesson){if(this.lesson.setupGoal&&ply===0)this.setupSatisfied=this.goalMet(before,this.chess,move,this.lesson.setupGoal);else if((!this.lesson.setupGoal||ply===2&&this.setupSatisfied)&&this.goalMet(before,this.chess,move,this.lesson.goal))this.finished=true;}return move;}
 private goalMet(before:Chess,after:Chess,move:Move,g:Goal):boolean{
  switch(g.kind){
   case 'move':return (g.square?move.to===g.square:!!g.move&&same(input(move),g.move))&&(!g.piece||move.piece===g.piece);
   case 'capture':return !!move.captured&&(!g.square||move.to===g.square)&&(!g.piece||move.piece===g.piece);
   case 'defend':return !!g.square&&after.get(g.square as typeof move.to)?.color===move.color&&after.attackers(g.square as typeof move.to,move.color).includes(move.to);
   case 'check':return after.isCheck();
   case 'escape-check':return before.isCheck()&&move.color==='w';
   case 'castle':return move.flags.includes('k')||move.flags.includes('q');
   case 'promotion':return !!move.promotion&&move.to===g.square;
   case 'en-passant':return move.flags.includes('e');
   case 'fork':return g.targets?.every(t=>forkTargets(after,move.to).includes(t as typeof move.to))??false;
   case 'pin':return pins(after,move.color).some(p=>p.target===g.square&&p.attacker===move.to)&&!pins(before,move.color).some(p=>p.target===g.square);
   case 'discovery':return discoveries(before,after,move).some(d=>d.target===g.square);
   case 'mate':return after.isCheckmate();
  }
 }
 reply(m?:InputMove):Move|null{if(this.finished||this.turn!=='b'||this.chess.isGameOver())return null;const scripted=m??this.lesson?.reply;if(scripted){const move=this.match.move(scripted);if(move)return move;}const chosen=bestMove(this.chess,this.tier);return chosen?this.match.move(chosen):null;}
 undo(){const ok=this.match.undoRound();if(ok){this.finished=false;if(this.chess.history().length===0)this.setupSatisfied=false;}return ok;}
 save():SessionSave{return{version:1,mode:this.mode,lessonId:this.lesson?.id,tier:this.tier,match:this.match.save(),hintLevel:this.hintLevel,finished:this.finished};}
 static restore(value:unknown):Session|null{try{const s=value as SessionSave;if(s?.version!==1||!['lesson','game'].includes(s.mode)||!['gentle','steady','challenge'].includes(s.tier)||!Number.isInteger(s.hintLevel)||s.hintLevel<0||s.hintLevel>3||typeof s.finished!=='boolean')return null;const lesson=s.mode==='lesson'?lessons.find(x=>x.id===s.lessonId):undefined;if(s.mode==='lesson'&&!lesson)return null;const match=Match.restore(s.match);if(!match||match.start!==(lesson?.fen??DEFAULT_POSITION))return null;const session=new Session(lesson,s.tier);for(const move of s.match.moves){const played=session.turn==='w'?session.play(move):session.reply(move);if(!played||!same(input(played),move))return null;}if(session.chess.fen()!==match.chess.fen()||session.finished!==s.finished)return null;session.hintLevel=s.hintLevel;return session;}catch{return null;}}
}
