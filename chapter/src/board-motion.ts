import {moveActors,poseFrame,travelPose} from './piece-motion';
import {attackBeat,attackTiming,captureSquare,weaponPaths} from './attack-motion';
import type {Move,Square} from './engine/chess';
import './board-motion.css';
type Shot={rect:DOMRect;sprite:HTMLElement};
type Flight={to:Square;capture:boolean;displayRole:Move['piece'];role:string;side:string;ghost:HTMLElement;parts:HTMLElement[];raf:number;finish:()=>void;promise:Promise<void>};
const roleNames={Pawn:'p',Knight:'n',Rook:'r',Bishop:'b',Queen:'q',King:'k'};
const center=(r:DOMRect)=>({x:r.x+r.width/2,y:r.y+r.height/2});
/** Disposable visual snapshots. Neither completion nor cancellation submits a chess move. */
export class BoardMotion{
 private flights=new Set<Flight>();
 constructor(private board:HTMLElement,private changed=()=>{}){}
 get active(){return this.flights.size>0;}
 get action(){const f=[...this.flights][0];return f?{role:f.displayRole,side:f.side,capture:f.capture}:null;}
 async settled(){await Promise.all([...this.flights].map(f=>f.promise));}
 snapshot(){
  const shots=new Map<string,Shot>();
  for(const cell of Array.from(this.board.querySelectorAll<HTMLElement>('[data-square]'))){
   let original=cell.querySelector<HTMLElement>('.journey-sprite,.full-symbol'),sprite=original?.cloneNode(true)as HTMLElement|undefined;
   if(!sprite&&cell.classList.contains('chess-symbols')){sprite=document.createElement('span');sprite.className='piece-symbol';sprite.textContent=cell.childNodes[0]?.textContent??'';}
   if(!sprite)continue;
   const label=cell.getAttribute('aria-label')??'',name=label.split(' ').at(-1)!;
   sprite.dataset.role??=roleNames[name as keyof typeof roleNames]??name;
   sprite.dataset.side??=label.includes('Black')?'enemy':'friend';
   shots.set(cell.dataset.square!,{rect:cell.getBoundingClientRect(),sprite});
  }
  return shots;
 }
 refresh(){
  for(const sprite of Array.from(this.board.querySelectorAll<HTMLElement>('.journey-sprite,.full-symbol')))sprite.style.visibility='';
  for(const f of this.flights){const cell=this.board.querySelector<HTMLElement>(`[data-square="${f.to}"]`),sprite=cell?.querySelector<HTMLElement>('.journey-sprite,.full-symbol');if(sprite&&(sprite.dataset.role===f.role||!sprite.dataset.role)&&((sprite.dataset.side??(cell!.getAttribute('aria-label')?.includes('Black')?'enemy':'friend'))===f.side))sprite.style.visibility='hidden';}
 }
 play(m:Move,shots:Map<string,Shot>,reduced:boolean){
  const still=reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(still&&!m.captured)return Promise.resolve();
  return Promise.all(moveActors(m).map((part,i)=>{
   const shot=shots.get(part.from),cell=this.board.querySelector<HTMLElement>(`[data-square="${part.to}"]`);if(!shot||!cell)return Promise.resolve();
   const to=cell.getBoundingClientRect(),sprite=shot.sprite,ghost=this.clone(shot,'piece-flight'),victim=i===0&&m.captured?shots.get(captureSquare(m)):undefined;
   const target=victim?this.clone(victim,'piece-victim'):null,fx=victim?this.effect(part.piece,sprite.dataset.side!):null,parts=[ghost,...target?[target]:[],...fx?[fx]:[]];
   const a=center(shot.rect),b=center(to),v=victim?center(victim.rect):b,dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
   let finish!:()=>void;const promise=new Promise<void>(resolve=>finish=resolve);
   const f:Flight={to:part.to,capture:i===0&&!!m.captured,displayRole:part.piece,role:i===0?m.promotion??part.piece:part.piece,side:sprite.dataset.side!,ghost,parts,raf:0,promise,finish:()=>{cancelAnimationFrame(f.raf);for(const p of parts)p.remove();this.flights.delete(f);this.refresh();finish();this.changed();}};
   this.flights.add(f);this.refresh();this.changed();const start=performance.now(),capture=i===0&&!!m.captured,duration=capture?(still?360:attackTiming.duration):400;
   const frame=(now:number)=>{
    const ms=Math.min(duration,now-start),beat=capture?attackBeat(part.piece,ms,still):null,p=beat??travelPose(part.piece,ms/duration),inset=beat?(1-beat.settle)*.45*to.width*p.progress:0;
    const x=dx*p.progress-ux*inset,y=dy*p.progress-uy*inset-shot.rect.height*p.lift;
    ghost.style.transform=`translate(${x}px,${y}px)`;ghost.dataset.phase=beat?.phase??'move';ghost.dataset.role=part.piece;
    sprite.style.backgroundPosition=`${(beat?.pose??poseFrame('move',ms/duration))/3*100}% ${sprite.style.getPropertyValue('--tier-y')}`;
    sprite.style.transform=dx<0?'scaleX(-1)':'';
    if(target&&beat){target.style.opacity=String(beat.victim);target.style.transform=`translate(${ux*to.width*.12}px,${uy*to.width*.12}px)`;target.dataset.captureSquare=captureSquare(m);}
    if(fx&&beat){fx.style.opacity=String(beat.effect);const ax=a.x+x,ay=a.y+y,tx=v.x+ux*to.width*.12,ty=v.y+uy*to.width*.12,length=Math.max(to.width*.58,Math.hypot(tx-ax,ty-ay)),size=Math.max(to.width*1.4,length*1.55),angle=Math.atan2(ty-ay,tx-ax)*180/Math.PI;fx.style.cssText=`left:${(ax+tx)/2-size/2}px;top:${(ay+ty)/2-size/2}px;width:${size}px;height:${size}px;opacity:${beat.effect};transform:rotate(${angle}deg)`;fx.dataset.phase=beat.phase;}
    if(ms<duration)f.raf=requestAnimationFrame(frame);else f.finish();
   };frame(start);f.raf=requestAnimationFrame(frame);
   return promise;
  })).then(()=>{});
 }
 private clone(shot:Shot,className:string){const g=document.createElement('div');g.className=className;g.setAttribute('aria-hidden','true');g.style.cssText=`left:${shot.rect.x}px;top:${shot.rect.y}px;width:${shot.rect.width}px;height:${shot.rect.height}px`;shot.sprite.style.visibility='';shot.sprite.classList.add('piece-pose');g.append(shot.sprite);document.body.append(g);return g;}
 private effect(role:Move['piece'],side:string){const g=document.createElement('div');g.className='piece-hit '+(side==='enemy'?'enemy':'friend');g.setAttribute('aria-hidden','true');g.innerHTML=`<svg viewBox="0 0 100 100"><path class="hit-backing" d="${weaponPaths[role]}"/><path class="hit-weapon" d="${weaponPaths[role]}"/><path class="hit-contact" d="M70 36V42M70 58V64M76 50H82M76 42L81 37M76 58L81 63"/></svg>`;document.body.append(g);return g;}
 cancel(){for(const f of [...this.flights])f.finish();this.refresh();}
}
