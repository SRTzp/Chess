import {lessons,previousOrder} from './lessons';
import {Session,type SessionSave} from './session';
export type CampaignProgress={version:2;session:SessionSave|null;done:string[];legacyDone:string[];wins:number};
export const worlds=[{name:'Rook Grove',icon:'♖',end:3},{name:'Bishop Woods',icon:'♗',end:6},{name:'Light Citadel',icon:'♕',end:11},{name:'King’s Keep',icon:'♔',end:17},{name:'Magic Gates',icon:'✦',end:26},{name:'Guard Bridge',icon:'♘',end:38},{name:'Opening Castle',icon:'🏰',end:lessons.length}];
export const freshProgress=():CampaignProgress=>({version:2,session:null,done:[],legacyDone:[],wins:0});
export function restoreProgress(value:unknown,legacyValue?:unknown):CampaignProgress{
 const v=(value as CampaignProgress)?.version===2?value as CampaignProgress:legacyValue as CampaignProgress|undefined;
 if(!v||typeof v!=='object')return freshProgress();
 const known=new Set(lessons.map(l=>l.id)),raw=Array.isArray(v.done)?v.done.filter((x):x is string=>typeof x==='string'&&known.has(x)):[];
 const migrated=(v as CampaignProgress).version!==2,eligible=new Set(raw.filter(x=>!migrated||x!=='knight-fork'));
 // Prior v2 saves used the 37-quest order. Credit newly inserted lessons only when
 // that save had already passed their place, preserving its previously unlocked path.
 if(!migrated){for(let i=0;i<lessons.length;i++){const id=lessons[i].id;if(previousOrder.includes(id))continue;const next=lessons.slice(i+1).find(l=>previousOrder.includes(l.id));if(next&&eligible.has(next.id))eligible.add(id);else if(!next&&eligible.has(previousOrder.at(-1)!))eligible.add(id);}}
 const done:string[]=[];for(const lesson of lessons){if(!eligible.has(lesson.id))break;done.push(lesson.id);}
 const oldExtras=Array.isArray(v.legacyDone)?v.legacyDone.filter((x):x is string=>typeof x==='string'):[];
 const legacyDone=[...new Set([...oldExtras,...raw.filter(x=>!done.includes(x))])];
 return{version:2,session:Session.restore(v.session)?v.session:null,done,legacyDone,wins:Number.isInteger(v.wins)&&v.wins>=0?Math.min(v.wins,999):0};
}
export const villageComplete=(oldDone:boolean[])=>oldDone.length===12&&oldDone.every(Boolean);
export const canOpenLesson=(index:number,oldDone:boolean[],done:string[])=>villageComplete(oldDone)&&index>=0&&index<lessons.length&&(index===0||done.includes(lessons[index-1].id));
export const nextLesson=(done:string[])=>lessons.find(l=>!done.includes(l.id))??null;
export function earnedBadges(done:string[]){const badges:string[]=[];let begin=0;for(const world of worlds){if(lessons.slice(begin,world.end).every(l=>done.includes(l.id)))badges.push(world.icon+' '+world.name);begin=world.end;}return badges;}
