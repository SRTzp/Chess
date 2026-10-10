import {actorScale} from './actor-scale';
import Phaser from 'phaser';
import type {ForestRole,ForestTier} from './forest-adventure';
export class ForestCast{
 constructor(_scene:Phaser.Scene){}
 apply(sprite:Phaser.GameObjects.Sprite,role:ForestRole,tier:ForestTier,enemy:boolean,cell:number){
  const row=enemy?3:tier==='master'?2:tier==='guardian'?1:0;
  sprite.setTexture('forest-'+role,row*4).setData('poseBase',row*4).setOrigin(.5,1).setScale(cell*actorScale[role==='pawn'?'p':role==='knight'?'n':'r']/128).clearTint().setVisible(true);
 }
 pose(sprite:Phaser.GameObjects.Sprite,frame:number){sprite.setFrame((sprite.getData('poseBase')??0)+frame);}
}
