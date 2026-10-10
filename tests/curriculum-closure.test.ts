import {test} from 'node:test';import assert from 'node:assert/strict';
import {Chess,Match,type Square,type InputMove} from '../chapter/src/engine/chess';
import {MiniGame,miniKinds,miniInput} from '../chapter/src/learning/mini';import {miniPaths} from '../chapter/src/learning/mini-paths';import {miniHintMove} from '../chapter/src/learning/mini-guidance';
import {trials,trialMet} from '../chapter/src/learning/bank';import {skills,Ledger,restoreJournal,fingerprint} from '../chapter/src/learning/ledger';import {restoreDraft} from '../chapter/src/learning/draft';import {learningTrail,nextSkill} from '../chapter/src/learning/trail';
const move=(lan:string):InputMove=>({from:lan.slice(0,2)as Square,to:lan.slice(2,4)as Square,...(lan[4]?{promotion:lan[4]as InputMove['promotion']}:{})});
test('all36 finite mini-game starts have multi-turn legal witnesses against their actual replies, legal restore and Undo',()=>{
 for(const kind of miniKinds)for(const variant of [0,1]as const){const g=new MiniGame(kind,variant),paths=kind==='opening'&&variant?miniPaths[kind].slice(1):miniPaths[kind];let whites=0;for(const lan of paths){if(g.outcome==='won')break;assert.equal(g.outcome,'playing',kind+variant);const m=miniInput(move(lan),kind==='opening'?0:variant);assert(g.play(m),kind+variant+' '+lan);whites++;if(!g.chess.isGameOver())assert(g.reply(),kind+variant+' real reply');const restored=MiniGame.restore(g.save());assert(restored,kind+variant+' restore');assert.equal(restored!.chess.fen(),g.chess.fen());assert.equal(restored!.outcome,g.outcome);}
 assert.equal(g.outcome,'won',kind+variant);assert(whites>=2,kind);assert(g.chess.history().length>=3);assert(g.undo(),kind);assert.notEqual(g.outcome,'won',kind+' Undo must undo completion');}
});
test('create-passer requires the exchange and a real check response/king escort before all4 promotion choices',()=>{
 for(const variant of [0,1]as const)for(const promotion of ['q','r','b','n']as const){const g=new MiniGame('create-passer',variant);assert(g.play(miniInput(move('c5d6'),variant)));assert(g.reply());assert(g.chess.isCheck());const before=g.save();assert.equal(g.play(miniInput(move('d6d7'),variant)),null);assert.deepEqual(g.save(),before);
 for(const lan of ['c4d5','d6d7','d7d8'+promotion]){assert(g.play(miniInput(move(lan),variant)));g.reply();}assert.equal(g.outcome,'won',promotion+variant);assert.equal(g.chess.get(variant?'e8':'d8')?.type,promotion);}
});
test('capture alone does not complete prevention; losing the Queen is not mate; repeated development without castle is not opening',()=>{
 const p=new MiniGame('prevent-game');for(const lan of ['a2a3','a3g3','g3a3']){assert(p.play(move(lan)));p.reply();}assert.notEqual(p.outcome,'won');
 const q=new MiniGame('mate-queen');for(const lan of ['b6d8','d8h8']){assert(q.play(move(lan)));q.reply();}assert.equal(q.outcome,'review');assert(!q.chess.isCheckmate());
 const o=new MiniGame('opening');for(const lan of ['e2e4','g1f3','f3g1']){assert(o.play(move(lan)));o.reply();}assert.equal(o.outcome,'playing');
});
test('mini hints follow the current legal witnessed path and never repeat a stale answer',()=>{
 const g=new MiniGame('mate-queen');assert.deepEqual(miniHintMove(g),move('b6d8'));assert(g.play(move('b6d8')));g.reply();assert.deepEqual(miniHintMove(g),move('f6f7'));assert(g.play(move('d8d7')));g.reply();assert.equal(miniHintMove(g),null);
});
test('new topic ladders have distinct authored positions and fresh independent contexts; topic trail starts Pawn and ends at full-game bridge',()=>{
 assert.equal(learningTrail[0],'p');assert.equal(new Set(learningTrail).size,skills.length);assert.deepEqual(new Set(learningTrail),new Set(skills));assert.equal(nextSkill('p'),'n');assert.equal(nextSkill('stalemate'),null);
 for(const skill of skills){const bank=trials.filter(t=>t.skill===skill);assert(bank.length>=4,skill);assert.equal(new Set(bank.map(t=>fingerprint(t.fen))).size,bank.length,skill+' different boards, not clocks');}
});
test('goal acceptance uses the actual changed board, not a mate from the original author position',()=>{
 const t=trials.find(t=>t.id==='finish-0')!,m=new Match(t.fen);m.beginRound();assert(m.move(move('a1b1')));assert(m.move(move('h7h6')));m.beginRound();assert(m.move(move('f6f8')));assert(!m.chess.isCheckmate());assert.equal(trialMet(t,move('f6f8'),m.chess),false);
 const bad={version:1,role:t.skill,phase:'independent',trialId:t.id,match:m.save(),support:false,novel:true,done:true,index:2};assert.equal(restoreDraft(bad),null);
});
test('new journal/draft keys retain old owned gear; assisted/replayed new-topic wins cannot earn independence',()=>{
 const l=new Ledger();l.preserve('akin','p','master');l.preserve('akin','n','guardian');l.recordSupport('akin','create-passer',['answer revealed']);l.credit('akin','create-passer','created',true,true,true);assert.equal(l.evidence('akin','create-passer').novel.length,0);l.credit('akin','mate','same',false,false,true);assert.equal(l.evidence('akin','mate').novel.length,0);const restored=new Ledger(restoreJournal(JSON.parse(JSON.stringify(l.data))));assert.equal(restored.evidence('akin','p').owned,'master');assert.equal(restored.evidence('akin','n').owned,'guardian');assert.equal(restored.evidence('prin','p').owned,'apprentice');assert.deepEqual(restored.evidence('akin','create-passer').shown,['answer revealed']);
 const t=trials.find(t=>t.skill==='create-passer')!;assert(restoreDraft({version:1,role:t.skill,phase:'discover',trialId:t.id,match:new Match(t.fen).save(),support:true,novel:true,done:false,index:0}));assert.equal(MiniGame.restore({...new MiniGame('opening').save(),variant:99}),null);
});
test('movement blockers, jump and King danger have negative examples on the taught boards',()=>{
 const q=new Chess(trials.find(t=>t.id==='use-q-3')!.fen);assert.throws(()=>q.move(move('f2b6')));const p=new Chess(trials.find(t=>t.id==='use-p-2')!.fen);assert.throws(()=>p.move(move('b2b3')));const n=new Chess(trials.find(t=>t.id==='use-n-2')!.fen);assert(n.move(move('c3d5')));const k=new Chess(trials.find(t=>t.id==='use-k-3')!.fen);assert.throws(()=>k.move(move('f3d3')));
});
