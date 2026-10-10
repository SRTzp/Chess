import {test} from 'node:test';import assert from 'node:assert/strict';
import {Ledger,restoreJournal,fingerprint,roles} from '../chapter/src/learning/ledger';
import {trials,trialMet} from '../chapter/src/learning/bank';
import {Chess,Match,bestMove} from '../chapter/src/engine/chess';
import {MiniGame} from '../chapter/src/learning/mini';
import {restoreDraft} from '../chapter/src/learning/draft';
test('all authored trials have legal safe witnesses and meaningful legal counterexamples',()=>{
 for(const t of trials){assert(t.accepted.length,t.id);for(const m of t.accepted){const match=new Match(t.fen),c=match.chess;match.beginRound();assert(match.move(m),t.id+' is playable, not an insufficient-material draw');assert(trialMet(t,m,c),t.id);const reply=bestMove(c,'gentle');if(reply)c.move(reply);assert.equal(c.get(m.to)?.color,'w',t.id+' survives reply');}
 const wrong=new Chess(t.fen).moves({verbose:true}).find(m=>!t.accepted.some(a=>a.from===m.from&&a.to===m.to));assert(wrong,t.id+' counterexample');const c=new Chess(t.fen);c.move(wrong!);assert.equal(trialMet(t,{from:wrong!.from,to:wrong!.to},c),false,t.id);
 }
 assert.equal(trials.length,56);for(const r of roles)assert.equal(trials.filter(t=>t.skill===r).length,4);
});
test('gear is isolated by piece and profile; assisted, repeated, failed and review boards do not earn independence',()=>{
 const l=new Ledger(),p=trials.filter(t=>t.skill==='p');
 assert(l.expose('akin',p[0].fen));l.recordSupport('akin','p',['answer revealed']);l.credit('akin','p',p[0].id,true,true,true);assert.equal(l.evidence('akin','p').owned,'guardian');assert.equal(l.evidence('akin','p').novel.length,0);
 assert(!l.expose('akin',p[0].fen));for(let i=0;i<20;i++)l.credit('akin','p',p[0].id,false,false,true);assert.equal(l.evidence('akin','p').practice.length,1);
 l.credit('akin','p',p[1].id,true,false,false);assert.equal(l.evidence('akin','p').novel.length,0);
 l.credit('akin','p',p[1].id,true,false,true,true,1000);assert.equal(l.evidence('akin','p').novel.length,0);assert.equal(l.evidence('akin','p').reviewAt,86401000);
 for(const t of p.slice(2)){assert(l.expose('akin',t.fen));l.credit('akin','p',t.id,true,false,true);}assert.equal(l.evidence('akin','p').owned,'master');assert.equal(l.evidence('akin','n').owned,'apprentice');assert.equal(l.evidence('prin','p').owned,'apprentice');
 l.credit('akin','p',p[0].id,false,true,false);assert.equal(l.evidence('akin','p').owned,'master');assert.deepEqual(l.evidence('akin','p').shown,['answer revealed']);assert.equal(restoreJournal(l.data).profiles.akin.skills.p?.owned,'master');
});
test('legacy ownership is preserved and a full seen ledger fails closed for novelty',()=>{
 const l=new Ledger();l.preserve('akin','n','master');l.credit('akin','n','practice',false,true,true);assert.equal(l.evidence('akin','n').owned,'master');
 l.profile('akin').seen=Array.from({length:600},(_,i)=>'seen-'+i);assert(!l.expose('akin',trials[0].fen));assert(!l.expose('akin',trials[0].fen));assert.equal(l.profile('akin').seen.length,600);
 for(const raw of [null,{}, {version:1,profiles:{akin:{seen:[],skills:{p:{owned:'cheat'}}}}}])assert.deepEqual(restoreJournal(raw),{version:1,profiles:{}});
 const c=new Chess(trials[0].fen);assert.equal(fingerprint(c.fen()),fingerprint(c.fen().replace('0 1','20 10')));
});
test('draft restores only legal history with the correct authored start and mini kind',()=>{
 const t=trials[0],m=new Match(t.fen);m.beginRound();assert(m.move(t.accepted[0]));const draft={version:1,role:t.skill,phase:'discover',trialId:t.id,match:m.save(),support:true,novel:true,done:false,index:0,shown:['concept']};assert.equal(restoreDraft(draft)?.match.chess.fen(),m.chess.fen());
 assert.equal(restoreDraft({...draft,trialId:'missing'}),null);assert.equal(restoreDraft({...draft,match:new Match().save()}),null);assert.equal(restoreDraft({...draft,index:-1}),null);assert.equal(restoreDraft({...draft,match:{...m.save(),moves:[{from:'c2',to:'c7'}]}}),null);
 const mini=new MiniGame();assert(restoreDraft({...draft,phase:'mini',mini:mini.save()}));assert.equal(MiniGame.restore({...mini.save(),kind:'weak-pawn'}),null);
});
test('mini-game needs multiple real replies, supports legal restore and full-round Undo',()=>{
 const g=new MiniGame();assert(g.play({from:'e4',to:'e5'}));assert(g.reply());const s=g.save();assert.equal(MiniGame.restore(s)?.chess.fen(),g.chess.fen());assert.equal(g.rounds,1);assert.equal(g.outcome,'playing');assert(g.undo());assert.equal(g.rounds,0);assert.equal(g.chess.fen(),new MiniGame().chess.fen());
 // The passer has a concrete winning route against this bounded deterministic opponent.
 for(const to of ['e5','e6','e7','e8']){const from=({e5:'e4',e6:'e5',e7:'e6',e8:'e7'} as const)[to as 'e5'];assert(g.play({from,to:to as 'e5',...(to==='e8'?{promotion:'q' as const}:{})}));g.reply();}assert.equal(g.outcome,'won');assert(g.rounds>=3);assert(g.chess.history().length>=6);
 const weak=new MiniGame('weak-pawn');for(const m of [{from:'c3',to:'d4'},{from:'d4',to:'e3'},{from:'e3',to:'d4'}] as const){assert(weak.play(m));weak.reply();}assert.equal(weak.outcome,'won');assert(weak.rounds>=3);assert.equal(weak.chess.get('c4')?.type,'p');
});
test('a real passer promotion succeeds with any of the four legal choices',()=>{
 for(const promotion of ['q','r','b','n'] as const){const g=new MiniGame();for(const [from,to] of [['e4','e5'],['e5','e6'],['e6','e7'],['e7','e8']] as const){assert(g.play({from,to,...(to==='e8'?{promotion}:{})}));g.reply();}assert.equal(g.outcome,'won',promotion);assert.equal(g.chess.get('e8')?.type,promotion);assert.equal(MiniGame.restore(g.save())?.outcome,'won');}
});
test('weak-pawn goal accepts a safe advance of the surviving pawn instead of freezing it on c4',()=>{
 const g=new MiniGame('weak-pawn');for(const m of [{from:'c3',to:'d4'},{from:'d4',to:'e3'},{from:'c4',to:'c5'}] as const){assert(g.play(m));g.reply();}assert.equal(g.chess.get('c4'),undefined);assert.equal(g.chess.get('c5')?.type,'p');assert.equal(g.outcome,'won');assert.equal(MiniGame.restore(g.save())?.outcome,'won');
});
