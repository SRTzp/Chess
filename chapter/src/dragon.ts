import Phaser from 'phaser';
type Action='idle'|'flap'|'happy'|'hint';
type FrameInfo={key:string;originX:number;originY:number};
/** Normalize atlas cells at load time using one shared scale and a foot anchor.
 * The original transparent artwork stays intact; no independent per-frame scaling. */
export class DragonCompanion {
 private sprite:Phaser.GameObjects.Image;
 private frames:FrameInfo[]=[];
 private extent=1;
 private action:Action='idle';
 private since=0;
 private current=-1;
 constructor(private scene:Phaser.Scene){
  const texture=scene.textures.get('dragon-atlas');
  const source=texture.getSourceImage() as HTMLImageElement;
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(source,0,0);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  for(let i=0;i<16;i++){
   const x0=Math.floor(i%4*source.width/4),y0=Math.floor(Math.floor(i/4)*source.height/4);
   const x1=Math.floor((i%4+1)*source.width/4),y1=Math.floor((Math.floor(i/4)+1)*source.height/4);
   let left=x1,top=y1,right=x0,bottom=y0;
   for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(pixels[(y*canvas.width+x)*4+3]>32){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
   const width=right-left+1,height=bottom-top+1;
   if(width<=0||height<=0)throw new Error(`Empty dragon animation cell ${i}`);
   // Foot region excludes the tail on the left. Keeps the torso stable during wing motion.
   let weightedX=0,count=0;
   for(let y=Math.max(top,bottom-12);y<=bottom;y++)for(let x=Math.max(left,x0+Math.floor((x1-x0)*.35));x<=right;x++)if(pixels[(y*canvas.width+x)*4+3]>96){weightedX+=x;count++;}
   const anchor=count?weightedX/count:(left+right)/2;
   const key=`dragon-${i}`;texture.add(key,0,left,top,width,height);
   this.frames.push({key,originX:(anchor-left)/width,originY:1});this.extent=Math.max(this.extent,width,height);
  }
  this.sprite=scene.add.image(0,0,'dragon-atlas',this.frames[0].key).setDepth(5);
  this.show(0);
 }
 private show(index:number){if(index===this.current)return;this.current=index;const frame=this.frames[index];this.sprite.setFrame(frame.key).setOrigin(frame.originX,frame.originY);}
 layout(x:number,bottom:number,size:number){this.sprite.setPosition(x,bottom).setScale(size/this.extent);}
 cue(action:Action){this.action=action;this.since=this.scene.time.now;this.current=-1;}
 update(now:number,reduced:boolean){
  if(reduced){this.show(0);return;}
  const elapsed=now-this.since;
  if(this.action!=='idle'&&elapsed>=1900){this.action='idle';this.since=now;}
  if(this.action==='idle'){
   const phase=(now-this.since)%7000;
   // Slow breathing and one brief blink, with an occasional wing stretch.
   if(phase>5400)this.show([4,5,6,7][Math.min(3,Math.floor((phase-5400)/400))]);
   else this.show(phase>3100&&phase<3300?2:Math.floor(phase/750)%2===0?0:1);
  }else{
   const sequence=this.action==='flap'?[4,5,6,7,4]:this.action==='happy'?[8,9,10,11,8]:[12,13,14,14,15];
   this.show(sequence[Math.min(sequence.length-1,Math.floor(elapsed/380))]);
  }
 }
 reset(){this.cue('idle');this.show(0);}
}
