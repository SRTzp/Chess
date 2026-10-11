import test from 'node:test';
import assert from 'node:assert/strict';
import {beginAttempt,assistAttempt,commitAttempt,completeAttempt,restoreAttempt} from '../chapter/src/learning/context-attempt';
import {freshJourney,microConfig,checkStep,stepPool,journeyReady,nextContextId,restoreJourney} from '../chapter/src/learning/microsteps';
import {Ledger,restoreJournal} from '../chapter/src/learning/ledger';
import {Match,input} from '../chapter/src/engine/chess';
import {trials,trialMet,trialReply} from '../chapter/src/learning/bank';
import {restoreDraft} from '../chapter/src/learning/draft';
import {plansForMission,authorPlans} from '../chapter/src/learning/choices';
const now=2000000000000;
const trial=(id:string)=>trials.find(t=>t.id===id)!;
function playMission(id:string){const t=trial(id),m=new Match(t.fen);m.beginRound();const move=m.move(t.accepted[0]);assert.ok(move,id);assert.ok(trialMet(t,t.accepted[0],m.chess));const reply=trialReply(t,m.chess);if(reply)m.move(reply);assert.equal(m.chess.get(t.accepted[0].to)?.color,'w');return m;}

test('wrong legal commit survives journal+draft restore and immediate restart cannot become a first-choice/unaided check',()=>{
 const l=new Ledger(),j=l.journey('akin','n');j.step=checkStep('n');const t=trial('use-n-3'),match=new Match(t.fen),a=beginAttempt(j,t.id,now);
 match.beginRound();const wrong=match.chess.moves({square:'f3',verbose:true}).find(m=>m.to!=='e5')!;assert.ok(match.move(input(wrong)));assert.equal(trialMet(t,input(wrong),match.chess),false);commitAttempt(a);assistAttempt(j,a,'retried plan',now);
 const raw={version:1,role:'n',phase:'independent',trialId:t.id,match:match.save(),support:a.support,shown:a.shown,firstCommit:a.firstCommit,attempt:a,novel:false,done:false,index:3,lessonFlow:true};
 const restored=restoreDraft(JSON.parse(JSON.stringify(raw)))!;assert.ok(restored);const journal=restoreJournal(JSON.parse(JSON.stringify(l.data))),rj=journal.profiles.akin.journeys!.n!;
 const resumed=restoreAttempt(restored.attempt,rj,t.id,restored.match.chess.history().length,false,restored,now+1);assert.equal(resumed.committedFirst,false);
 const restarted=beginAttempt(rj,t.id,now+2);assert.equal(restarted.firstCommit,false);assert.equal(restarted.support,true);const correct=playMission(t.id);commitAttempt(restarted);assert.equal(completeAttempt(rj,restarted,correct.chess.get(t.accepted[0].to)?.color==='w',checkStep('n')),false);assert.deepEqual(rj.checks,[]);
});

test('Help/Watch all check contexts cannot be laundered by restart/resume; later fresh unaided attempts recover two distinct checks without novelty',()=>{
 const l=new Ledger(),j=l.journey('akin','n');j.step=checkStep('n');const pool=stepPool('n',j.step);
 for(const id of pool){const a=beginAttempt(j,id,now);l.expose('akin',trial(id).fen);assistAttempt(j,a,'extra guidance',now);assistAttempt(j,a,'path demonstration',now);commitAttempt(a);playMission(id);assert.equal(completeAttempt(j,a,true,checkStep('n')),false);l.credit('akin','n',id,true,a.support,true);}
 assert.equal(l.evidence('akin','n').owned,'guardian');assert.deepEqual(l.evidence('akin','n').novel,[]);
 for(const id of pool){const a=beginAttempt(j,id,now+1);assert.equal(a.firstCommit,false);assert.equal(a.support,true);const until=j.contexts![id].unaidedBlockedUntil;const restored=restoreAttempt(JSON.parse(JSON.stringify(a)),j,id,0,false,a,now+microConfig.contextRecoveryDelay+1);assert.equal(restored.support,true,'waiting with an answer open does not launder the attempt');assert.equal(j.contexts![id].unaidedBlockedUntil,until,'resume alone cannot move recovery deadline');}
 const later=now+microConfig.contextRecoveryDelay+2,firstId=nextContextId(j,pool,true,later),first=beginAttempt(j,firstId,later);assert.equal(first.support,false);assert.equal(first.firstCommit,true);playMission(firstId);commitAttempt(first);assert.equal(completeAttempt(j,first,true,checkStep('n')),false);assert.equal(completeAttempt(j,first,true,checkStep('n')),false);assert.equal(j.checks!.length,1);
 const secondId=nextContextId(j,pool,true,later);assert.notEqual(secondId,firstId);const second=beginAttempt(j,secondId,later);playMission(secondId);commitAttempt(second);assert.equal(completeAttempt(j,second,true,checkStep('n')),true);assert.equal(journeyReady(j,checkStep('n')),true);assert.equal(new Set(j.checks).size,2);assert.equal(l.expose('akin',trial(secondId).fen),false);assert.equal(l.evidence('akin','n').owned,'guardian');
});

test('mid-animation clean commitment is persisted and completed once; incomplete legacy/profile resume cannot inherit another commitment',()=>{
 const l=new Ledger(),j=l.journey('akin','n'),t=trial('use-n-0'),a=beginAttempt(j,t.id,now),m=new Match(t.fen);assistAttempt(j,a,'adventure choices',now);m.beginRound();assert.ok(m.move(t.accepted[0]));commitAttempt(a);
 const draft={version:1,role:'n',phase:'practice',trialId:t.id,match:m.save(),attempt:a,support:a.support,shown:a.shown,firstCommit:a.firstCommit,novel:true,done:false,index:0,lessonFlow:true};const restored=restoreDraft(JSON.parse(JSON.stringify(draft)))!;assert.ok(restored);const resumed=restoreAttempt(restored.attempt,j,t.id,1,false,restored,now+1);assert.equal(resumed.committedFirst,true);const reply=trialReply(t,restored.match.chess);if(reply)restored.match.move(reply);assert.equal(completeAttempt(j,resumed,true,checkStep('n')),false);assert.deepEqual(j.first,[t.id]);assert.equal(j.practices,1);
 const again=restoreAttempt(JSON.parse(JSON.stringify(resumed)),j,t.id,2,true,resumed,now+2);completeAttempt(j,again,true,checkStep('n'));assert.equal(j.practices,1,'no duplicate completion counter on resumed/settled animation');
 const prin=l.journey('prin','n');prin.step=checkStep('n');const legacy=restoreAttempt(undefined,prin,t.id,1,false,{support:false,shown:[],firstCommit:false},now+2);assert.equal(legacy.committedFirst,false);assert.equal(completeAttempt(prin,legacy,true,checkStep('n')),false);assert.deepEqual(prin.checks,[]);assert.deepEqual(j.first,[t.id]);
});

test('Undo keeps acquired progress and immediate replay in practice; later clean context can recover without resetting rewards',()=>{
 const l=new Ledger(),j=l.journey('akin','n');l.preserve('akin','n','master');j.step=checkStep('n');const id='use-n-3',a=beginAttempt(j,id,now),match=playMission(id);commitAttempt(a);assert.equal(completeAttempt(j,a,true,checkStep('n')),false);assistAttempt(j,a,'Undo used',now);assert.ok(match.undoRound());assert.equal(match.chess.fen(),trial(id).fen);const immediate=beginAttempt(j,id,now+1);assert.equal(immediate.firstCommit,false);assert.equal(immediate.support,true);assert.deepEqual(j.checks,[id]);assert.equal(l.evidence('akin','n').owned,'master');const later=beginAttempt(j,id,now+microConfig.contextRecoveryDelay+1);assert.equal(later.support,false);assert.equal(later.firstCommit,true);
});

test('incomplete two-choice draft uses the same authoring cap after real journal/draft restore; old one-check boolean cannot bypass two-check threshold',()=>{
 const l=new Ledger(),j=l.journey('akin','n');j.step=3;const t=trial('micro-n-4');assert.equal(authorPlans(t).length,3);const before=plansForMission(t,j);assert.equal(before.length,2);const a=beginAttempt(j,t.id,now);assistAttempt(j,a,'adventure choices',now);
 const raw={version:1,role:'n',phase:'practice',trialId:t.id,match:new Match(t.fen).save(),attempt:a,support:a.support,shown:a.shown,firstCommit:a.firstCommit,novel:true,done:false,index:8,lessonFlow:true};const r=restoreDraft(JSON.parse(JSON.stringify(raw)))!,jr=restoreJournal(JSON.parse(JSON.stringify(l.data)));assert.equal(r.done,false);assert.deepEqual(plansForMission(r.trial,jr.profiles.akin.journeys!.n),before);
 const old=restoreJourney({...freshJourney(),step:4,check:true,checks:['use-n-3']})!;assert.equal(old.check,false);assert.equal(journeyReady(old,4),false);const finished=restoreJourney({...old,step:5})!;assert.equal(finished.step,5,'existing completed progression is retained, not rewound');
});

test('Pawn owns two distinct reserved check contexts; neither was consumed by its guided microstep pools',()=>{
 const guided=new Set(Array.from({length:checkStep('p')},(_,step)=>stepPool('p',step)).flat()),checks=stepPool('p',checkStep('p'));assert.equal(checks.length,2);assert.equal(new Set(checks).size,2);for(const id of checks){assert.equal(guided.has(id),false,id);playMission(id);}assert.equal(microConfig.independentChecks,2);
});
