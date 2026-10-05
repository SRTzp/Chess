export type GridPoint={x:number;y:number};
export type VisualPiece='p'|'n'|'b'|'r'|'q'|'k';
export type VisualMove={from:GridPoint;to:GridPoint;piece:VisualPiece;capture?:boolean};
export type TeachingPath={points:GridPoint[];kind:'jump'|'straight'|'diagonal'|'capture'|'castle';symbol:string};
export const algebraicPoint=(square:string):GridPoint=>({x:square.charCodeAt(0)-97,y:8-Number(square[1])});

// The path explains the move's shape. Only callers with a legal move may draw it.
// Knight bends are visual measuring marks, never occupied or visited squares.
export function teachingPath(move:VisualMove):TeachingPath|null{
 const {from,to,piece}=move,dx=to.x-from.x,dy=to.y-from.y,ax=Math.abs(dx),ay=Math.abs(dy);
 if(!dx&&!dy)return null;
 if(piece==='n'){
  if(!((ax===2&&ay===1)||(ax===1&&ay===2)))return null;
  const bend=ax===2?{x:to.x,y:from.y}:{x:from.x,y:to.y};
  return{points:[from,bend,to],kind:'jump',symbol:'↷'};
 }
 if(piece==='p'){
  if(dx===0&&(ay===1||ay===2)&&!move.capture)return{points:[from,to],kind:'straight',symbol:'↑'};
  if(ax===1&&ay===1&&move.capture)return{points:[from,to],kind:'capture',symbol:'✦'};
  return null;
 }
 if(piece==='k'){
  if(ax===2&&dy===0)return{points:[from,to],kind:'castle',symbol:'♔'};
  if(ax<=1&&ay<=1)return{points:[from,to],kind:ax&&ay?'diagonal':'straight',symbol:'♔'};
  return null;
 }
 if((piece==='r'||piece==='q')&&(dx===0||dy===0))return{points:[from,to],kind:move.capture?'capture':'straight',symbol:move.capture?'✦':'➜'};
 if((piece==='b'||piece==='q')&&ax===ay)return{points:[from,to],kind:move.capture?'capture':'diagonal',symbol:move.capture?'✦':'➜'};
 return null;
}

const ns='http://www.w3.org/2000/svg';
const svgEl=<K extends keyof SVGElementTagNameMap>(name:K)=>document.createElementNS(ns,name);
export class DemoGate{
 private timer:ReturnType<typeof setTimeout>|null=null;private finish:(value:boolean)=>void=()=>{};
 cancel(){if(this.timer)clearTimeout(this.timer);this.timer=null;this.finish(false);this.finish=()=>{};}
 wait(ms:number):Promise<boolean>{this.cancel();return new Promise(resolve=>{this.finish=resolve;this.timer=setTimeout(()=>{this.timer=null;this.finish=()=>{};resolve(true);},ms);});}
}
export class TeachingOverlay{
 private move:VisualMove|null=null;private mode:'demo'|'preview'|'hint'='hint';private reduced=false;private gate=new DemoGate();
 constructor(private container:HTMLElement,private cell:(point:GridPoint)=>HTMLElement|null){}
 get active(){return !!this.move;}
 cancel(){this.gate.cancel();this.move=null;this.container.querySelector('.teaching-overlay')?.remove();}
 show(move:VisualMove,mode:'demo'|'preview'|'hint',reduced=false){this.cancel();if(!teachingPath(move))return false;this.move=move;this.mode=mode;this.reduced=reduced;this.refresh();return true;}
 refresh(){if(!this.move)return;const shape=teachingPath(this.move);if(!shape)return;const box=this.container.getBoundingClientRect();const centers=shape.points.map(p=>{const el=this.cell(p);if(!el)return null;const r=el.getBoundingClientRect();return{x:r.left+r.width/2-box.left,y:r.top+r.height/2-box.top};});if(centers.some(p=>!p))return;const points=centers as {x:number;y:number}[];
  this.container.querySelector('.teaching-overlay')?.remove();const svg=svgEl('svg');svg.classList.add('teaching-overlay',`teaching-${this.mode}`,`teaching-${shape.kind}`);if(this.reduced)svg.classList.add('teaching-reduced');svg.setAttribute('viewBox',`0 0 ${Math.max(1,box.width)} ${Math.max(1,box.height)}`);svg.setAttribute('aria-hidden','true');
  for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],line=svgEl('line');line.setAttribute('x1',String(a.x));line.setAttribute('y1',String(a.y));line.setAttribute('x2',String(b.x));line.setAttribute('y2',String(b.y));line.classList.add('teaching-segment');line.style.setProperty('--path-length',String(Math.hypot(b.x-a.x,b.y-a.y)));line.style.setProperty('--segment-delay',`${i*.48}s`);svg.append(line);if(shape.kind==='jump'){const mark=svgEl('text');mark.textContent=i===0?'2':'1';mark.setAttribute('x',String((a.x+b.x)/2));mark.setAttribute('y',String((a.y+b.y)/2-8));mark.classList.add('teaching-count');mark.style.setProperty('--segment-delay',`${i*.48}s`);svg.append(mark);}}
  const end=points.at(-1)!,ring=svgEl('circle');ring.setAttribute('cx',String(end.x));ring.setAttribute('cy',String(end.y));ring.setAttribute('r','16');ring.classList.add('teaching-landing');svg.append(ring);
  const mark=svgEl('text');mark.textContent=this.mode==='preview'?'✓':shape.symbol;mark.setAttribute('x',String(end.x));mark.setAttribute('y',String(end.y-21));mark.classList.add('teaching-symbol');svg.append(mark);
  if(this.mode==='demo'&&!this.reduced){const start=points[0],ghost=svgEl('text');ghost.textContent=this.move.piece==='n'?'♘':this.move.piece==='p'?'♙':this.move.piece==='q'?'♕':this.move.piece==='k'?'♔':this.move.piece==='b'?'♗':'♖';ghost.setAttribute('x',String(start.x));ghost.setAttribute('y',String(start.y+12));ghost.classList.add('teaching-ghost');ghost.style.setProperty('--jump-x',`${end.x-start.x}px`);ghost.style.setProperty('--jump-y',`${end.y-start.y}px`);ghost.style.setProperty('--jump-mid-x',`${(end.x-start.x)/2}px`);ghost.style.setProperty('--jump-mid-y',`${(end.y-start.y)/2-22}px`);svg.append(ghost);}
  this.container.append(svg);
 }
 demonstrate(move:VisualMove,reduced=false):Promise<boolean>{if(!this.show(move,'demo',reduced))return Promise.resolve(false);if(reduced)return Promise.resolve(true);return this.gate.wait(1450);}
}
