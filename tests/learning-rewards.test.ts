import {test} from 'node:test';import assert from 'node:assert/strict';
import {lessons} from '../chapter/src/engine/lessons';
import {Session} from '../chapter/src/engine/session';
import {freshProgress,recordLessonCompletion,earnedBadges,restoreProgress} from '../chapter/src/engine/campaign';
import {forestTier} from '../chapter/src/forest-adventure';
import {lessonAchievement} from '../chapter/src/engine/achievement';
const lesson=(id:string)=>lessons.find(l=>l.id===id)!;
test('a tempting legal capture cannot earn development completion; Undo then development earns it',()=>{
 const s=new Session(lesson('opening-mini-center')),p=freshProgress();assert(s.play(s.lesson!.setup!));assert(s.reply());
 const capture=s.play({from:'f3',to:'e5'});assert.equal(capture?.captured,'p');assert.equal(s.finished,false);assert.equal(recordLessonCompletion(p,s),false);assert.deepEqual(p.done,[]);
 const reply=s.reply({from:'c6',to:'e5'});assert.equal(reply?.captured,'n');assert(s.undo());assert.equal(s.onFinalStep,true);
 assert(s.play({from:'f1',to:'c4'}));assert.equal(s.finished,true);assert(recordLessonCompletion(p,s));assert.deepEqual(p.done,['opening-mini-center']);assert.match(lessonAchievement(s.lesson!),/developed instead/);
});
test('capture replay and injected capture/XP counts do not farm badges or armor',()=>{
 const p=freshProgress();for(let i=0;i<20;i++){const s=new Session(lesson('rook-capture'));assert(s.play(s.lesson!.goal.move!));s.askHint();assert(recordLessonCompletion(p,s)=== (i===0));}
 assert.deepEqual(p.done,['rook-capture']);assert.deepEqual(earnedBadges(p.done),[]);
 const restored=restoreProgress({...freshProgress(),captures:9999,xp:99999,kills:9999});assert.deepEqual(restored.done,[]);assert.deepEqual(earnedBadges(restored.done),[]);
 const old=Array(12).fill(false);Object.assign(old,{captures:9999,xp:99999});assert.equal(forestTier(old,'pawn'),'apprentice');assert.equal(forestTier(old,'knight'),'apprentice');
});
test('a useful capture answers check; noncapture plans and real promotion receive objective praise',()=>{
 const rescue=new Session(lesson('king-capture-check'));assert(rescue.chess.isCheck());assert(rescue.play(rescue.lesson!.goal.move!));assert(rescue.finished);assert(!rescue.chess.isCheck());assert.match(lessonAchievement(rescue.lesson!),/stopped the check/);
 const block=new Session(lesson('king-block-check'));assert(block.play(block.lesson!.goal.move!));assert(block.finished);assert.match(lessonAchievement(block.lesson!),/blocked/);
 const promotion=new Session(lesson('promotion'));assert(promotion.play(promotion.lesson!.goal.move!));assert.equal(promotion.chess.get('a8')?.type,'q');assert.match(lessonAchievement(promotion.lesson!),/new chess moves/);assert.equal(forestTier(Array(12).fill(false),'pawn'),'apprentice');
 for(const l of lessons){assert(lessonAchievement(l).length>20,l.id);assert.doesNotMatch(lessonAchievement(l),/XP|kills|upgrade/i);}
});
