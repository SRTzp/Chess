import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from '../chapter/src/engine/chess';
import {moveActors,poseFrame,travelPose} from '../chapter/src/piece-motion';
import {FullGame} from '../chapter/src/fullgame/model';
test('Knight anticipates, makes one direct airborne arc, lands, and returns to idle',()=>{
 assert.deepEqual(travelPose('n',.1),{progress:0,lift:0});
 const samples=Array.from({length:101},(_,i)=>travelPose('n',i/100));
 assert.ok(samples.every((s,i)=>!i||s.progress>=samples[i-1].progress));
 assert.equal(samples.filter((s,i)=>i>0&&i<100&&s.lift>samples[i-1].lift&&s.lift>=samples[i+1].lift).length,1);
 assert.ok(travelPose('n',.95).lift<1e-10);assert.equal(travelPose('n',1).progress,1);
 assert.equal(poseFrame('move',.1),1);assert.equal(poseFrame('move',.5),2);assert.equal(poseFrame('move',1),0);
 assert.equal(poseFrame('capture',.85),3);assert.equal(poseFrame('move',.85),0);
 assert.equal(travelPose('p',.5).lift,0);assert.equal(travelPose('k',.5).lift,0);
});
test('Castling visual companions follow the single actual engine move for both sides',()=>{
 for(const [color,side,from,to,rf,rt]of [['w','k','e1','g1','h1','f1'],['w','q','e1','c1','a1','d1'],['b','k','e8','g8','h8','f8'],['b','q','e8','c8','a8','d8']]as const){
  const c=new Chess(`r3k2r/8/8/8/8/8/8/R3K2R ${color} KQkq - 0 1`),m=c.move({from,to});
  assert.ok(m.flags.includes(side));assert.deepEqual(moveActors(m),[{from,to,piece:'k'},{from:rf,to:rt,piece:'r'}]);assert.equal(c.get(rt)?.type,'r');assert.equal(c.get(to)?.type,'k');assert.equal(c.history().length,1);
 }
});
test('Captures, en passant and promotion remain one visual mover; AI tickets and Undo unchanged',()=>{
 const c=new Chess('4k3/P7/8/3pP3/8/8/8/4K3 w - d6 0 1'),ep=c.move('exd6');assert.equal(moveActors(ep).length,1);assert.equal(c.get('d5'),undefined);c.undo();c.move('a8=Q');assert.equal(c.get('a8')?.type,'q');assert.equal(moveActors(c.history({verbose:true})[0]).length,1);
 const g=new FullGame();g.play({from:'e2',to:'e4'});const t=g.request()!;g.cancel();assert.equal(g.accept(t,{from:'e7',to:'e5'}),null);g.undo();assert.equal(g.match.chess.history().length,0);
});
