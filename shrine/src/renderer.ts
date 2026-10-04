import Phaser from 'phaser';
import { Atmosphere } from './atmosphere';
import { assets, frames } from './assets';
import { cells, GOALS, knightMoves, same, solution, threats, type Cell, type State } from './simulation';
export class Shrine extends Phaser.Scene {
  ready!: () => void; layout!: (x:number,y:number,c:number)=>void;
  reduced=false; private bg!:Phaser.GameObjects.Image; private ink!:Phaser.GameObjects.Graphics;
  private knight!:Phaser.GameObjects.Sprite; private rook!:Phaser.GameObjects.Sprite;
  private labels:Phaser.GameObjects.Text[]=[]; private state?:State; private ox=0;private oy=0;private cell=60;
  private finishes=new Set<()=>void>(); private moving=false; private atmosphere!:Atmosphere; private shadows!:Phaser.GameObjects.Graphics;
  constructor(){super('Shrine');}
  preload(){this.load.image('environment',assets.shrine);this.load.spritesheet('heroes',assets.heroes,{frameWidth:512,frameHeight:512});this.load.on('loaderror',()=>{document.getElementById('load-error')!.hidden=false;});}
  create(){this.bg=this.add.image(0,0,'environment').setOrigin(.5);this.ink=this.add.graphics().setDepth(1);this.atmosphere=new Atmosphere(this);this.shadows=this.add.graphics().setDepth(2.5);this.knight=this.add.sprite(0,0,'heroes',frames.knight).setDepth(4);this.rook=this.add.sprite(0,0,'heroes',frames.rook).setTint(0xc3a2f0).setDepth(3);this.scale.on('resize',()=>{this.cancel();this.draw();});this.ready();}
  update(time:number){
    if(!this.state)return;
    this.atmosphere.update(time,this.reduced);
    if(!this.moving&&this.state.phase!=='demo'){
      const p=this.point(this.state.knight),bob=this.reduced?0:Math.sin(time/420)*2.5;
      this.knight.setPosition(p.x,p.y-6+bob).setAngle(this.reduced?0:Math.sin(time/650)*.7);
      if(this.state.rook){const r=this.point(this.state.rook);this.rook.y=r.y-4+(this.reduced?0:Math.sin(time/570)*1);}
    }
    this.shadows.clear();
    if(this.state.alive){const p=this.point(this.state.knight);this.shadows.fillStyle(0x14251d,.26).fillEllipse(p.x,p.y+this.cell*.29,this.cell*.53,this.cell*.17);}
    if(this.state.rook){const p=this.point(this.state.rook);this.shadows.fillStyle(0x1e1829,.35).fillEllipse(p.x,p.y+this.cell*.3,this.cell*.62,this.cell*.19);}
  }
  point(p:Cell){return {x:this.ox+(p.x+.5)*this.cell,y:this.oy+(p.y+.5)*this.cell};}
  sync(s:State){this.state=s;this.draw();}
  private label(x:number,y:number,text:string,color='#ffe4a0',size=18){this.labels.push(this.add.text(x,y,text,{fontFamily:'sans-serif',fontSize:size,color,fontStyle:'bold'}).setOrigin(.5).setDepth(2));}
  private draw(){if(!this.state||!this.ink)return;const s=this.state,w=this.scale.width,h=this.scale.height;this.bg.setPosition(w/2,h/2).setScale(Math.max(w/1536,h/1024));this.cell=Math.min((w-30)/6,(h-115)/6,82);this.ox=(w-this.cell*6)/2;this.oy=80+(h-100-this.cell*6)/2;this.layout(this.ox,this.oy,this.cell);this.atmosphere.layout(this.ox,this.oy,this.cell*6);this.ink.clear();this.labels.forEach(t=>t.destroy());this.labels=[];
    const legal=knightMoves(s.knight),danger=threats(s),best=s.hints>=3?solution(s,s.stage)?.[0]:null;
    for(const p of cells){const q=this.point(p),c=this.cell,r=c/2-3;const bad=s.showThreats&&danger.some(a=>same(a,p));const good=s.selected&&s.hints>0&&legal.some(a=>same(a,p));this.ink.fillStyle(0x142722,.65).fillRoundedRect(q.x-r,q.y-r+5,r*2,r*2,5);this.ink.fillStyle(bad?0x785458:[0x78826b,0x727d67,0x7c846d][(p.x*3+p.y)%3],1).fillRoundedRect(q.x-r,q.y-r,r*2,r*2,5);this.ink.lineStyle(good?3:1,good?0xffd778:0xa5ae8d,good?1:.45).strokeRoundedRect(q.x-r,q.y-r,r*2,r*2,5);this.ink.lineStyle(1,0xc5c8a2,.2).beginPath().moveTo(q.x-r+7,q.y-r+5).lineTo(q.x+r-7,q.y-r+5).strokePath();if((p.x+p.y*3)%4===0)this.ink.lineStyle(1,0x283d30,.3).beginPath().moveTo(q.x+r-12,q.y+r).lineTo(q.x+r-16,q.y+r-8).lineTo(q.x+r-11,q.y+r-12).strokePath();if((p.x*7+p.y)%3===0){this.ink.fillStyle(0x496c43,.65).fillRect(q.x-r+3,q.y+r-6,9,3).fillRect(q.x-r+3,q.y+r-10,4,4);}if(bad)this.label(q.x+r-9,q.y-r+11,'!','#ffb8a0',16);if(good)this.ink.fillStyle(0xffd778,.75).fillCircle(q.x,q.y,4);if(same(best??null,p))this.label(q.x,q.y,'✧');}
    if(s.stage<2){const q=this.point(GOALS[s.stage as 0|1]);this.label(q.x,q.y,'★','#ffe3a1',Math.min(28,this.cell*.45));}
    const k=this.point(s.knight);this.knight.setAngle(0).setPosition(k.x,k.y-4).setDisplaySize(this.cell*1.35,this.cell*1.35).setVisible(s.alive);this.rook.setVisible(!!s.rook);if(s.rook){const r=this.point(s.rook);this.rook.setPosition(r.x,r.y-4).setDisplaySize(this.cell*1.3,this.cell*1.3);}
    if(s.selected)this.ink.lineStyle(3,0xffe9ae).strokeCircle(k.x,k.y,this.cell*.39);
  }
  route(from:Cell,to:Cell){const a=this.point(from),b=this.point(to);const middle=Math.abs(to.y-from.y)===2?{x:a.x,y:b.y}:{x:b.x,y:a.y};this.ink.lineStyle(4,0xffdf7d,.95).beginPath().moveTo(a.x,a.y).lineTo(middle.x,middle.y).lineTo(b.x,b.y).strokePath();this.label(middle.x,middle.y,'2');this.label(b.x,b.y,'1');}
  animate(kind:'knight'|'rook',from:Cell,to:Cell){this.moving=true;const sprite=kind==='knight'?this.knight:this.rook,a=this.point(from),b=this.point(to);return new Promise<void>(resolve=>{const finish=()=>{this.moving=false;this.finishes.delete(finish);resolve();};this.finishes.add(finish);this.tweens.addCounter({from:0,to:1,duration:this.reduced?80:kind==='knight'?650:500,ease:'Sine.easeInOut',onUpdate:t=>{const v=t.getValue()??1;sprite.setAngle(this.reduced?0:kind==='knight'?Math.sin(v*Math.PI)*5*(to.x>=from.x?1:-1):Math.sin(v*Math.PI*6)*1.5);sprite.setPosition(Phaser.Math.Linear(a.x,b.x,v),Phaser.Math.Linear(a.y,b.y,v)-4-(kind==='knight'&&!this.reduced?Math.sin(v*Math.PI)*this.cell*.65:0));},onComplete:()=>{sprite.setAngle(0);this.atmosphere.burst(b.x,b.y+this.cell*.3,'land',this.reduced);finish();}});});}
  pause(ms:number){return new Promise<void>(resolve=>{const finish=()=>{this.finishes.delete(finish);resolve();};this.finishes.add(finish);this.time.delayedCall(ms,finish);});}
  impact(at:Cell){const p=this.point(at);this.atmosphere.burst(p.x,p.y,'hit',this.reduced);}
  celebrate(){if(this.state){const p=this.point(this.state.knight);this.atmosphere.burst(p.x,p.y,'win',this.reduced);}}
  cancel(){this.moving=false;this.atmosphere?.clear();this.knight?.setAngle(0);this.rook?.setAngle(0);this.tweens.killAll();this.time.removeAllEvents();for(const f of [...this.finishes])f();}
}
