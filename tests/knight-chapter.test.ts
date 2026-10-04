import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ChapterGame,initial,legal,solution,same,forkTargets,validState,kind,threats} from '../chapter/src/rules';
test('all six knight chapter lessons have safe winning routes under actual enemy replies',()=>{
 for(let level=6;level<12;level++){
  const game=new ChapterGame(level),path=solution(game.state);assert.ok(path,`level ${level}`);
  for(const move of path){assert.ok(game.move(move));game.reply();assert.notEqual(game.state.status,'lost');}
  assert.equal(game.state.status,'won');
 }
});
test('knight jumps exactly in an L, ignores intervening pieces, and cannot land on a friend',()=>{
 const game=new ChapterGame(8),knight=game.state.pieces[0],moves=legal(game.state,knight);
 assert.ok(moves.some(p=>same(p,{x:0,y:5})));
 assert.ok(!moves.some(p=>same(p,{x:2,y:5})));
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){
  const s=initial(7);Object.assign(s.pieces[0],{x,y});
  for(const q of legal(s,s.pieces[0]))assert.deepEqual([Math.abs(q.x-x),Math.abs(q.y-y)].sort(),[1,2]);
 }
});
test('rook threat stops at blockers; a legal unsafe knight jump is captured and undo restores it',()=>{
 const game=new ChapterGame(9),before=game.snapshot;
 assert.ok(game.move({id:'n',to:{x:3,y:6}}));assert.equal(game.reply()?.captured?.id,'n');assert.equal(game.state.status,'lost');
 assert.ok(game.undo());assert.deepEqual(game.state,before);
 game.state.pieces.push({id:'block',side:'friend',x:3,y:5,moved:true});
 assert.ok(threats(game.state).some(q=>same(q,{x:3,y:5})));
 assert.ok(!threats(game.state).some(q=>same(q,{x:3,y:6})));
});
test('fork threatens two rooks but captures neither until one legal enemy reply and a second player move',()=>{
 const game=new ChapterGame(10),before=game.snapshot;
 const fork=game.move({id:'n',to:{x:3,y:2}});assert.ok(fork);assert.equal(fork.captured,undefined);
 assert.equal(game.state.status,'playing');assert.equal(game.state.forked,true);
 assert.equal(forkTargets(game.state,game.state.pieces.find(p=>kind(p)==='knight')!).length,2);
 const reply=game.reply();assert.deepEqual(reply?.to,{x:1,y:0});assert.equal(reply?.id,'r1');
 assert.equal(game.state.pieces.filter(p=>p.side==='enemy').length,2);
 assert.ok(validState(JSON.parse(JSON.stringify(game.state)),10));
 assert.equal(game.move({id:'n',to:{x:5,y:1}})?.captured?.id,'r2');assert.equal(game.state.status,'won');
 assert.ok(game.undo());assert.equal(game.state.forked,true);assert.ok(game.undo());assert.deepEqual(game.state,before);
});
test('mixed challenge requires helping the pawn before moving the knight and does not end after the first capture',()=>{
 const wrong=new ChapterGame(11);wrong.move({id:'n',to:{x:2,y:5}});wrong.reply();assert.equal(wrong.state.status,'lost');
 const game=new ChapterGame(11);game.move({id:'a',to:{x:5,y:3}});game.reply();assert.equal(game.state.status,'playing');
 game.move({id:'n',to:{x:2,y:5}});assert.equal(game.state.status,'won');
});
test('old pawn saves remain valid; knight saves reject changed piece types and off-board pieces',()=>{
 assert.ok(validState(initial(5),5));assert.ok(validState(initial(11),11));
 const s=initial(7);s.pieces[0].kind='rook';assert.equal(validState(s,7),false);
 s.pieces[0].kind='knight';s.pieces[0].x=8;assert.equal(validState(s,7),false);
});
