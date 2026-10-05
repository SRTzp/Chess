import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from '../chapter/src/engine/chess.ts';
import {teachingPath,algebraicPoint,DemoGate} from '../chapter/src/visual-path.ts';
import {initial,legal,kind,type Piece} from '../chapter/src/rules.ts';

test('every legal knight offset has two measuring segments and one landing',()=>{
 for(let x=0;x<8;x++)for(let y=0;y<8;y++)for(const [dx,dy] of [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]]){
  const to={x:x+dx,y:y+dy};if(to.x<0||to.x>7||to.y<0||to.y>7)continue;
  const path=teachingPath({from:{x,y},to,piece:'n'});assert(path);assert.equal(path.kind,'jump');assert.equal(path.points.length,3);
  assert.deepEqual(path.points[0],{x,y});assert.deepEqual(path.points[2],to);
  const [a,b,c]=path.points;assert.equal(Math.abs(b.x-a.x)+Math.abs(b.y-a.y),2);assert.equal(Math.abs(c.x-b.x)+Math.abs(c.y-b.y),1);
 }
 assert.equal(teachingPath({from:{x:1,y:7},to:{x:1,y:5},piece:'n'}),null);
 const blocked=initial(8),knight=blocked.pieces.find(p=>kind(p)==='knight')!;
 assert(blocked.pieces.some(p=>p.side==='friend'&&p.x===1&&p.y===6),'friend sits between knight and goal');
 assert(legal(blocked,knight).some(p=>p.x===0&&p.y===5),'the knight still lands past the friend');
});

test('sliding rays stop at blockers; pawn motion and capture use distinct shapes',()=>{
 const c=new Chess('4k3/8/8/8/8/3p4/8/R2QK3 w Q - 0 1');
 assert(c.moves({square:'a1',verbose:true}).some(m=>m.to==='a3'));
 assert(!c.moves({square:'d1',verbose:true}).some(m=>m.to==='d4'),'queen cannot pass pawn at d3');
 const bishop=new Chess('7k/8/8/8/8/8/3P4/K1B5 w - - 0 1');
 assert(bishop.moves({square:'c1',verbose:true}).some(m=>m.to==='b2'));
 assert(!bishop.moves({square:'c1',verbose:true}).some(m=>m.to==='e3'),'bishop cannot pass its own obstacle in this fixture');
 const straight=teachingPath({from:{x:2,y:4},to:{x:2,y:3},piece:'p'}),capture=teachingPath({from:{x:2,y:4},to:{x:3,y:3},piece:'p',capture:true});
 assert.equal(straight?.kind,'straight');assert.equal(capture?.kind,'capture');assert.equal(teachingPath({from:{x:2,y:4},to:{x:3,y:3},piece:'p'}),null);
 assert.deepEqual(algebraicPoint('a8'),{x:0,y:0});assert.deepEqual(algebraicPoint('h1'),{x:7,y:7});
});

test('king path derives from legal chess moves and demo cancellation cannot complete later',async()=>{
 const checked=new Chess('4r2k/8/8/8/8/8/8/4K3 w - - 0 1');assert(!checked.moves({square:'e1',verbose:true}).some(m=>m.to==='e2'));
 assert.equal(teachingPath({from:{x:4,y:7},to:{x:6,y:7},piece:'k'})?.kind,'castle');
 const gate=new DemoGate(),old=gate.wait(30);gate.cancel();assert.equal(await old,false);const fresh=gate.wait(1);assert.equal(await fresh,true);
 const model=initial(7),before=structuredClone(model),piece=model.pieces.find(p=>p.side==='hero') as Piece;
 assert(teachingPath({from:piece,to:{x:2,y:5},piece:'n'}));assert.deepEqual(model,before,'preview calculations never mutate the board');
});
