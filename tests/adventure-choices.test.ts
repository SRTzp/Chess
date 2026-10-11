import test from 'node:test';
import assert from 'node:assert/strict';
import {authorPlans,validatePlans,PlanPreview,shouldGuide} from '../chapter/src/learning/choices';
import {trials,trialMet} from '../chapter/src/learning/bank';
import {Match,Chess} from '../chapter/src/engine/chess';
import {Ledger,criteria} from '../chapter/src/learning/ledger';
import {chapterPlans} from '../chapter/src/chapter-plans';
import {initial,legal,same,copy} from '../chapter/src/rules';

test('every authored mission offers at most three legal routes, with accurate mission metadata and no board mutation',()=>{
 for(const trial of trials){const before=new Chess(trial.fen).fen(),plans=authorPlans(trial);assert.ok(validatePlans(trial,plans),trial.id);assert.equal(new Chess(trial.fen).fen(),before);assert.ok(plans.length<=3);for(const p of plans){const after=new Chess(trial.fen);after.move(p.move);assert.equal(p.purpose==='mission',trialMet(trial,p.move,after),trial.id);}}
});
test('strategy keeps multiple good plans, rejects forged metadata and never creates illegal moves to fill choices',()=>{
 const t=trials.find(t=>t.id==='team-centre')!,plans=authorPlans(t);assert.equal(plans.filter(p=>p.purpose==='mission').length,2);for(const p of plans.filter(p=>p.purpose==='mission')){const c=new Chess(t.fen);c.move(p.move);assert.ok(trialMet(t,p.move,c));}assert.equal(validatePlans(t,[{move:{from:'e2',to:'e5'},icon:'↗',purpose:'mission'}]),false);
 const pawn=trials.find(t=>t.id==='use-p-0')!;assert.ok(authorPlans(pawn).every(p=>new Chess(pawn.fen).moves({verbose:true}).some(m=>m.from===p.move.from&&m.to===p.move.to)));
});
test('preview, retarget and cancellation do not commit; explicit second tap commits once; Undo returns legal state',()=>{
 const match=new Match(),preview=new PlanPreview<{from:'e2';to:'e4'}>(),start=match.chess.fen();const move={from:'e2',to:'e4'} as const;
 assert.equal(preview.choose('e4',move),'preview');assert.equal(match.chess.fen(),start);preview.cancel();assert.equal(preview.value,null);assert.equal(preview.choose('e4',move),'preview');assert.equal(match.chess.fen(),start);assert.equal(preview.choose('e4',move),'confirm');match.beginRound();assert.ok(match.move(move));preview.cancel();assert.ok(match.undoRound());assert.equal(match.chess.fen(),start);assert.equal(preview.target,null);
});
test('choice-assisted victories cannot become novel/master or delayed review evidence; assistance can fade without disturbing separate profiles',()=>{
 const ledger=new Ledger();for(const t of trials.filter(t=>t.skill==='n')){ledger.recordSupport('akin','n',['adventure choices']);ledger.credit('akin','n',t.id,true,true,true);}
 const e=ledger.evidence('akin','n');assert.equal(e.owned,'guardian');assert.deepEqual(e.novel,[]);assert.equal(shouldGuide('practice',true,2),false);assert.equal(shouldGuide('practice',false,2),true);assert.equal(shouldGuide('independent',true,0),false);assert.equal(shouldGuide('review',true,0),false);assert.equal(shouldGuide('game',false,0),false);
 const now=e.reviewAt+criteria.reviewDelay;ledger.credit('akin','n','use-n-0',false,true,true,true,now);assert.deepEqual(e.independentReviews??[],[]);ledger.credit('akin','n','use-n-0',false,false,true,true,now);assert.equal(e.independentReviews?.length,1);assert.equal(ledger.evidence('prin','n').owned,'apprentice');
});
test('chapter routes respect each teaching board and never mutate state, including boards with fewer than three routes',()=>{
 for(let i=0;i<12;i++){const state=initial(i),before=copy(state);for(const piece of state.pieces.filter(p=>p.side==='hero')){const routes=chapterPlans(state,piece);assert.ok(routes.length<=3);assert.ok(routes.every(to=>legal(state,piece).some(p=>same(p,to))));assert.deepEqual(state,before);} }
});
import {microTrials,microConfig,stepPool,checkStep,freshJourney,recordJourney,nextJourneyStep,restoreJourney} from '../chapter/src/learning/microsteps';
import {restoreJournal} from '../chapter/src/learning/ledger';
import {roles} from '../chapter/src/learning/ledger';
test('microstep pools transfer real placements, include every core step, and respect Pawn direction',()=>{
 assert.equal(microTrials.length,37);for(const role of roles){for(let step=0;step<=checkStep(role);step++){const pool=stepPool(role,step);assert.equal(new Set(pool).size,2);const boards=pool.map(id=>trials.find(t=>t.id===id)!);assert.ok(boards.every(Boolean));assert.notEqual(boards[0].fen,boards[1].fen);for(const t of boards)assert.ok(validatePlans(t,authorPlans(t)));}}
 for(const t of microTrials.filter(t=>t.skill==='p'))for(const m of t.accepted)assert.ok(Number(m.to[1])>Number(m.from[1]));
});
test('readiness holds for guesses/repeated single placement, advances on varied first choices, and recovers with practice without claiming independence',()=>{
 const j=freshJourney();assert.equal(recordJourney(j,'a',false,true,true),false);assert.equal(recordJourney(j,'a',true,false,false),false);assert.equal(recordJourney(j,'a',true,false,false),false);assert.equal(recordJourney(j,'a',true,false,false),false);assert.equal(recordJourney(j,'b',true,false,false),true);assert.equal(j.check,false);nextJourneyStep(j);assert.equal(j.step,1);assert.equal(recordJourney(j,'c',true,true,false),false);assert.equal(recordJourney(j,'d',true,true,false),true);
 j.step=4;j.check=false;assert.equal(recordJourney(j,'check-a',true,true,false),false);assert.equal(recordJourney(j,'check-a',true,false,true),false);assert.equal(recordJourney(j,'check-b',true,true,true),false);assert.equal(recordJourney(j,'check-c',true,true,true),true);assert.equal(j.check,true);assert.equal(microConfig.independentChecks,2);
});
test('microsteps resume per friend/profile while old rewards survive and malformed optional progress cannot wipe gear',()=>{
 const ledger=new Ledger();ledger.preserve('akin','p','master');const j=ledger.journey('akin','n');recordJourney(j,'use-n-0',true,true,false);assert.equal(ledger.journey('prin','n').step,0);const restored=restoreJournal(JSON.parse(JSON.stringify(ledger.data)));assert.deepEqual(restored.profiles.akin.journeys?.n,j);assert.equal(restored.profiles.akin.skills.p?.owned,'master');const raw=JSON.parse(JSON.stringify(ledger.data));raw.profiles.akin.journeys.n={step:999};const safe=restoreJournal(raw);assert.equal(safe.profiles.akin.skills.p?.owned,'master');assert.equal(safe.profiles.akin.journeys?.n,undefined);assert.equal(restoreJourney({step:0}),null);
});
import {clearingSquares} from '../chapter/src/learning/clearing';
test('movement clearings keep mission/candidate squares and real coordinates; tactical/strategy boards stay whole',()=>{
 for(const t of trials){const plans=authorPlans(t),c=new Chess(t.fen),visible=clearingSquares(t,c,plans,true);assert.equal(Math.sqrt(visible.length)%1,0);for(const p of plans){assert.ok(visible.includes(p.move.from),t.id);assert.ok(visible.includes(p.move.to),t.id);}if(!roles.includes(t.skill as any))assert.equal(visible.length,64);}
 const t=trials.find(t=>t.id==='micro-p-0')!;assert.equal(clearingSquares(t,new Chess(t.fen),authorPlans(t),false).length,16);
});
test('tactic/strategy missions repeat varied guided contexts before an unaided check instead of one practice then skipping ahead',()=>{
 for(const skill of ['fork','pin','team','prevent'] as const){const ids=trials.filter(t=>t.skill===skill).map(t=>t.id);assert.equal(checkStep(skill),1);assert.equal(stepPool(skill,0,ids).length,2);assert.equal(stepPool(skill,1,ids).length,2);const j=freshJourney();assert.equal(recordJourney(j,ids[0],true,true,false,checkStep(skill)),false);assert.equal(recordJourney(j,ids[1],true,true,false,checkStep(skill)),true);nextJourneyStep(j);assert.equal(recordJourney(j,ids[2],true,true,false,checkStep(skill)),false);assert.equal(recordJourney(j,ids[3],true,true,true,checkStep(skill)),false);assert.equal(recordJourney(j,ids[2],true,true,true,checkStep(skill)),true);}
});
import {chapterPracticeRole} from '../chapter/src/chapter-plans';
test('story introductions route into appropriate short practice while mixed/full-game bridge remains accessible',()=>{for(const level of [0,2,4])assert.equal(chapterPracticeRole(level),'p');for(const level of [7,8])assert.equal(chapterPracticeRole(level),'n');assert.equal(chapterPracticeRole(10),'fork');assert.equal(chapterPracticeRole(11),null);assert.equal(chapterPracticeRole(6),null);});
