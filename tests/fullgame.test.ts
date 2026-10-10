import {test} from 'node:test';import assert from 'node:assert/strict';
import {Chess,bestMove,opponentTiers,type SearchStats} from '../chapter/src/engine/chess';
import {FullGame,restoreGames,legacyGame} from '../chapter/src/fullgame/model';
function choose(fen:string,tier:'gentle'|'steady'|'challenge'='gentle'){const c=new Chess(fen),before=c.fen(),history=c.history(),stats:SearchStats={nodes:0},move=bestMove(c,tier,stats);assert.equal(c.fen(),before);assert.deepEqual(c.history(),history);assert(stats.nodes<=opponentTiers[tier].nodes);if(move)assert(c.move(move));return{c,move,stats};}
test('gentle takes mate-in-one and answers check legally',()=>{
 const win=choose('7k/6pp/5Q2/8/8/8/8/K7 w - - 0 1');assert(win.c.isCheckmate());
 const defence=choose('4r2k/8/8/8/8/8/8/4K3 w - - 0 1');assert(defence.move);assert.equal(defence.c.attackers(defence.move!.to,'b').length,0);
});
test('gentle does not take a poisoned pawn with the queen; sensible recapture and promotion remain allowed',()=>{
 const poisoned=choose('7k/8/8/4p3/3p4/8/8/K2Q4 w - - 0 1');assert.notDeepEqual(poisoned.move,{from:'d1',to:'d4'});
 const recapture=choose('7k/8/8/8/8/8/4q3/K3R3 w - - 0 1');assert.equal(recapture.c.get('e2')?.type,'r');assert.equal(recapture.c.get('e2')?.color,'w');
 const promotion=choose('7k/2P5/8/8/8/8/7p/K7 w - - 0 1');assert(promotion.move?.promotion);assert.equal(promotion.c.get('c8')?.color,'w');
});
test('opening rewards centre/development, legal material trades; draw positions return no reply',()=>{
 const opening=choose(new Chess().fen());assert(['b1c3','g1f3','e2e4','d2d4','e2e3','d2d3'].includes(opening.move!.from+opening.move!.to),JSON.stringify(opening.move));
 for(const fen of ['7k/5Q2/6K1/8/8/8/8/8 b - - 0 1','7k/8/8/8/8/8/8/K7 w - - 0 1','7k/8/8/8/8/8/P7/K7 w - - 100 1'])assert.equal(bestMove(new Chess(fen),'gentle'),null);
 assert(opponentTiers.gentle.depth<opponentTiers.steady.depth&&opponentTiers.steady.depth<opponentTiers.challenge.depth);
});
test('full-game resume retains black turn and round history; stale reply cannot cross Undo/profile/reset',()=>{
 const g=new FullGame('steady');assert(g.play({from:'e2',to:'e4'}));const ticket=g.request()!;assert(ticket);const saved=g.save(),restored=FullGame.restore(saved)!;assert.equal(restored.match.chess.turn(),'b');assert.equal(restored.tier,'steady');assert(!restored.busy);
 g.undo();assert.equal(g.accept(ticket,{from:'e7',to:'e5'}),null);assert.equal(g.match.chess.history().length,0);
 const t=restored.request()!;assert(restored.accept(t,{from:'e7',to:'e5'}));assert.equal(restored.accept(t,{from:'g8',to:'f6'}),null);assert(restored.undo());assert.equal(restored.match.chess.history().length,0);
 const newGame=new FullGame();assert.equal(newGame.accept(ticket,{from:'e7',to:'e5'}),null);
 const records=restoreGames({version:1,profiles:{akin:{current:saved,previous:null},prin:{current:newGame.save(),previous:saved}}});assert.equal(FullGame.restore(records.profiles.akin!.current)!.match.chess.turn(),'b');assert.equal(FullGame.restore(records.profiles.prin!.current)!.match.chess.history().length,0);
 assert.equal(FullGame.restore({...saved,fen:new Chess().fen()}),null);assert.equal(FullGame.restore({...saved,tier:'Elo9999'}),null);assert.equal(FullGame.restore({...saved,match:{...saved.match,moves:[{from:'e2',to:'e7'}]}}),null);
 assert(legacyGame({mode:'game',tier:'challenge',match:saved.match}));assert(legacyGame({phase:'game',match:saved.match}));assert.equal(legacyGame({mode:'lesson',match:saved.match}),null);
});
test('replayed full-game history preserves repetition rather than loading FEN only',()=>{
 const g=new FullGame();for(let i=0;i<2;i++){assert(g.play({from:'g1',to:'f3'}));let t=g.request()!;assert(g.accept(t,{from:'g8',to:'f6'}));assert(g.play({from:'f3',to:'g1'}));t=g.request()!;assert(g.accept(t,{from:'f6',to:'g8'}));}assert(g.match.chess.isThreefoldRepetition());assert(FullGame.restore(g.save())!.match.chess.isThreefoldRepetition());assert.equal(g.request(),null);assert(g.undo());assert(!g.match.chess.isThreefoldRepetition());
});
test('gentle prevents an immediate mate threat rather than blindly improving material',()=>{
 const fen='7k/8/3b4/8/7q/8/5PPP/5RK1 w - - 0 1';const threat=new Chess(fen.replace(' w ',' b '));assert(threat.moves({verbose:true}).some(m=>m.san.endsWith('#')));const defence=choose(fen);assert(!defence.c.moves({verbose:true}).some(m=>m.san.endsWith('#')),JSON.stringify(defence.move));
});
test('gentle attends to an already hanging queen, without treating every capture as forbidden',()=>{
 const defended=choose('3rk3/8/8/8/3Q4/8/P7/K7 w - - 0 1');assert.equal(defended.move?.from,'d4');assert.notEqual(defended.move?.to,'d8');const reply=bestMove(defended.c,'gentle');if(reply)defended.c.move(reply);assert(defended.c.board().flat().some(p=>p?.color==='w'&&p.type==='q'));
 const trade=choose('4k3/8/8/8/3q4/8/8/K2Q4 w - - 0 1');assert.equal(trade.c.get('d4')?.color,'w');assert.equal(trade.move?.from,'d1');
});
