const assert=require('node:assert/strict');
const C=require('../dist/game.js');
const paths=[
[['d2','d3']],[['c3','c4'],['c4','c5'],['c5','c6']],[['e2','e4']],[['d4','c5']],[['b7','b8'],['b8','h8']],
[['b1','c3']],[['b1','c3']],[['b1','c3'],['c3','e4'],['e4','f6']],[['d4','f5']],[['d4','e6']],
[['c1','f4']],[['f1','c4'],['c4','f7']],[['c1','b2'],['b2','e5'],['e5','f4'],['f4','g5']],[['b2','f6']],[['c1','f4'],['f4','c7']],
[['a1','a6']],[['a1','a5'],['a5','f5']],[['a1','b1'],['b1','b5'],['b5','a5']],[['a1','a5'],['a5','f5']],[['e1','g1']],
[['e1','d1']],[['d1','g4'],['g4','g7']],[['g6','g7']],[['a7','a8']],[['b1','b8']]
];
paths.forEach((path,i)=>{let b=C.clone(C.levels[i].pieces),targets=[...C.levels[i].targets];for(const[from,to]of path){assert(C.moves(b,C.at(b,from)).includes(to),`Level ${i+1}: illegal ${from}-${to}`);b=C.apply(b,from,to);targets=targets.filter(t=>t!==to);}const l=C.levels[i];if(l.mode==='collect')assert.equal(targets.length,0);if(l.mode==='capture')assert(!b.some(p=>p.c==='b'&&p.t!=='K'));if(l.mode==='mate')assert(C.mate(b,'b'),`Level ${i+1} no mate`);if(l.mode==='castle'){assert.equal(C.at(b,'g1').t,'K');assert.equal(C.at(b,'f1').t,'R');}if(l.mode==='fork'){const n=b.find(p=>p.t==='N');assert.equal(b.filter(p=>p.c==='b'&&C.attacks(b,n,p.at)).length,2);}if(l.oneMove)assert.equal(path.length,1);});
const p=(t,at,c='w',moved=false)=>({t,at,c,moved});
let b=[p('P','e2'),p('P','e3','b')];assert.deepEqual(C.moves(b,b[0]),[]);
b=[p('P','e4'),p('P','d5','b')];assert(C.moves(b,b[0]).includes('d5'));assert(!C.moves(b,b[0]).includes('f5'));assert(!C.moves(b,b[0]).includes('e3'));
b=[p('R','a1'),p('P','a3')];assert(!C.moves(b,b[0]).includes('a4'));
b=[p('K','e1'),p('R','h1'),p('K','a8','b'),p('R','f8','b')];assert(!C.moves(b,b[0]).includes('g1'));
b=[p('K','e1'),p('R','h1','w',true),p('K','a8','b')];assert(!C.moves(b,b[0]).includes('g1'));
b=[p('K','e1'),p('K','e3','b')];assert(!C.moves(b,b[0]).includes('e2'));
b=[p('K','f7'),p('Q','g6'),p('K','h8','b')];assert(!C.check(b,'b'));assert(!C.mate(b,'b'));
b=[p('K','e1'),p('R','e2'),p('R','e8','b'),p('K','a8','b')];assert(!C.moves(b,b[1]).includes('d2'));
console.log('PASS: all 25 lesson solutions, 3 actual checkmates, pawn blocking/capture, rook blocking, castling attacks/moved rook, king adjacency, stalemate, pinned piece.');
