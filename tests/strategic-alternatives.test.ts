import {test} from 'node:test';import assert from 'node:assert/strict';import {Session} from '../chapter/src/engine/session';import {lessons} from '../chapter/src/engine/lessons';
test('authored developing alternatives complete the same plan; taking guarded pawn does not',()=>{
 const l=lessons.find(l=>l.id==='opening-mini-center')!;for(const m of l.goal.accepted!){const s=new Session(l);assert(s.play(l.setup!));assert(s.reply());assert(s.play(m),JSON.stringify(m));assert(s.finished);assert(Session.restore(s.save()));}
 const s=new Session(l);s.play(l.setup!);s.reply();assert(s.play({from:'f3',to:'e5'}));assert(!s.finished);
});
test('independent safe king accepts authored safe steps but not an unrelated pawn move',()=>{
 const l=lessons.find(l=>l.id==='king-safe')!;for(const m of l.goal.accepted!){const s=new Session(l);assert(s.play(m));assert(s.finished);}
 const s=new Session(l);assert(s.play({from:'h2',to:'h3'}));assert(!s.finished);assert.equal(s.play({from:'d3',to:'d4'}),null);
});
test('defence is a safe legal recapture outcome; an exposed defender cannot finish it',()=>{
 const l=lessons.find(l=>l.id==='rook-guard')!;const good=new Session(l);assert(good.play({from:'h1',to:'a1'}));assert(good.finished);
 const bad=new Session({...l,fen:'r6k/8/8/8/8/7R/P3K3/8 w - - 0 1'});assert(bad.play({from:'h3',to:'a3'}));assert.equal(bad.finished,false);
 const bishop=new Session(lessons.find(l=>l.id==='bishop-cover')!);assert(bishop.play({from:'b2',to:'e5'}));assert(bishop.finished);
});
