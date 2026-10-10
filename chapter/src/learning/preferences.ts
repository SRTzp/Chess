export type PlayerId='akin'|'prin';
export type ViewPreferences={symbols?:boolean;reducedMotion?:boolean};
export type Preferences={version:1;profiles:Partial<Record<PlayerId,ViewPreferences>>};
export function restorePreferences(raw:unknown):Preferences{
 const out:Preferences={version:1,profiles:{}};
 if(!raw||typeof raw!=='object'||(raw as Preferences).version!==1)return out;
 for(const id of ['akin','prin']as const){const value=(raw as Preferences).profiles?.[id];if(!value||typeof value!=='object')continue;const p:ViewPreferences={};for(const key of ['symbols','reducedMotion']as const)if(typeof value[key]==='boolean')p[key]=value[key];out.profiles[id]=p;}
 return out;
}
export function viewPreferences(data:Preferences,id:PlayerId,osReduced:boolean){const p=data.profiles[id];return{symbols:p?.symbols??false,reducedMotion:p?.reducedMotion??osReduced};}
export function changePreferences(data:Preferences,id:PlayerId,patch:ViewPreferences):Preferences{
 const next=restorePreferences(data),valid=restorePreferences({version:1,profiles:{[id]:patch}}).profiles[id];next.profiles[id]={...next.profiles[id],...valid};return next;
}
