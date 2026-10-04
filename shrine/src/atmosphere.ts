import Phaser from 'phaser';

type Particle = { x:number; y:number; vx:number; vy:number; life:number; born:number; color:number; size:number };
/** Cosmetic effects only: never owns cells, moves, turns, or hit detection. */
export class Atmosphere {
  private ambient: Phaser.GameObjects.Graphics;
  private foreground: Phaser.GameObjects.Graphics;
  private particles: Particle[] = [];
  private board = { x:0, y:0, size:0 };
  constructor(private scene:Phaser.Scene) {
    this.ambient=scene.add.graphics().setDepth(.5);
    this.foreground=scene.add.graphics().setDepth(6);
  }
  layout(x:number,y:number,size:number) { this.board={x,y,size}; }
  private outside(x:number,y:number) {
    const b=this.board;
    return x<b.x-14||x>b.x+b.size+14||y<b.y-14||y>b.y+b.size+14;
  }
  update(now:number,reduced:boolean) {
    const g=this.ambient,w=this.scene.scale.width,h=this.scene.scale.height;
    const t=reduced?0:now/1000;
    g.clear();
    // Warm light at the forest edges. Keep all decorative motion off the lesson grid.
    for(let i=0;i<18;i++) {
      const side=i%2===0,baseX=side?w*.10:w*.9;
      const x=baseX+Math.sin(t*.33+i*2.4)*Math.min(65,w*.12);
      const y=90+((i*79)%(Math.max(1,h-110)))+Math.cos(t*.5+i)*9;
      if(!this.outside(x,y))continue;
      const a=.35+(Math.sin(t*1.8+i*1.9)+1)*.22;
      g.fillStyle(0xe6dc83,a*.08).fillCircle(x,y,13);
      g.fillStyle(0xf7e796,a*.2).fillCircle(x,y,6);
      g.fillStyle(0xffed9e,a).fillRect(Math.round(x),Math.round(y),2,2);
    }
    // Ripples follow the river in the background's image coordinates, including cover cropping.
    const scale=Math.max(w/1536,h/1024),left=(w-1536*scale)/2,top=(h-1024*scale)/2;
    for(let i=0;i<13;i++) {
      const sy=370+i*43, sx=1370-Math.sin(i*.56)*35;
      const x=left+sx*scale,y=top+(sy+(reduced?0:(t*12+i*7)%25))*scale;
      if(x<0||x>w||y<0||y>h||!this.outside(x,y))continue;
      const a=.10+(1+Math.sin(t*2+i))*.09;
      g.lineStyle(2,0xb0e8cf,a).beginPath().moveTo(x-9*scale,y).lineTo(x+8*scale,y).strokePath();
    }
    // A few drifting leaves, at the edge of the clearing rather than across destination tiles.
    if(!reduced)for(let i=0;i<5;i++) {
      const y=(t*(8+i*2)+i*117)%(h+20)-10;
      const x=(i%2===0?w*.06:w*.94)+Math.sin(t*.7+i)*16;
      if(this.outside(x,y))g.fillStyle(i%2?0xa7ad60:0x789554,.55).fillRect(x,y,5,2);
    }
    const f=this.foreground;f.clear();
    this.particles=this.particles.filter(p=>now-p.born<p.life);
    for(const p of this.particles) {
      const progress=(now-p.born)/p.life,seconds=(now-p.born)/1000;
      const x=p.x+(reduced?0:p.vx*seconds),y=p.y+(reduced?0:p.vy*seconds+seconds*seconds*18);
      f.fillStyle(p.color,(1-progress)*.85).fillRect(Math.round(x),Math.round(y),p.size,p.size);
    }
  }
  burst(x:number,y:number,kind:'land'|'hit'|'win',reduced:boolean) {
    const count=reduced?4:kind==='win'?28:kind==='hit'?19:8;
    const colors=kind==='hit'?[0xffe6ae,0xc4a0ed,0xf8f1d0]:kind==='win'?[0xffd677,0xaee3bd,0xfbf5bc]:[0xc9c399,0x939c75];
    for(let i=0;i<count;i++) {
      const angle=i*Math.PI*2/count,speed=kind==='land'?22:35+(i%5)*12;
      this.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-(kind==='win'?50:10),life:kind==='win'?1300:520,born:this.scene.time.now,color:colors[i%colors.length],size:i%3+2});
    }
    // Bound cosmetic work even if the player rapidly clicks through lessons.
    if(this.particles.length>90)this.particles.splice(0,this.particles.length-90);
  }
  clear(){this.particles=[];this.foreground.clear();}
}
