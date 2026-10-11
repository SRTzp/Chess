import {microConfig,recordJourney,type Journey} from './microsteps';

export type ContextHistory={firstBlockedUntil:number;unaidedBlockedUntil:number;shown:string[]};
export type AttemptState={version:1;id:string;startedAt:number;firstCommit:boolean;committedFirst:boolean;support:boolean;shown:string[];credited:boolean};
const history=(j:Journey,id:string)=>{j.contexts??={};return j.contexts[id]??(j.contexts[id]={firstBlockedUntil:0,unaidedBlockedUntil:0,shown:[]});};
export function beginAttempt(j:Journey,id:string,now=Date.now()):AttemptState{
 const h=history(j,id),support=h.unaidedBlockedUntil>now;
 return {version:1,id,startedAt:now,firstCommit:h.firstBlockedUntil<=now,committedFirst:false,support,shown:support?[...h.shown]:[],credited:false};
}
// The guided choice scaffold can support first-choice practice, but never unaided checks.
// Help, Watch, wrong attempts and Undo retain context eligibility across immediate restarts.
export function assistAttempt(j:Journey,a:AttemptState,mode:string,now=Date.now()){
 const h=history(j,a.id),until=now+microConfig.contextRecoveryDelay;
 h.unaidedBlockedUntil=Math.max(h.unaidedBlockedUntil,until);
 if(mode!=='adventure choices'){h.firstBlockedUntil=Math.max(h.firstBlockedUntil,until);a.firstCommit=false;a.committedFirst=false;}
 if(!h.shown.includes(mode))h.shown.push(mode);if(!a.shown.includes(mode))a.shown.push(mode);a.support=true;
}
export function commitAttempt(a:AttemptState){a.committedFirst=a.firstCommit;a.firstCommit=false;}
export function completeAttempt(j:Journey,a:AttemptState,success:boolean,independentStep:number){
 if(!success||a.credited)return false;a.credited=true;
 return recordJourney(j,a.id,true,a.committedFirst&&!a.shown.some(s=>s!=='adventure choices'),!a.support,independentStep);
}
export function restoreAttempt(raw:unknown,j:Journey,id:string,moves:number,done:boolean,legacy:{support:boolean;shown:string[];firstCommit?:boolean},now=Date.now()):AttemptState{
 const r=raw as AttemptState,h=history(j,id);
 const valid=r?.version===1&&r.id===id&&Number.isFinite(r.startedAt)&&r.startedAt>=0&&r.startedAt<=now&&[r.firstCommit,r.committedFirst,r.support,r.credited].every(v=>typeof v==='boolean')&&Array.isArray(r.shown)&&r.shown.length<=12&&r.shown.every(s=>typeof s==='string'&&s.length<150);
 if(!valid){const a=beginAttempt(j,id,now);if(legacy.support||legacy.shown.length||legacy.firstCommit===false||raw!==undefined){for(const mode of legacy.shown.length?legacy.shown:['prior attempt'])assistAttempt(j,a,mode,now);}a.support||=legacy.support;a.shown=[...new Set([...a.shown,...legacy.shown])].slice(0,12);a.firstCommit&&=moves===0&&legacy.firstCommit!==false&&!a.shown.some(s=>s!=='adventure choices');a.committedFirst=false;a.credited=done;return a;}
 // Compare with the start of this saved attempt, not the time of resuming it: waiting
 // with a revealed answer open does not turn that attempt into an unaided one.
 const blocked=h.unaidedBlockedUntil>r.startedAt,shown=[...new Set([...r.shown,...(blocked?h.shown:[])])].slice(0,12);
 return {...r,shown,support:r.support||legacy.support||blocked,firstCommit:r.firstCommit&&moves===0&&h.firstBlockedUntil<=r.startedAt,committedFirst:r.committedFirst&&!r.firstCommit&&moves>0&&h.firstBlockedUntil<=r.startedAt,credited:r.credited||done};
}
