import {Match,Chess,bestMove,type InputMove,type ChessSave} from '../engine/chess';import {miniStart} from './bank';
export class MiniGame{
 constructor(public kind:'passer'|'weak-pawn'='passer'){this.match=new Match(kind==='passer'?miniStart:'7k/8/8/8/2P1p3/2K5/8/8 w - - 0 1');}match:Match;get chess(){return this.match.chess;}get rounds(){return this.chess.history({verbose:true}).filter(m=>m.color==='w').length;}
 get outcome(){if(this.chess.isCheckmate())return this.chess.turn()==='b'?'won':'retry';if(this.rounds>=3&&(this.kind==='passer'?this.chess.history({verbose:true}).some(m=>m.color==='w'&&!!m.promotion):this.chess.board().flat().some(p=>p?.color==='w'&&p.type!=='k')&&this.chess.history({verbose:true}).some(m=>m.color==='w'&&m.captured==='p')))return'won';return this.chess.isGameOver()||this.rounds>=12?'review':'playing';}
 play(m:InputMove){if(this.chess.turn()!=='w'||this.outcome!=='playing')return null;this.match.beginRound();const played=this.match.move(m);if(!played)this.match.undoRound();return played;}
 reply(){if(this.chess.turn()!=='b'||this.chess.isGameOver())return null;const m=bestMove(this.chess,'gentle');return m?this.match.move(m):null;}
 undo(){return this.match.undoRound();}save(){return {version:1,kind:this.kind,match:this.match.save()};}
 static restore(raw:unknown){const v=raw as {version:number;kind:'passer'|'weak-pawn';match:ChessSave};if(v?.version!==1||!['passer','weak-pawn'].includes(v.kind))return null;const match=Match.restore(v.match);const game=new MiniGame(v.kind);if(!match||match.start!==game.match.start)return null;game.match=match;return game;}
}
