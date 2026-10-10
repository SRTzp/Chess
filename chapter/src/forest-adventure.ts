import type {Cell} from './rules';
export type ForestRole='pawn'|'knight'|'rook';
export type ForestTier='apprentice'|'guardian'|'master';
// Existing lesson completion is the only progression input. Hint and Undo are irrelevant.
export function forestTier(done:readonly boolean[],role:ForestRole):ForestTier{
 const start=role==='knight'?6:0,end=role==='knight'?12:6;
 if(role==='rook')return'apprentice';
 const complete=(to:number)=>done.length>=to&&Array.from({length:to-start},(_,i)=>done[start+i]).every(v=>v===true);
 return complete(end)?'master':complete(start+3)?'guardian':'apprentice';
}
export type ForestMove={role:ForestRole;from:Cell;to:Cell;duration:number;trail:Cell[];measurement?:[Cell,Cell,Cell]};
// Geometry is descriptive only: main.ts still rejects moves through the original engine.
export function forestMove(role:ForestRole,from:Cell,to:Cell,capture=false):ForestMove|null{
 const dx=to.x-from.x,dy=to.y-from.y,ax=Math.abs(dx),ay=Math.abs(dy);
 if(!dx&&!dy)return null;
 if(role==='knight'){
  if(!((ax===2&&ay===1)||(ax===1&&ay===2)))return null;
  return{role,from,to,duration:500,trail:[],measurement:[from,ax===2?{x:to.x,y:from.y}:{x:from.x,y:to.y},to]};
 }
 if(role==='pawn'&&(capture?ax!==1||ay!==1:dx!==0||!(ay===1||ay===2)))return null;
 if(role==='rook'&&dx!==0&&dy!==0)return null;
 const steps=Math.max(ax,ay),sx=Math.sign(dx),sy=Math.sign(dy);
 return{role,from,to,duration:role==='pawn'?420:470,trail:Array.from({length:steps+1},(_,i)=>({x:from.x+i*sx,y:from.y+i*sy}))};
}
