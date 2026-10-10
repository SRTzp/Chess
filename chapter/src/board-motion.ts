import {moveActors,poseFrame,travelPose} from './piece-motion';
import type {Move,Square} from './engine/chess';
import './board-motion.css';
type Shot={rect:DOMRect;sprite:HTMLElement};
type Flight={to:Square;role:string;side:string;ghost:HTMLElement;sprite:HTMLElement;raf:number;finish:()=>void};
/** Disposable visual snapshots. Neither completion nor cancellation submits a chess move. */
export class BoardMotion{
 private flights=new Set<Flight>();
 constructor(private board:HTMLElement){}
 snapshot(){const shots=new Map<string,Shot>();for(const cell of Array.from(this.board.querySelectorAll<HTMLElement>('[data-square]'))){const sprite=cell.querySelector<HTMLElement>('.journey-sprite');if(sprite)shots.set(cell.dataset.square!,{rect:cell.getBoundingClientRect(),sprite:sprite.cloneNode(true)as HTMLElement});}return shots;}
 refresh(){for(const sprite of Array.from(this.board.querySelectorAll<HTMLElement>('.journey-sprite')))sprite.style.visibility='';for(const f of this.flights){const sprite=this.board.querySelector<HTMLElement>(`[data-square="${f.to}"] .journey-sprite`);if(sprite?.dataset.role===f.role&&sprite.dataset.side===f.side)sprite.style.visibility='hidden';}}
 play(m:Move,shots:Map<string,Shot>,reduced:boolean){
  if(reduced||matchMedia('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();
  return Promise.all(moveActors(m).map((part,i)=>{
   const shot=shots.get(part.from),cell=this.board.querySelector<HTMLElement>(`[data-square="${part.to}"]`);if(!shot||!cell)return Promise.resolve();
   const to=cell.getBoundingClientRect(),ghost=document.createElement('div'),sprite=shot.sprite;
   ghost.className='piece-flight';ghost.setAttribute('aria-hidden','true');ghost.style.cssText=`left:${shot.rect.x}px;top:${shot.rect.y}px;width:${shot.rect.width}px;height:${shot.rect.height}px`;sprite.style.visibility='';sprite.classList.add('piece-pose');ghost.append(sprite);document.body.append(ghost);
   return new Promise<void>(resolve=>{
    const f:Flight={to:part.to,role:part.piece,side:sprite.dataset.side!,ghost,sprite,raf:0,finish:()=>{cancelAnimationFrame(f.raf);ghost.remove();this.flights.delete(f);this.refresh();resolve();}};
    this.flights.add(f);this.refresh();const start=performance.now(),state=i===0&&m.captured?'capture':'move';
    const frame=(now:number)=>{const t=Math.min(1,(now-start)/400),p=travelPose(part.piece,t);ghost.style.transform=`translate(${(to.x-shot.rect.x)*p.progress}px,${(to.y-shot.rect.y)*p.progress-shot.rect.height*p.lift}px)`;sprite.style.backgroundPosition=`${poseFrame(state,t)/3*100}% ${sprite.style.getPropertyValue('--tier-y')}`;if(t<1)f.raf=requestAnimationFrame(frame);else f.finish();};f.raf=requestAnimationFrame(frame);
   });
  })).then(()=>{});
 }
 cancel(){for(const f of [...this.flights])f.finish();this.refresh();}
}
