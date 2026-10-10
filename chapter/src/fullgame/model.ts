import {Match,DEFAULT_POSITION,type ChessSave,type InputMove,type OpponentTier} from '../engine/chess';
export type GameSave={version:1;match:ChessSave;fen:string;tier:OpponentTier;updated:number};
export type Ticket={id:number;fen:string;save:ChessSave;tier:OpponentTier};
export class FullGame{
 match:Match;epoch=0;busy=false;
 constructor(public tier:OpponentTier='gentle',match=new Match()){this.match=match;}
 cancel(){this.epoch++;this.busy=false;}
 play(move:InputMove){if(this.busy||this.match.chess.turn()!=='w')return null;this.cancel();this.match.beginRound();const m=this.match.move(move);if(!m)this.match.undoRound();return m;}
 undo(){this.cancel();return this.match.undoRound();}
 request():Ticket|null{if(this.busy||this.match.chess.turn()!=='b'||this.match.chess.isGameOver())return null;this.busy=true;return{id:++this.epoch,fen:this.match.chess.fen(),save:this.match.save(),tier:this.tier};}
 accept(t:Ticket,move:InputMove|null){if(!this.busy||t.id!==this.epoch||t.fen!==this.match.chess.fen()||this.match.chess.turn()!=='b')return null;this.busy=false;return move?this.match.move(move):null;}
 save(now=Date.now()):GameSave{return{version:1,match:this.match.save(),fen:this.match.chess.fen(),tier:this.tier,updated:now};}
 static restore(raw:unknown){try{const v=raw as GameSave;if(v?.version!==1||!['gentle','steady','challenge'].includes(v.tier)||!Number.isFinite(v.updated)||v.updated<0)return null;const m=Match.restore(v.match);if(!m||m.start!==DEFAULT_POSITION||m.chess.fen()!==v.fen)return null;return new FullGame(v.tier,m);}catch{return null;}}
}
export type Games={version:1;profiles:Partial<Record<'akin'|'prin',{current:GameSave|null;previous:GameSave|null}>>};
export function restoreGames(raw:unknown):Games{const out:Games={version:1,profiles:{}};try{const v=raw as Games;if(v?.version!==1)return out;for(const id of ['akin','prin']as const){const p=v.profiles?.[id];if(p)out.profiles[id]={current:FullGame.restore(p.current)?.save(p.current!.updated)??null,previous:FullGame.restore(p.previous)?.save(p.previous!.updated)??null};}}catch{}return out;}
// A legacy full game is copied, not deleted or reinterpreted as lesson progress.
export function legacyGame(raw:unknown){try{const v=raw as {mode?:string;phase?:string;match?:unknown;tier?:OpponentTier};if(v?.mode!=='game'&&v?.phase!=='game')return null;const match=Match.restore(v.match);if(!match||match.start!==DEFAULT_POSITION)return null;return new FullGame(['gentle','steady','challenge'].includes(v.tier??'')?v.tier!:'gentle',match);}catch{return null;}}
