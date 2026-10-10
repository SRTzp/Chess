import Phaser from 'phaser';
import type {Cell} from './rules';
import {attackTiming} from './attack-motion';
import type {ForestRole} from './forest-adventure';
import type {ForestMove,ForestTier} from './forest-adventure';
type Point={x:number;y:number};
type Mark={kind:'foot'|'fire'|'ring'|'slash'|'lightning'|'smoke'|'win'|'measure'|'strike';role?:ForestRole;enemy?:boolean;at:Point;born:number;life:number;size:number;tier:ForestTier;reduced:boolean;from?:Point;bend?:Point;to?:Point};
/** Bounded cosmetic layers. No legal moves, hit targets, turns or rewards are owned here. */
export class ForestEffects{
 private ground:Phaser.GameObjects.Graphics;private air:Phaser.GameObjects.Graphics;private ambient:Phaser.GameObjects.Graphics;
 private marks:Mark[]=[];private ghosts=new Set<Phaser.GameObjects.Image>();private counts:{text:Phaser.GameObjects.Text;until:number}[]=[];
 private bounds={x:0,y:0,width:0,height:0};
 constructor(private scene:Phaser.Scene){this.ambient=scene.add.graphics().setDepth(.5);this.ground=scene.add.graphics().setDepth(3);this.air=scene.add.graphics().setDepth(6);}
 layout(x:number,y:number,width:number,height:number){this.bounds={x,y,width,height};}
 start(move:ForestMove,point:(cell:Cell)=>Point,cell:number,tier:ForestTier,reduced:boolean,capture:boolean){
  const now=this.scene.time.now,life=tier==='apprentice'?230:tier==='guardian'?360:460;
  if(move.role==='knight'&&move.measurement&&!reduced){const [a,b,c]=move.measurement.map(point);this.add({kind:'measure',at:a,from:a,bend:b,to:c,born:now,life:180,size:cell,tier,reduced});
   for(const [n,p,q] of [[2,a,b],[1,b,c]] as [number,Point,Point][]){const text=this.scene.add.text((p.x+q.x)/2,(p.y+q.y)/2-8,String(n),{fontSize:Math.max(10,cell*.22),fontFamily:'sans-serif',color:'#d8f4ef'}).setOrigin(.5).setDepth(6);this.counts.push({text,until:now+180});}
  }
  for(const [i,c]of move.trail.entries())this.add({kind:move.role==='rook'?'fire':'foot',at:point(c),born:now+(reduced?0:i/Math.max(1,move.trail.length-1)*move.duration),life:reduced?600:life,size:cell,tier,reduced});
  const at=point(move.to),arrival=now+(reduced?0:move.duration);
  if(tier!=='apprentice'||move.role==='knight')this.add({kind:move.role==='knight'?'lightning':'ring',at,born:arrival,life:reduced?600:340,size:cell,tier,reduced});
  if(capture){this.add({kind:move.role==='pawn'?'slash':'smoke',at,from:point(move.from),to:at,born:arrival,life:reduced?600:360,size:cell,tier,reduced});}
 }
 capture(sprite:Phaser.GameObjects.Sprite,duration:number,fade=220,reduced=false,offset:Point={x:0,y:0}){
  const ghost=this.clone(sprite).setDepth(5);ghost.setPosition(ghost.x+offset.x,ghost.y+offset.y);sprite.setVisible(false);
  this.scene.time.delayedCall(duration,()=>{if(reduced)this.removeGhost(ghost);else this.scene.tweens.add({targets:ghost,alpha:0,duration:fade,onComplete:()=>this.removeGhost(ghost)});});
 }
 strike(from:Point,to:Point,role:ForestRole,cell:number,tier:ForestTier,enemy:boolean,reduced:boolean){this.add({kind:'strike',role,enemy,at:to,from,to,born:this.scene.time.now+(reduced?0:attackTiming.strike),life:reduced?360:attackTiming.recover-attackTiming.strike,size:cell,tier,reduced});}
 echo(sprite:Phaser.GameObjects.Sprite){const ghost=this.clone(sprite).setAlpha(.18).setTint(0xc1e9ed).setDepth(3.5);this.scene.tweens.add({targets:ghost,alpha:0,duration:180,onComplete:()=>this.removeGhost(ghost)});}
 private clone(sprite:Phaser.GameObjects.Sprite){const ghost=this.scene.add.image(sprite.x,sprite.y,sprite.texture.key,sprite.frame.name).setOrigin(sprite.originX,sprite.originY).setScale(sprite.scaleX,sprite.scaleY).setAngle(sprite.angle);this.ghosts.add(ghost);return ghost;}
 private removeGhost(ghost:Phaser.GameObjects.Image){this.ghosts.delete(ghost);ghost.destroy();}
 private add(mark:Mark){this.marks.push(mark);if(this.marks.length>48)this.marks.splice(0,this.marks.length-48);}
 celebrate(at:Point,size:number,reduced:boolean){this.add({kind:'win',at,born:this.scene.time.now,life:reduced?600:750,size,tier:'master',reduced});}
 update(now:number,reduced:boolean){
  this.ground.clear();this.air.clear();this.ambient.clear();const b=this.bounds;
  // Soft fixed edge light. No drifting particles or ripple animation crosses the board.
  for(let i=0;i<10;i++){const x=i%2?b.x+b.width+12:b.x-12,y=b.y+(i/10)*b.height;this.ambient.fillStyle(0xffe4a4,.28).fillRect(x,y,2,2);}
  this.counts=this.counts.filter(c=>{if(now<c.until)return true;c.text.destroy();return false;});
  this.marks=this.marks.filter(m=>now<m.born+m.life);
  for(const m of this.marks){if(now<m.born)continue;const p=(now-m.born)/m.life,alpha=m.reduced?.45:Math.min(1,p/.2)*(1-p)*.8,at=m.at,c=m.size,level=m.tier==='master'?3:m.tier==='guardian'?2:1;
   const g=['foot','fire','ring','measure'].includes(m.kind)?this.ground:this.air;
   if(m.kind==='foot'){g.fillStyle(0xb8e5e9,alpha).fillEllipse(at.x-c*.08,at.y+c*.33,c*.07,c*.1).fillEllipse(at.x+c*.08,at.y+c*.29,c*.07,c*.1);if(level>1)g.lineStyle(1,0xbee8ec,alpha*.6).strokeCircle(at.x,at.y,c*.3);}
   else if(m.kind==='fire'){g.fillStyle(0xffd478,alpha*.6).fillEllipse(at.x,at.y+c*.32,c*.62,c*.16);if(!m.reduced)for(let i=0;i<level+1;i++){const x=at.x+(i-level/2)*c*.11;g.fillStyle(i%2?0xffdf9c:0xfac56a,alpha).fillTriangle(x-c*.04,at.y+c*.32,x,at.y+c*(.20-level*.025),x+c*.05,at.y+c*.32);}}
   else if(m.kind==='ring'){g.lineStyle(2,0xdceab7,alpha).strokeEllipse(at.x,at.y+c*.25,c*.68,c*.28);}
   else if(m.kind==='slash'){if(m.reduced)g.lineStyle(2,0xc5edf0,.45).lineBetween(at.x-c*.13,at.y+c*.13,at.x+c*.13,at.y-c*.13);else{const dx=Math.sign(at.x-m.from!.x),dy=Math.sign(at.y-m.from!.y);g.lineStyle(2+level*.3,0xd3f4f0,alpha).lineBetween(at.x-dx*c*.25,at.y-dy*c*.25,at.x+dx*c*.25,at.y+dy*c*.25);}g.fillStyle(0xe8ead8,alpha*.5).fillCircle(at.x-c*.13,at.y+c*.18,c*.09);}
   else if(m.kind==='lightning'){g.lineStyle(2,0xc0e8f5,alpha).strokeEllipse(at.x,at.y+c*.3,c*.66,c*.22);for(let i=0;i<(m.reduced?2:level+1);i++){const x=at.x+(i-level/2)*c*.14;g.lineStyle(1.5,0xe0f3fd,alpha).beginPath().moveTo(x,at.y+c*.32).lineTo(x+c*.04,at.y+c*.18).lineTo(x-c*.03,at.y+c*.18).lineTo(x+c*.03,at.y+c*.06).strokePath();}}
   else if(m.kind==='smoke'){for(let i=0;i<(m.reduced?2:level+2);i++){const a=i*Math.PI*2/(level+2),r=(m.reduced?.18:.12+p*.18)*c;g.fillStyle(i%2?0xe8deb9:0xc5d8c7,alpha*.65).fillCircle(at.x+Math.cos(a)*r,at.y+Math.sin(a)*r,c*.07);}g.lineStyle(1.5,0xffe3a5,alpha).strokeCircle(at.x,at.y,c*.25);}
   else if(m.kind==='strike'){
    const a=m.from!,b=m.to!,dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1,ux=dx/length,uy=dy/length,px=-uy,py=ux,color=m.enemy?0xe8d1ff:0xfff0bd;
    const point=(along:number,across:number)=>({x:a.x+ux*along*c+px*across*c,y:a.y+uy*along*c+py*across*c});
    const line=(x1:number,y1:number,x2:number,y2:number,width:number)=>{const v=point(x1,y1),w=point(x2,y2);g.lineStyle(width+2,0x15291f,alpha).lineBetween(v.x,v.y,w.x,w.y);g.lineStyle(width,color,alpha).lineBetween(v.x,v.y,w.x,w.y);};
    line(0,0,length/c,0,2.5);
    if(m.role==='pawn'){line(.05,-.22,.35,0,2.5);line(.35,0,.05,.22,2.5);}
    else if(m.role==='knight'){line(length/c-.15,-.09,length/c,0,2.5);line(length/c,0,length/c-.15,.09,2.5);}
    else {g.lineStyle(2.5,color,alpha).strokeRect(b.x-c*.12,b.y-c*.12,c*.24,c*.24);}
    if(m.reduced||now>=m.born+attackTiming.contact-attackTiming.strike){g.lineStyle(2,color,alpha).strokeCircle(b.x,b.y,c*.15);}
   }
   else if(m.kind==='win'){g.lineStyle(2,0xffe397,alpha).strokeEllipse(at.x,at.y+c*.25,c*.85,c*.35);for(let i=0;i<(m.reduced?3:7);i++){const a=i*Math.PI*2/7,r=c*(.25+(m.reduced?0:p*.15));g.fillStyle(0xffeab7,alpha).fillRect(at.x+Math.cos(a)*r,at.y+Math.sin(a)*r,2,2);}}
   else if(m.kind==='measure'){const a=m.from!,bend=m.bend!,end=m.to!;g.lineStyle(2,0xaccdd6,alpha*.7).lineBetween(a.x,a.y,bend.x,bend.y);if(p>.5)g.lineBetween(bend.x,bend.y,end.x,end.y);}
  }
 }
 clear(){this.marks=[];this.counts.forEach(c=>c.text.destroy());this.counts=[];this.ghosts.forEach(g=>g.destroy());this.ghosts.clear();this.ground.clear();this.air.clear();this.ambient.clear();}
}
