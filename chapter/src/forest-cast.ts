import Phaser from 'phaser';
import {atlasBounds} from './forest-atlas';
import type {ForestRole,ForestTier} from './forest-adventure';
type Frame={key:string;width:number;height:number};
/** Runtime frame bounds preserve generated PNG/WebP pixels and align all actors' feet. */
export class ForestCast{
 private frames=new Map<ForestRole,Frame[]>();
 constructor(private scene:Phaser.Scene){for(const role of ['pawn','knight','rook'] as ForestRole[]){
  const texture=scene.textures.get('forest-'+role),source=texture.getSourceImage() as HTMLImageElement;
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(source,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  const frames:Frame[]=atlasBounds(pixels,source.width,source.height).map((bounds,i)=>{const key=role+'-'+i;texture.add(key,0,bounds.x,bounds.y,bounds.width,bounds.height);return{key,width:bounds.width,height:bounds.height};});this.frames.set(role,frames);
 }}
 apply(sprite:Phaser.GameObjects.Sprite,role:ForestRole,tier:ForestTier,enemy:boolean,cell:number){
  const i=enemy?3:tier==='master'?2:tier==='guardian'?1:0,frame=this.frames.get(role)![i];
  const height=role==='pawn'?.86:role==='knight'?.86:.91,width=role==='knight'?.96:.92;
  sprite.setTexture('forest-'+role,frame.key).setOrigin(.5,1).setScale(Math.min(cell*height/frame.height,cell*width/frame.width)).clearTint().setVisible(true);
 }
}
