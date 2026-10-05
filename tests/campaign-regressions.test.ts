import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lessons,previousOrder} from '../chapter/src/engine/lessons.ts';
import {Session} from '../chapter/src/engine/session.ts';
import {canOpenLesson,restoreProgress} from '../chapter/src/engine/campaign.ts';
import {pins} from '../chapter/src/engine/chess.ts';

const lesson=(id:string)=>{const found=lessons.find(l=>l.id===id);assert(found,id);return found;};

test('a pre-existing pin and unrelated king moves cannot complete tactical quests',()=>{
 const pin=lesson('pin-diagonal');assert.equal(pins(new Session(pin).chess,'w').some(p=>p.target==='g7'),false);
 const unrelated=new Session(pin);assert(unrelated.play({from:'a1',to:'a2'}));assert.equal(unrelated.finished,false);
 const tactical=new Set(['fork','pin','discovery','mate','castle','promotion','en-passant']);
 for(const l of lessons.filter(x=>tactical.has(x.goal.kind))){const s=new Session(l);const king=s.chess.moves({verbose:true}).find(m=>m.piece==='k'&&!m.flags.includes('k')&&!m.flags.includes('q'));assert(king,l.id+' unrelated king move');assert(s.play({from:king.from,to:king.to}),l.id);assert.equal(s.finished,false,l.id+' unrelated move');}
});

test('hints follow the current board and the second step of a plan',()=>{
 const road=new Session(lesson('rook-road'));assert(road.play({from:'a1',to:'a3'}));assert(road.reply());assert.match(road.askHint(),/a3 to a4/);assert.doesNotMatch(road.hint,/a1 to a4/);
 const fork=new Session(lesson('knight-fork'));assert.match(fork.hint,/knight/i);assert(fork.play(fork.lesson!.setup!));assert(fork.reply());assert.equal(fork.onFinalStep,true);assert.doesNotMatch(fork.hint,/e3 to f5/);assert.match(fork.askHint(),/f5/);assert.match(fork.askHint(),/f5 to h6/);
 const wrong=new Session(lesson('knight-fork'));assert(wrong.play({from:'e1',to:'f1'}));assert(wrong.reply());assert.match(wrong.askHint(),/Undo or Try again/);
 const missed=new Session(lesson('knight-fork'));assert(missed.play(missed.lesson!.setup!));assert(missed.reply());assert(missed.play({from:'e1',to:'f1'}));assert(missed.reply());assert.equal(missed.onFinalStep,false);assert.match(missed.askHint(),/Undo or Try again/);assert(missed.undo());assert.equal(missed.onFinalStep,true);
});

test('escaping check by giving a countercheck completes the safety outcome',()=>{
 const altered={...lesson('king-escape'),fen:'4r3/8/8/1B5k/8/8/8/4K3 w - - 0 1'};
 const s=new Session(altered);assert.equal(s.chess.isCheck(),true);assert(s.play({from:'b5',to:'e2'}));assert.equal(s.chess.isCheck(),true,'the opponent is now in check');assert.equal(s.finished,true);
});

test('old 37-quest saves keep their unlocked path after inserted lessons',()=>{
 const oldFull=restoreProgress({version:2,done:previousOrder,session:null,legacyDone:[],wins:0});assert.equal(oldFull.done.length,lessons.length);assert.equal(lessons.length,43);assert(canOpenLesson(lessons.length-1,Array(12).fill(true),oldFull.done));
 const oldPartial=restoreProgress({version:2,done:previousOrder.slice(0,8),session:null,legacyDone:[],wins:0});assert(oldPartial.done.includes('queen-diagonal'));assert.equal(oldPartial.done.at(-1),'queen-rescue');assert.equal(lessons[oldPartial.done.length].id,'queen-diagonal-rescue');
 assert(lessons.filter(l=>l.planningDepth>=2).length>=5);
});
