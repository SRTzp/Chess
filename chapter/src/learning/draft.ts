import {Match,Chess,input} from '../engine/chess';
import {MiniGame} from './mini';
import {trials,trialMet,type Trial} from './bank';
import {roles,type Skill} from './ledger';
export const phases=['discover','practice','independent','mini','review','game'] as const;
export type Phase=typeof phases[number];
export type Draft={version:1;role:Skill;phase:Phase;trialId:string;match:unknown;mini?:unknown;support:boolean;novel:boolean;done:boolean;index:number;shown?:string[]};
export function restoreDraft(raw:unknown){try{
 const v=raw as Draft;if(v?.version!==1||![...roles,'team','prevent','passer','fork','pin','discovery','activity','weakness'].includes(v.role)||!phases.includes(v.phase)||!Number.isInteger(v.index)||v.index<0||v.index>100||![v.support,v.novel,v.done].every(b=>typeof b==='boolean'))return null;
 const trial=trials.find(t=>t.id===v.trialId&&t.skill===v.role);if(!trial)return null;
 const match=Match.restore(v.match),mini=v.phase==='mini'?MiniGame.restore(v.mini):null;if(!match||v.phase==='mini'&&!mini||v.phase!=='mini'&&v.phase!=='game'&&match.start!==trial.fen||v.phase==='game'&&match.start!==new Match().start)return null;
 if(v.done){if(v.phase==='mini'&&mini?.outcome==='playing'||v.phase==='game'&&!match.chess.isGameOver())return null;if(v.phase!=='mini'&&v.phase!=='game'){const moves=match.chess.history({verbose:true}),lastWhite=moves.filter(m=>m.color==='w').at(-1);if(!lastWhite)return null;const after=new Chess(match.start);for(const move of moves){after.move(input(move));if(move===lastWhite)break;}if(!trialMet(trial,input(lastWhite),after)||match.chess.get(lastWhite.to)?.color!=='w')return null;}}
 return {...v,trial:trial as Trial,match,mini,shown:Array.isArray(v.shown)?v.shown.filter(s=>typeof s==='string').slice(0,12):[]};
 }catch{return null;}}
