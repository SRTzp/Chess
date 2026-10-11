// Transient preview intent; it never owns or mutates chess state and is never persisted.
export class PlanPreview<T>{
 private pending:{key:string;value:T}|null=null;
 get value(){return this.pending?.value??null;}
 get target(){return this.pending?.key??null;}
 choose(target:string,value:T):'preview'|'confirm'{if(this.pending?.key===target)return 'confirm';this.pending={key:target,value};return 'preview';}
 cancel(){this.pending=null;}
}
export const shouldGuide=(phase:string,fade:boolean,practiceCount:number)=>phase==='discover'||phase==='practice'&&(!fade||practiceCount<2);
