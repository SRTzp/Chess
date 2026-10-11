import type {ContextHistory} from './context-attempt';
import {Chess,type Square} from '../engine/chess';
import type {Trial} from './bank';
import type {Role,Skill} from './ledger';
// Six additional placements per friend: meaningful transfers and one added obstacle.
// White pawns always move toward increasing ranks; never rotate or reverse their rule.
const layouts:Record<Role,[Square,Square,Square?,Square?][]>= {
 p:[['d3','d4'],['b3','b4'],['e3','f4','f4'],['f3','g4','g4','f4'],['b2','b4'],['d2','d4'],['e4','f5','f5']],
 n:[['c2','d4'],['f2','e4'],['d3','e5','e5'],['e3','d5','d5','e4'],['c3','b5',undefined,'c4'],['f3','g5',undefined,'f4']],
 b:[['b1','e4'],['g1','d4'],['c2','f5','f5'],['f2','c5','c5','f3'],['d2','g5',undefined,'d3'],['e2','b5',undefined,'e3']],
 r:[['a2','a5'],['b2','e2'],['c3','c7','c7'],['d3','g3','g3','d4'],['e3','e6',undefined,'f3'],['f3','c3',undefined,'f4']],
 q:[['c1','f4'],['f1','c4'],['d2','d5','d5'],['e2','b5','b5','e3'],['c3','f3',undefined,'c4'],['f3','c6',undefined,'f4']],
 k:[['c3','d4'],['f3','e4'],['d3','e4','e4'],['e3','d4','d4','e4'],['c4','b5',undefined,'c5'],['f4','g5',undefined,'f5']],
};
export const microTrials:Trial[]=[];
for(const role of Object.keys(layouts) as Role[])layouts[role].forEach(([from,to,target,blocker],i)=>{
 const c=new Chess();c.clear();c.put({type:'k',color:'b'},'h8');c.put({type:'p',color:'b'},'h7');c.put({type:'k',color:'w'},role==='k'?from:'h1');if(role!=='k')c.put({type:role,color:'w'},from);if(target)c.put({type:'p',color:'b'},target);if(blocker)c.put({type:'p',color:'w'},blocker);
 const concept=role==='p'?((i===4||i===5)?'On the first move, two clear stones can make one big step.':target?'Walk straight; free a guard diagonally.':'One forward stone brings us closer.'):role==='n'?'One L jump; resting friends do not block the jump.':role==='k'?'One safe step toward the clearing.':'Follow your road; never jump a resting friend.';
 microTrials.push({id:`micro-${role}-${i}`,skill:role,fen:c.fen(),accepted:[{from,to}],instruction:concept,concept});
});
export const microConfig={firstChoices:2,practiceRecovery:4,independentChecks:2,contextRecoveryDelay:86400000,choicesPerStep:[3,3,2,2,2]};
export const stepNames=['Find the road','A new clearing','A guard on the road','Friends on the road','Your own adventure'];
export const stepName=(role:Skill,step:number)=>step===checkStep(role)?'Your own adventure':role==='p'&&step===4?'One big first step':stepNames[Math.min(step,3)];
export const checkStep=(role:Skill)=>['p','n','b','r','q','k'].includes(role)?role==='p'?5:4:1;
export function stepPool(role:Skill,step:number,ids:string[]=[]){if(!['p','n','b','r','q','k'].includes(role))return step===0?ids.slice(0,2):ids.slice(2,4);const pools=[
 [`use-${role}-0`,`micro-${role}-0`],
 [`micro-${role}-1`, ...(role==='p'?['use-p-0']:[`use-${role}-1`])],
 [`use-${role}-2`,`micro-${role}-2`],
 [`micro-${role}-3`,`micro-${role}-4`],
 [`use-${role}-3`,`micro-${role}-5`],
 ];if(role==='p')pools.splice(3,2,['micro-p-3','use-p-2'],['micro-p-4','use-p-3'],['micro-p-5','micro-p-6']);return pools[Math.min(step,pools.length-1)];}
export type Journey={step:number;first:string[];completed:string[];practices:number;check:boolean;checks?:string[];contexts?:Record<string,ContextHistory>};
export const freshJourney=():Journey=>({step:0,first:[],completed:[],practices:0,check:false,checks:[],contexts:{}});
export function restoreJourney(raw:unknown):Journey|null{const v=raw as Journey;if(!v||!Number.isInteger(v.step)||v.step<0||v.step>6||!Number.isInteger(v.practices)||v.practices<0||v.practices>1000||typeof v.check!=='boolean'||![v.first,v.completed].every(a=>Array.isArray(a)&&a.length<=20&&a.every(s=>typeof s==='string'&&s.length<100)))return null;if(v.checks&&(!Array.isArray(v.checks)||v.checks.length>20||v.checks.some(s=>typeof s!=='string'||s.length>100)))return null;const contexts:Record<string,ContextHistory>={};if(v.contexts&&typeof v.contexts==='object')for(const [id,h] of Object.entries(v.contexts).slice(0,40)){if(id.length<100&&h&&[h.firstBlockedUntil,h.unaidedBlockedUntil].every(t=>Number.isFinite(t)&&t>=0)&&Array.isArray(h.shown)&&h.shown.length<=12&&h.shown.every(s=>typeof s==='string'&&s.length<150))contexts[id]={...h,shown:[...h.shown]};}const checks=[...new Set(v.checks??[])];return {...v,contexts,checks,check:checks.length>=microConfig.independentChecks,first:[...new Set(v.first)],completed:[...new Set(v.completed)]};}
export function recordJourney(j:Journey,id:string,success:boolean,firstChoice:boolean,unaided:boolean,independentStep=4){
 if(!success)return false;if(!j.completed.includes(id))j.completed.push(id);j.practices=Math.min(1000,j.practices+1);if(firstChoice&&!j.first.includes(id))j.first.push(id);if(j.step===independentStep&&firstChoice&&unaided){j.checks??=[];if(!j.checks.includes(id))j.checks.push(id);j.check=j.checks.length>=microConfig.independentChecks;}
 j.check=(j.checks?.length??0)>=microConfig.independentChecks;return j.step<independentStep?j.first.length>=microConfig.firstChoices||j.completed.length>=2&&j.practices>=microConfig.practiceRecovery:j.check;
}
export function nextJourneyStep(j:Journey){j.step=Math.min(6,j.step+1);j.first=[];j.completed=[];j.practices=0;}

export const journeyReady=(j:Journey,independentStep:number)=>j.step===independentStep?(new Set(j.checks??[]).size>=microConfig.independentChecks):j.first.length>=microConfig.firstChoices||j.completed.length>=2&&j.practices>=microConfig.practiceRecovery;

export function nextContextId(j:Journey,pool:string[],independent:boolean,now=Date.now()){const pending=independent?pool.filter(id=>!j.checks?.includes(id)):pool;if(!pending.length)return pool[0];if(independent){const clean=pending.filter(id=>(j.contexts?.[id]?.firstBlockedUntil??0)<=now&&(j.contexts?.[id]?.unaidedBlockedUntil??0)<=now);const list=clean.length?clean:pending;return list[j.practices%list.length];}return pending.find(id=>!j.completed.includes(id))??pending[j.practices%pending.length];}
