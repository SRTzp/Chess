import test from 'node:test';
import assert from 'node:assert/strict';
import {attackBeat,attackTiming,captureSquare,weaponPaths} from '../chapter/src/attack-motion';
import {actorScale} from '../chapter/src/actor-scale';
import {Chess} from '../chapter/src/engine/chess';
test('Target persists through contact and the actual strike pose holds for a readable interval',()=>{
 for(const role of ['p','n','r','b','q','k']as const){
  assert.equal(attackBeat(role,479).victim,1);assert.equal(attackBeat(role,attackTiming.contact).phase,'contact');assert.equal(attackBeat(role,590).victim,1);assert.ok(attackBeat(role,660).victim>0);assert.equal(attackBeat(role,720).victim,0);
  assert.equal(attackBeat(role,350).pose,3);assert.equal(attackBeat(role,679).pose,3);assert.equal(attackBeat(role,680).pose,0);assert.equal(attackBeat(role,820).phase,'done');
  assert.ok(attackBeat(role,480).effect>0);assert.equal(attackBeat(role,820).effect,0);
 }
 assert.ok(attackTiming.recover-attackTiming.strike>=300);
});
test('Mounted strike lands with one leap; grounded attackers never jump; reduced cue has no travel animation',()=>{
 const samples=Array.from({length:83},(_,i)=>attackBeat('n',i*10));
 assert.ok(samples.every((p,i)=>!i||p.progress>=samples[i-1].progress));
 assert.equal(samples.filter((p,i)=>i>0&&i<82&&p.lift>samples[i-1].lift&&p.lift>=samples[i+1].lift).length,1);
 assert.ok(attackBeat('n',480).lift<1e-8);
 for(const role of ['p','r','b','q','k']as const)assert.equal(attackBeat(role,250).lift,0);
 for(const ms of [0,80,250,359])assert.deepEqual(attackBeat('n',ms,true),attackBeat('n',0,true));
 assert.equal(attackBeat('n',360,true).phase,'done');
});
test('Capture snapshots use the actual victim square for en passant and promote only one legal Pawn move',()=>{
 const c=new Chess('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1'),m=c.move('exd6');assert.equal(captureSquare(m),'d5');assert.equal(m.to,'d6');assert.equal(c.history().length,1);
 const p=new Chess('3k3r/6P1/8/8/8/8/8/7K w - - 0 1'),prom=p.move('gxh8=Q');assert.equal(captureSquare(prom),'h8');assert.equal(p.get('h8')?.type,'q');assert.equal(p.history().length,1);
 assert.equal(new Set(Object.values(weaponPaths)).size,6);
});
test('Pawn and mounted Knight keep one scale across poses with bounded cell occupancy',()=>{
 assert.ok(actorScale.p<actorScale.n);assert.ok(actorScale.n*110/128>actorScale.p);
 assert.ok(Object.values(actorScale).every(scale=>scale>0&&scale<=.98));
});
