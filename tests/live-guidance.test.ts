import test from 'node:test';
import assert from 'node:assert/strict';
import {Match,input} from '../chapter/src/engine/chess';
import {trials,trialReply} from '../chapter/src/learning/bank';
import {authorPlans,guidanceForPosition,validatePlans} from '../chapter/src/learning/choices';
import {freshJourney} from '../chapter/src/learning/microsteps';
import {beginAttempt,assistAttempt,commitAttempt} from '../chapter/src/learning/context-attempt';
import {restoreDraft} from '../chapter/src/learning/draft';

test('Pawn overshoot removes obsolete routes through commit, reply, Help and Resume; Undo rebuilds capped routes without erasing assistance',()=>{
 const t=trials.find(t=>t.id==='use-p-0')!,match=new Match(t.fen),j=freshJourney(),a=beginAttempt(j,t.id);assistAttempt(j,a,'adventure choices');
 const initial=guidanceForPosition(t,match.chess,j);assert.ok(initial.plans.some(p=>p.move.to==='c3'));match.beginRound();assert.ok(match.move({from:'c2',to:'c4'}));commitAttempt(a);assistAttempt(j,a,'retried plan');assert.deepEqual(guidanceForPosition(t,match.chess,j,true).plans,[]);
 const reply=trialReply(t,match.chess);if(reply)match.move(reply);const after=match.chess.fen();assert.deepEqual(guidanceForPosition(t,match.chess,j),{plans:[],recover:true});assistAttempt(j,a,'extra guidance');assert.deepEqual(guidanceForPosition(t,match.chess,j),{plans:[],recover:true});assert.equal(match.chess.fen(),after);
 const draft=restoreDraft(JSON.parse(JSON.stringify({version:1,role:'p',phase:'practice',trialId:t.id,match:match.save(),lessonFlow:true,attempt:a,support:true,shown:a.shown,novel:false,done:false,index:0})))!;assert.ok(draft);assert.deepEqual(guidanceForPosition(t,draft.match.chess,j),{plans:[],recover:true});assert.ok(draft.match.undoRound());const restored=guidanceForPosition(t,draft.match.chess,j);assert.deepEqual(restored,initial);assert.equal(a.support,true);assert.equal(a.firstCommit,false);assert.ok(restored.plans.length<=3);
});
test('Knight and tactical wrong alternatives expose only live legal mission candidates or a visible recovery state',()=>{
 let knight=0,tactic=0;
 for(const t of trials.filter(t=>t.skill==='n'||['fork','pin','team','threat'].includes(t.skill))){for(const plan of authorPlans(t).filter(p=>p.purpose==='explore')){
  const match=new Match(t.fen);match.beginRound();match.move(plan.move);const reply=trialReply(t,match.chess);if(reply)match.move(reply);const before=match.chess.fen(),g=guidanceForPosition(t,match.chess);assert.equal(match.chess.fen(),before);if(g.plans.length){assert.ok(validatePlans({...t,fen:before},g.plans),t.id);for(const p of g.plans)assert.equal(match.chess.get(p.move.from)?.color,'w');}else assert.equal(g.recover,true,t.id);
  assert.ok(match.undoRound());assert.deepEqual(guidanceForPosition(t,match.chess).plans,authorPlans(t));if(t.skill==='n')knight++;else tactic++;
 }}assert.ok(knight>0);assert.ok(tactic>0);
});
test('finished or animating missions and black turns never advertise stale candidate routes',()=>{
 const t=trials.find(t=>t.id==='use-p-0')!,m=new Match(t.fen);assert.deepEqual(guidanceForPosition(t,m.chess,undefined,true),{plans:[],recover:false});m.move({from:'c2',to:'c3'});assert.deepEqual(guidanceForPosition(t,m.chess).plans,[]);
});
