import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess,Match,bestMove,status,type InputMove} from '../chapter/src/engine/chess.ts';
import {lessons} from '../chapter/src/engine/lessons.ts';
import {Session} from '../chapter/src/engine/session.ts';
test('all preview fixtures are legal, have measured ladder metadata, and goals can be completed',()=>{
 for(const lesson of lessons){const s=new Session(lesson);assert.equal(s.chess.fen(),lesson.fen,lesson.id);assert.equal(s.chess.turn(),'w',lesson.id);assert.equal(s.chess.isGameOver(),false,lesson.id);assert.equal(s.chess.board().flat().filter(Boolean).length,lesson.pieceCount,lesson.id);assert.equal(s.chess.moves().length,lesson.choices,lesson.id);
  if(lesson.setup){assert(s.play(lesson.setup),lesson.id+' setup');assert(s.reply(),lesson.id+' reply');assert.equal(s.finished,false,lesson.id);}assert(s.play(lesson.goal.move??{from:'a7',to:'a8',promotion:'q'}),lesson.id+' goal');assert.equal(s.finished,true,lesson.id);
 }
});
test('complete round undo and save restore preserve turn boundaries',()=>{const s=new Session(lessons.find(l=>l.id==='guard-reply')!);const before=s.chess.fen();assert(s.play(s.lesson!.setup!));assert(s.reply());const saved=Session.restore(s.save());assert(saved);assert.equal(saved.chess.fen(),s.chess.fen());assert(saved.undo());assert.equal(saved.chess.fen(),before);assert.equal(saved.turn,'w');});
test('full-game opening, promotion choices, en passant, castling and king safety use legal chess rules',()=>{
 const game=new Session();assert(game.play({from:'e2',to:'e4'}));assert(game.reply(bestMove(game.chess,'gentle')!));assert.equal(game.turn,'w');
 const promo=new Chess('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');assert.equal(promo.moves({square:'a7',verbose:true}).filter(x=>x.to==='a8').length,4);
 const ep=new Chess('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');assert(ep.move({from:'e5',to:'d6'}).flags.includes('e'));
 const castle=new Chess('4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1');assert(castle.move({from:'e1',to:'g1'}).flags.includes('k'));
 const checked=new Chess('4r1k1/8/8/8/8/8/8/4K3 w - - 0 1');assert.equal(checked.isCheck(),true);assert(!checked.moves({square:'e1'}).includes('Ke2'));
});
test('draw types and match save reject corrupt records',()=>{assert.equal(status(new Chess('7k/8/8/8/8/8/8/K7 w - - 0 1')),'insufficient');const m=new Match();m.beginRound();assert(m.move({from:'g1',to:'f3'}));assert(m.move({from:'g8',to:'f6'}));const save=m.save();assert(Match.restore(save));assert.equal(Match.restore({...save,rounds:[999]}),null);assert.equal(Match.restore({...save,moves:[{from:'e2',to:'e5'} as InputMove]}),null);});
test('checkmate, stalemate, and threefold repetition are distinct results',()=>{assert.equal(status(new Chess('7k/6Q1/6K1/8/8/8/8/8 b - - 0 1')),'checkmate');assert.equal(status(new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')),'stalemate');const c=new Chess();for(let i=0;i<2;i++)for(const m of ['Nf3','Nf6','Ng1','Ng8'])c.move(m);assert.equal(status(c),'repetition');});
test('opponent tiers return legal moves and do not mutate the search position',()=>{for(const tier of ['gentle','steady','challenge'] as const){const c=new Chess('4k3/8/8/8/8/8/4p3/4K2R b K - 0 1');const fen=c.fen();const move=bestMove(c,tier);assert(move);assert.equal(c.fen(),fen);assert(c.move(move));}});
