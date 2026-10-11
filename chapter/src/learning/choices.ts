import {microConfig,type Journey} from './microsteps';
import {Chess,type InputMove} from '../engine/chess';
import {trialMet,type Trial} from './bank';

export type AdventurePlan={move:InputMove;icon:'↗';purpose:'mission'|'explore'};
const key=(m:InputMove)=>`${m.from}:${m.to}:${m.promotion??''}`;
// Authoring helper: fixed FEN + the existing mission predicate, never an engine score.
// Every displayed route is legal; purpose is validation metadata, never a UI answer label.
export function authorPlans(t:Trial):AdventurePlan[]{
 const c=new Chess(t.fen),moves=c.moves({verbose:true}).map(m=>({from:m.from,to:m.to,...(m.promotion?{promotion:m.promotion as InputMove['promotion']}:{})}));
 const good=moves.filter(m=>{const after=new Chess(t.fen);after.move(m);return trialMet(t,m,after);});
 if(!good.length)throw new Error('No mission route: '+t.id);
 const chosen=good.slice(0,3),sources=new Set(chosen.map(m=>m.from));
 for(const m of moves.filter(m=>sources.has(m.from)).sort((a,b)=>(Math.abs(Number(a.to[1])-Number(a.from[1]))+Math.abs(a.to.charCodeAt(0)-a.from.charCodeAt(0)))-(Math.abs(Number(b.to[1])-Number(b.from[1]))+Math.abs(b.to.charCodeAt(0)-b.from.charCodeAt(0)))))if(chosen.length<3&&!chosen.some(p=>p.to===m.to))chosen.push(m);
 // Stable square ordering prevents an answer-first convention.
 return chosen.sort((a,b)=>a.to.localeCompare(b.to)||a.from.localeCompare(b.from)).map(move=>({move,icon:'↗',purpose:good.some(m=>key(m)===key(move))?'mission':'explore'}));
}
export function validatePlans(t:Trial,plans:AdventurePlan[]){
 if(plans.length<1||plans.length>3||new Set(plans.map(p=>key(p.move))).size!==plans.length)return false;
 return plans.some(p=>p.purpose==='mission')&&plans.every(p=>{const c=new Chess(t.fen);try{if(!c.move(p.move))return false;}catch{return false;}return (p.purpose==='mission')===trialMet(t,p.move,c);});
}
export {PlanPreview,shouldGuide} from '../plan-preview';

export function limitPlans(plans:AdventurePlan[],limit:number){if(plans.length<=limit)return plans;const mission=plans.find(p=>p.purpose==='mission')!;return [mission,...plans.filter(p=>p!==mission).slice(0,Math.max(0,limit-1))].sort((a,b)=>a.move.to.localeCompare(b.move.to));}

export const plansForMission=(trial:Trial,journey?:Journey)=>journey?limitPlans(authorPlans(trial),microConfig.choicesPerStep[Math.min(journey.step,4)]):authorPlans(trial);
