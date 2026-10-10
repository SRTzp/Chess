import {actor} from './learning/actors';
export type GroveTier='apprentice'|'guardian'|'master';
// Generated assets are independent of chess geometry; lab.ts owns the legal hit targets.
export function groveActor(piece:string,enemy:boolean,tier:GroveTier='apprentice'){
 return `<span class="grove-actor ${enemy?'grove-enemy':'grove-friend'} grove-role-${piece==='r'?'rook':'king'}" aria-hidden="true">${piece==='r'?actor('r',enemy,tier):'<span class="grove-raster grove-king"></span>'}<span class="grove-piece-mark">${piece==='r'?'♜':'♚'}</span></span>`;
}
export function groveScenery(){return '<div class="grove-canopy" aria-hidden="true"></div>';}
// Only a chess.js-validated move reaches this function. Include every visited square,
// never an L-shaped shortcut or intermediate diagonal.
export function rookTravelSquares(from:string,to:string):string[]{
 if(!/^[a-h][1-8]$/.test(from)||!/^[a-h][1-8]$/.test(to)||from===to)return[];
 const x=from.charCodeAt(0),y=Number(from[1]),tx=to.charCodeAt(0),ty=Number(to[1]);
 if(x!==tx&&y!==ty)return[];
 const dx=Math.sign(tx-x),dy=Math.sign(ty-y),count=Math.max(Math.abs(tx-x),Math.abs(ty-y));
 return Array.from({length:count+1},(_,i)=>String.fromCharCode(x+dx*i)+(y+dy*i));
}
// State is committed immediately. This class owns only cancellable cosmetic effects.
export class GroveMotion{
 private animations=new Set<Animation>();private effects=new Set<HTMLElement>();private timers=new Set<ReturnType<typeof setTimeout>>();private resolveFlight:(finished:boolean)=>void=()=>{};
 constructor(private board:HTMLElement){}
 cancel(){this.resolveFlight(false);this.resolveFlight=()=>{};for(const a of this.animations)a.cancel();this.animations.clear();for(const t of this.timers)clearTimeout(t);this.timers.clear();for(const el of this.effects)el.remove();this.effects.clear();}
 move(origin:DOMRect,destination:HTMLElement,capturedActor:string|undefined,reduced:boolean,squares:string[]=[],tier:GroveTier='apprentice'):Promise<boolean>{
  this.cancel();const end=destination.getBoundingClientRect(),actor=destination.querySelector<HTMLElement>('.grove-actor');if(!actor)return Promise.resolve(true);
  const dx=origin.left+origin.width/2-end.left-end.width/2,dy=origin.top+origin.height/2-end.top-end.height/2;
  const steps=Math.max(1,squares.length-1),duration=Math.min(1200,Math.max(380,steps*160));
  const trailLife=tier==='apprentice'?260:tier==='guardian'?460:520,trailPeak=tier==='apprentice'?.55:tier==='guardian'?.8:.88;
  for(const [i,square] of squares.entries()){
   const cell=this.board.querySelector<HTMLElement>(`[data-square="${square}"]`);if(!cell)continue;
   const fire=this.effect(cell,`grove-fire${reduced?' grove-fire-quiet':''}`,'<i></i><i></i><i></i><b>✦</b>');
   if(reduced){this.removeAfter(fire,600);continue;}
   this.track(fire.animate([{opacity:0,transform:'scale(.65)'},{opacity:trailPeak,transform:'scale(1)',offset:.3},{opacity:0,transform:'scale(.88)'}],{delay:i/steps*duration,duration:trailLife,easing:'ease-out'}),()=>this.remove(fire));
  }
  if(tier!=='apprentice'){
  const landing=this.effect(destination,`grove-landing${reduced?' grove-landing-quiet':''}`,'');
  if(reduced)this.removeAfter(landing,600);else this.track(landing.animate([{opacity:0,transform:'scale(.8)'},{opacity:.8,transform:'scale(1)',offset:.35},{opacity:0,transform:'scale(1.08)'}],{delay:duration,duration:340}),()=>this.remove(landing));
  }
  if(capturedActor){
   const burst=this.effect(destination,`grove-burst${reduced?' grove-burst-quiet':''}`,tier==='master'?'<i></i><b>✧</b><i></i><em>◇</em>':'<i></i><b>✦</b><i></i>');
   if(reduced)this.removeAfter(burst,600);else{
    const ghost=this.effect(destination,'grove-captured',capturedActor);
    this.track(ghost.animate([{opacity:1,offset:0},{opacity:1,offset:duration/(duration+240)},{opacity:0,transform:'translateY(-6px) scale(.9)',offset:1}],{duration:duration+240}),()=>this.remove(ghost));
    this.track(burst.animate([{opacity:0,transform:'scale(.6)'},{opacity:.85,transform:'scale(1)'},{opacity:0,transform:'scale(1.12)'}],{delay:duration,duration:380}),()=>this.remove(burst));
   }
  }
  if(reduced)return Promise.resolve(true);
  if(tier==='master'){
   const echo=this.effect(destination,'grove-afterimage',actor.outerHTML);
   this.track(echo.animate([{opacity:.25,transform:`translate(${dx}px,${dy}px)`},{opacity:.12,transform:`translate(${dx*.08}px,${dy*.08}px)`,offset:.9},{opacity:0,transform:'translate(0,0)'}],{duration,easing:'linear'}),()=>this.remove(echo));
  }
  const raster=actor.querySelector<HTMLElement>('.grove-raster');if(raster)this.track(raster.animate([{filter:'brightness(1)'},{filter:`brightness(${tier==='master'?1.3:tier==='guardian'?1.2:1.1})`,offset:.25},{filter:'brightness(1)'}],{duration}));
  return new Promise(resolve=>{this.resolveFlight=resolve;this.track(actor.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'translate(0,0)'}],{duration,easing:'linear'}),()=>{this.resolveFlight=()=>{};resolve(true);});});
 }
 private effect(parent:HTMLElement,cls:string,html:string){const el=document.createElement('span');el.className=cls;el.setAttribute('aria-hidden','true');el.innerHTML=html;parent.append(el);this.effects.add(el);return el;}
 private remove(el:HTMLElement){el.remove();this.effects.delete(el);}
 private removeAfter(el:HTMLElement,ms:number){const timer=setTimeout(()=>{this.timers.delete(timer);this.remove(el);},ms);this.timers.add(timer);}
 private track(animation:Animation,finish?:()=>void){this.animations.add(animation);void animation.finished.then(()=>{this.animations.delete(animation);finish?.();}).catch(()=>{});}
}
