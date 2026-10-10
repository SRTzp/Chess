import type {Move,PieceSymbol,Square} from './engine/chess';

export type PoseState='idle'|'move'|'capture';
/** Four genuine raster poses are shared across states; geometry never changes chess state. */
export function poseFrame(state:PoseState,t:number){
 const v=Math.max(0,Math.min(1,t));
 if(state==='idle')return v>.82&&v<.94?1:0;
 return v>=1?0:v<.22?1:v<.76?2:state==='capture'?3:0;
}
export function travelPose(role:PieceSymbol,t:number){
 const v=Math.max(0,Math.min(1,t)),progress=Math.max(0,Math.min(1,(v-.22)/.58));
 return {progress,lift:role==='n'?Math.sin(progress*Math.PI)*.32:0};
}
export function moveActors(m:Pick<Move,'from'|'to'|'piece'|'flags'>){
 const result:{from:Square;to:Square;piece:PieceSymbol}[]=[{from:m.from,to:m.to,piece:m.piece}];
 const rank=m.from[1];
 if(m.flags.includes('k'))result.push({from:('h'+rank)as Square,to:('f'+rank)as Square,piece:'r'});
 if(m.flags.includes('q'))result.push({from:('a'+rank)as Square,to:('d'+rank)as Square,piece:'r'});
 return result;
}
