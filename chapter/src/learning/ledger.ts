import {Chess} from '../engine/chess';
export const roles=['p','n','b','r','q','k'] as const;export type Role=typeof roles[number];
export type Tier='apprentice'|'guardian'|'master';export type Skill=Role|'fork'|'pin'|'discovery'|'team'|'prevent'|'passer'|'activity'|'weakness';
export type Evidence={practice:string[];novel:string[];owned:Tier;reviewAt:number;reviewed:number;shown?:string[];attempts?:{variant:string;shown:string[];kind:'practice'|'independent'|'review';at:number}[]};
export type Journal={version:1;profiles:Record<string,{seen:string[];skills:Partial<Record<Skill,Evidence>>}>};
export const criteria={practice:1,novel:2,tacticalNovel:1,reviewDelay:86400000};
export const fingerprint=(fen:string)=>new Chess(fen).fen().split(' ').slice(0,4).join(' ');
export const freshJournal=():Journal=>({version:1,profiles:{}});
export function restoreJournal(raw:unknown):Journal{try{const j=raw as Journal;if(j.version!==1||!j.profiles||typeof j.profiles!=='object')return freshJournal();const out=freshJournal();for(const id of ['akin','prin']){const p=j.profiles[id];if(!p)continue;if(!Array.isArray(p.seen)||p.seen.length>600||p.seen.some(v=>typeof v!=='string'||v.length>150))throw Error();const skills:Partial<Record<Skill,Evidence>>={};for(const key of [...roles,'fork','pin','discovery','team','prevent','passer','activity','weakness'] as Skill[]){const e=p.skills?.[key];if(!e)continue;if(!['apprentice','guardian','master'].includes(e.owned)||![e.practice,e.novel].every(a=>Array.isArray(a)&&a.length<=100&&a.every(v=>typeof v==='string'&&v.length<=150))||!Number.isFinite(e.reviewAt)||!Number.isInteger(e.reviewed)||e.reviewed<0)throw Error();if(e.shown&&(!Array.isArray(e.shown)||e.shown.length>12||e.shown.some(s=>typeof s!=='string'||s.length>150)))throw Error();if(e.attempts&&(!Array.isArray(e.attempts)||e.attempts.length>100||e.attempts.some(a=>!a||typeof a.variant!=='string'||a.variant.length>150||!['practice','independent','review'].includes(a.kind)||!Number.isFinite(a.at)||!Array.isArray(a.shown)||a.shown.length>12||a.shown.some(s=>typeof s!=='string'||s.length>150))))throw Error();skills[key]={owned:e.owned,reviewAt:e.reviewAt,reviewed:e.reviewed,practice:[...new Set(e.practice)],novel:[...new Set(e.novel)],shown:[...(e.shown??[])],attempts:(e.attempts??[]).map(a=>({...a,shown:[...a.shown]}))};}out.profiles[id]={seen:[...new Set(p.seen)],skills};}return out;}catch{return freshJournal();}}
export class Ledger{
 constructor(public data:Journal=freshJournal()){}
 profile(id:string){return this.data.profiles[id]??(this.data.profiles[id]={seen:[],skills:{}});}
 evidence(id:string,skill:Skill){return this.profile(id).skills[skill]??(this.profile(id).skills[skill]={practice:[],novel:[],owned:'apprentice',reviewAt:0,reviewed:0});}
 expose(id:string,fen:string){const p=this.profile(id),f=fingerprint(fen),novel=p.seen.length<600&&!p.seen.includes(f);if(novel)p.seen.push(f);if(p.seen.length>600)p.seen.splice(600);return novel;}
 credit(id:string,skill:Skill,variant:string,novel:boolean,support:boolean,success:boolean,review=false,now=Date.now()){
  const e=this.evidence(id,skill);if(!success)return e;const kind=review?'review':novel&&!support?'independent':'practice';e.attempts??=[];if(!e.attempts.some(a=>a.variant===variant&&a.kind===kind)){e.attempts.push({variant,shown:[...(e.shown??[])],kind,at:now});if(e.attempts.length>100)e.attempts.shift();}if(!e.practice.includes(variant)&&e.practice.length<100)e.practice.push(variant);
  if(novel&&!support&&!review&&!e.novel.includes(variant)&&e.novel.length<100)e.novel.push(variant);
  if(review){e.reviewed++;}e.reviewAt=now+criteria.reviewDelay;
  const target=e.novel.length>=(roles.includes(skill as Role)?criteria.novel:criteria.tacticalNovel)?'master':e.practice.length>=criteria.practice?'guardian':'apprentice';
  if(['apprentice','guardian','master'].indexOf(target)>['apprentice','guardian','master'].indexOf(e.owned))e.owned=target as Tier;return e;
 }
 recordSupport(id:string,skill:Skill,shown:string[]){this.evidence(id,skill).shown=[...new Set(shown)].slice(0,12);}
 preserve(id:string,role:Role,tier:Tier){const e=this.evidence(id,role);if(['apprentice','guardian','master'].indexOf(tier)>['apprentice','guardian','master'].indexOf(e.owned))e.owned=tier;}
}
