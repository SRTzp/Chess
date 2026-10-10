import {BoardMotion} from '../board-motion';
import {TeachingOverlay,algebraicPoint} from '../visual-path';
import {miniGoals,miniHintMove} from './mini-guidance';
import {nextSkill,learningTrail} from './trail';
import {loadViewSettings,saveViewSettings} from './view-settings';
import {teachingReply} from '../engine/teaching-reply';
import {Match,bestMove,input,type Square,type InputMove} from '../engine/chess';
import {trials,trialMet,trialReply,trialHintMove,type Trial} from './bank';
import {MiniGame,miniKinds,miniNames,miniForSkill,miniSkill,type MiniKind} from './mini';
import {roles,type Role,type Skill} from './ledger';
import {ledger,persistLearning} from './store';
import {actor,glyphs,enemyGlyphs} from './actors';
import {phases,restoreDraft,type Phase} from './draft';
import type {Voice} from '../speech';
import './room.css';
const names:Record<Skill,string>={p:'Pawn',n:'Knight',b:'Bishop',r:'Rook',q:'Queen',k:'King',team:'Team plan',prevent:'Look ahead',passer:'King helps pawn',activity:'Active pieces',weakness:'Weak pawns',fork:'Fork',pin:'Pin',discovery:'Reveal an attack',threat:'See threats',check:'Check and rescue',castle:'Safe castling',promotion:'Promotion','en-passant':'Passing capture',mate:'Checkmate',stalemate:'Mate or draw','active-king':'Active king','pawn-defense':'Defend pawns','create-passer':'Create a passer'};
export function createLearningRoom(voice:Voice,toFull?:(id:string)=>void){
 const root=document.createElement('section');root.className='learning-room';root.hidden=true;
 root.innerHTML=`<header><button data-close aria-label="Return to adventure">✕</button><strong>Forest school</strong><button data-menu aria-label="Learning choices">☰</button></header><aside hidden><label>Friend <select data-role>${Object.entries(names).map(([r,n])=>`<option value="${r}">${n}</option>`).join('')}</select></label><label>Try <select data-phase>${phases.map(p=>`<option>${p}</option>`).join('')}</select></label><label><input type="checkbox" data-symbols> Chess symbols</label><label><input type="checkbox" data-fade checked> Suggest less help from evidence</label><label><input type="checkbox" data-motion> Reduce motion</label><label>Short game <select data-mini-kind>${miniKinds.map(k=>`<option value="${k}">${miniNames[k]}</option>`).join('')}</select></label><label>Board <select data-mini-variant><option value="0">A</option><option value="1">B</option></select></label><button data-mini-start>▶ Play short game</button><button data-weak>Weak-pawn short game</button><p>Hints and Undo keep every reward. New boards show what you can do. Gear belongs to each friend; plans earn their own badges.</p></aside><p class="learning-stage"></p><p class="learning-badges" aria-label="Learning milestones"></p><div class="learning-field"><div class="learning-board" role="group" aria-label="Learning chess board"></div></div><div class="learning-promotion" hidden role="group" aria-label="Choose promotion"><strong>Choose a new friend</strong>${(['q','r','b','n'] as Role[]).map(r=>`<button data-promote="${r}">${glyphs[r]} ${names[r]}</button>`).join('')}<button data-promote="cancel">Cancel</button></div><footer><p class="learning-line" aria-live="polite"></p><div><button data-hint>Help</button><button data-undo>Undo</button><button data-listen>Listen</button><button data-next>Next</button></div><button data-demo>↷ Watch</button><button data-restart>Try again</button><button data-review hidden>Review due</button><small class="learning-save" hidden>Saving unavailable. Keep this page open.</small></footer>`;
 document.body.append(root);
 const $=(s:string)=>root.querySelector<HTMLElement>(s)!;
 const board=$('.learning-board'),line=$('.learning-line'),menu=$('aside');const overlay=new TeachingOverlay(board,p=>board.querySelector<HTMLButtonElement>('[data-square="'+String.fromCharCode(97+p.x)+(8-p.y)+'"]'));
 const animator=new BoardMotion(board);
 function showTrialDemo(){if(mini)return;const m=trialHintMove(trial,current());if(!m)return;mark('path demonstration');selected=m.from;save();render();const p=current().get(m.from);if(p)void overlay.show({from:algebraicPoint(m.from),to:algebraicPoint(m.to),piece:p.type,capture:!!current().get(m.to)},'demo',motion.checked);}
 let profile='akin',role:Skill='p',phase:Phase='discover',trial:Trial=trials[0],match=new Match(trial.fen),mini:MiniGame|null=null;
 let selected:Square|null=null,promotion:InputMove|null=null,support=false,shown:string[]=[],novel=false,busy=false,token=0,done=false,index=0,good=false,last:Square|null=null,close:()=>void=()=>{};
 const current=()=>mini?.chess??match.chess;
 const draftKey=()=> 'chessia-learning-draft-'+profile+'-'+(new URLSearchParams(location.search).get('preview')??'journey');
 const motion=root.querySelector<HTMLInputElement>('[data-motion]')!,symbols=root.querySelector<HTMLInputElement>('[data-symbols]')!;
 function loadSettings(){const settings=loadViewSettings(profile==='prin'?'prin':'akin');motion.checked=settings.reducedMotion;symbols.checked=settings.symbols;}
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{if(!root.hidden){loadSettings();settle();}});
 function say(text:string){line.textContent=text;voice.say(text);}
 function cancel(){animator.cancel();overlay.cancel();token++;busy=false;voice.stop();board.getAnimations({subtree:true}).forEach(a=>a.cancel());}
 function mark(mode:string){support=true;if(!shown.includes(mode))shown.push(mode);ledger.recordSupport(profile,role,shown);}
 function save(){const persisted=persistLearning();try{localStorage.setItem(draftKey(),JSON.stringify({version:1,role,phase,trialId:trial.id,match:match.save(),mini:mini?.save(),support,shown,novel,done,index}));$('.learning-save').hidden=persisted;}catch{$('.learning-save').hidden=false;}}
 function start(nextPhase=phase,restart=false){
  if(nextPhase==='game'&&toFull){cancel();save();root.hidden=true;close();toFull(profile);return;}
  cancel();phase=nextPhase;selected=null;promotion=null;done=false;last=null;shown=[];
  index=phase==='discover'?0:phase==='practice'?1:phase==='review'?0:Math.max(2,index);
  const list=trials.filter(t=>t.skill===role);trial=list[index%list.length]??trials[0];
  if(phase==='independent'&&!restart){const fresh=list.find(t=>!ledger.profile(profile).seen.includes(t.fen.split(' ').slice(0,4).join(' ')));if(fresh)trial=fresh;}
  match=new Match(phase==='game'?undefined:trial.fen);mini=phase==='mini'?new MiniGame(miniForSkill(role),(index%2)as 0|1):null;
  support=false;ledger.recordSupport(profile,role,[]);if(phase==='discover'||phase==='practice'&&(!root.querySelector<HTMLInputElement>('[data-fade]')!.checked||ledger.evidence(profile,role).novel.length<1))mark('concept + legal landing cues');
  novel=ledger.expose(profile,mini?.match.start??match.start);menu.hidden=true;
  save();render();say(phase==='game'?'Try a real game whenever you feel ready. Keep your king safe.':phase==='mini'?miniGoals[mini!.kind]+' Watch every reply.':phase==='review'?'Try this again. What do you remember?':trial.instruction+(phase==='independent'&&!novel?' You have seen this board; it counts as practice.':''));
 }
 function render(){
  root.classList.toggle('journey-reduced',motion.checked);overlay.cancel();const c=current(),e=ledger.evidence(profile,role),piece=roles.includes(role as Role);
  $('.learning-stage').textContent=`${learningTrail.indexOf(role)+1}/${learningTrail.length} · ${phase} · ${names[role]} · ${piece?e.owned+' gear':e.owned==='master'?'Plan badge earned':'Plan practice'}${phase==='independent'?' · '+(novel&&!support?'new board':'practice'):''}`;
  $('.learning-badges').textContent=Object.entries(ledger.profile(profile).skills).filter(([skill,e])=>!roles.includes(skill as Role)&&e?.owned==='master').map(([skill])=>skill==='team'?'✦ Team clearing':skill==='prevent'?'◆ Safe camp':skill==='passer'?'✧ Pawn bridge':names[skill as Skill]+' badge').join(' · ');root.querySelector<HTMLSelectElement>('[data-role]')!.value=role;root.querySelector<HTMLSelectElement>('[data-phase]')!.value=phase;
  board.replaceChildren();const targets=selected&&support?c.moves({square:selected,verbose:true}):[];
  for(let rank=8;rank>=1;rank--)for(const file of 'abcdefgh'){
   const sq=(file+rank)as Square,p=c.get(sq),b=document.createElement('button');b.dataset.square=sq;b.className='learning-cell '+((file.charCodeAt(0)+rank)%2?'light':'dark');
   b.setAttribute('aria-label',sq+(p?' '+(p.color==='w'?'White':'Black')+' '+names[p.type]:''));b.setAttribute('aria-pressed',String(selected===sq));b.disabled=busy||done||!!promotion||c.turn()!=='w';
   if(p){const symbol=p.color==='b'?enemyGlyphs[p.type]:glyphs[p.type],symbols=root.querySelector<HTMLInputElement>('[data-symbols]')!.checked;b.classList.toggle('chess-symbols',symbols);b.classList.add(p.color==='w'?'friend':'enemy');b.innerHTML=symbols?symbol:actor(p.type,p.color==='b',ledger.evidence(profile,p.type).owned)+`<span class="chess-bridge">${symbol}</span>`;}
   if(p?.type==='k'&&p.color===c.turn()&&c.isCheck())b.classList.add('checked');if(selected===sq)b.classList.add('selected');if(targets.some(m=>m.to===sq))b.classList.add('landing');
   if(roles.includes(role as Role)&&phase!=='mini'&&phase!=='game'&&!p&&trial.accepted.some(m=>m.to===sq))b.innerHTML+='<span class="learning-star">✦</span>';
   b.innerHTML+=`<span class="learning-coordinate">${sq}</span>`;b.onclick=()=>void tap(sq);board.append(b);
  }
  ($('[data-undo]')as HTMLButtonElement).disabled=!c.history().length;
  ($('[data-next]')as HTMLButtonElement).disabled=busy||!!promotion;
  ($('[data-hint]')as HTMLButtonElement).disabled=busy||done||!!promotion;
  $('.learning-promotion').hidden=!promotion;$('[data-demo]').hidden=!!mini||phase!=='discover'&&phase!=='practice';$('[data-next]').textContent=phase==='review'?'Next friend →':'Next →';if(mini){root.querySelector<HTMLSelectElement>('[data-mini-kind]')!.value=mini.kind;root.querySelector<HTMLSelectElement>('[data-mini-variant]')!.value=String(mini.variant);}
  animator.refresh();
  $('[data-review]').hidden=!Object.values(ledger.profile(profile).skills).some(e=>e&&e.reviewAt>0&&e.reviewAt<=Date.now());
 }
 function finishTurn(){
  const c=current(),shots=animator.snapshot(),before=c.history().length;if(c.turn()==='b'&&!c.isGameOver()){if(mini)mini.reply();else{const reply=phase==='game'?bestMove(c,'gentle'):trialReply(trial,c);if(reply)match.move(reply);}}
  busy=false;
  if(phase==='mini'){
   done=mini!.outcome!=='playing';if(mini!.outcome==='won')ledger.credit(profile,mini!.kind===miniForSkill(role)?role:miniSkill[mini!.kind],'mini-'+mini!.kind+(mini!.variant?'-1':''),novel,support,true);
   say(done?mini!.outcome==='won'?'Short-game goal reached! You used the plan and watched the replies.':'Time to review. Undo or try another plan.':miniGoals[mini!.kind]+' They moved. Look again.');
  }else if(phase==='game'){done=c.isGameOver();say(done?'Game complete. Review one helpful move.':'They moved. Keep your king safe.');}
  else if(last){
   done=good&&c.get(last)?.color==='w';
   if(done){const e=ledger.credit(profile,role,trial.id,novel,support,true,phase==='review');const badge=!roles.includes(role as Role)&&e.owned==='master'&&novel&&!support&&phase!=='review';say(badge?`${names[role]} badge earned! ${role==='team'?'The team lights the clearing.':role==='passer'?'The bridge is ready.':role==='prevent'?'The camp is safe.':'Your plan worked.'}`:support?'Practice complete! Try a new board without help when ready.':'Goal reached! Your friend helped the plan.');if(badge&&!motion.checked){root.dataset.signature=role;}if(badge&&!motion.checked)board.animate([{boxShadow:'0 0 0 4px #ffe39a'},{boxShadow:'0 0 25px #ffe39a00'}],{duration:450});}
   else {novel=false;say('Look at their reply. Undo and try a new plan.');}
  }
  save();render();const replied=c.history({verbose:true}).at(-1);if(c.history().length>before&&replied)void animator.play(replied,shots,motion.checked||symbols.checked);voice.sound(done);
 }
 function settle(){const pending=busy||current().turn()==='b';cancel();if(pending)finishTurn();else{save();render();}}
 async function tap(sq:Square){
  if(busy||done||promotion||current().turn()!=='w')return;const c=current(),p=c.get(sq);
  if(p?.color==='w'){selected=sq;render();say(support?trial.concept:'Choose a safe landing.');return;}
  if(!selected){say('Tap your friend first.');return;}
  const options=c.moves({square:selected,verbose:true}).filter(m=>m.to===sq);
  if(!options.length){novel=false;save();say('That path does not work. Try again; this board counts as practice.');return;}
  if(options.some(m=>m.promotion)){promotion={from:selected,to:sq};render();$('[data-promote="q"]').focus();return;}
  await play({from:selected,to:sq});
 }
 async function play(move:InputMove){
  const c=current(),shots=animator.snapshot();promotion=null;
  const played=mini?mini.play(move):(match.beginRound(),match.move(move));if(!played){if(!mini)match.undoRound();render();return;}
  selected=null;last=move.to;good=phase==='game'||phase==='mini'||trialMet(trial,move,c);busy=true;const turn=++token;save();render();
  await animator.play(played,shots,motion.checked||symbols.checked);
  if(token!==turn)return;finishTurn();
 }
 $('.learning-promotion').onclick=e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-promote]');if(!b||!promotion)return;const choice=b.dataset.promote;if(choice==='cancel'){promotion=null;render();return;}void play({...promotion,promotion:choice as InputMove['promotion']});};
 $('[data-demo]').onclick=showTrialDemo;$('[data-hint]').onclick=()=>{if(mini){const move=miniHintMove(mini);mark(move?'answer revealed':'plan reminder');if(move)selected=move.from;save();render();say(miniGoals[mini.kind]+(move?' Try '+move.from+' to '+move.to+'.':' Your board changed. Look at their threat; Undo or try another plan.'));return;}const suggestion=phase==='game'?null:trialHintMove(trial,current());mark(suggestion?'answer revealed':'plan reminder');if(suggestion)selected=suggestion.from;save();render();say(phase==='game'?'Check your king, their threats, then one useful move.':suggestion?trial.concept+' Try '+suggestion.from+' to '+suggestion.to+'.':'Your board changed. Look for the goal, or Undo and try another plan.');};
 $('[data-undo]').onclick=()=>{cancel();novel=false;if(mini)mini.undo();else match.undoRound();done=false;selected=null;promotion=null;last=null;save();render();say('Try another plan. Your rewards stay. This board counts as practice.');};
 $('[data-listen]').onclick=()=>voice.replay();$('[data-restart]').onclick=()=>start(phase,true);
 $('[data-next]').onclick=()=>{if(!done&&phase!=='review'&&phase!=='game'){say('Finish this activity, or choose another in the menu.');return;}if(phase==='independent'&&index===2){index=3;start('independent');return;}if(phase==='review'){const next=nextSkill(role);if(next){role=next;index=0;start('discover');}else start('game');return;}index=0;start(phases[(phases.indexOf(phase)+1)%phases.length]);};
 $('[data-close]').onclick=()=>{settle();animator.cancel();root.hidden=true;close();};$('[data-menu]').onclick=()=>{menu.hidden=!menu.hidden;};
 root.querySelector<HTMLSelectElement>('[data-role]')!.onchange=e=>{role=(e.target as HTMLSelectElement).value as Skill;index=0;start('discover');};
 root.querySelector<HTMLSelectElement>('[data-phase]')!.onchange=e=>{index=0;start((e.target as HTMLSelectElement).value as Phase);};
 symbols.onchange=()=>{animator.cancel();saveViewSettings(profile==='prin'?'prin':'akin',{symbols:symbols.checked});render();};motion.onchange=()=>{saveViewSettings(profile==='prin'?'prin':'akin',{reducedMotion:motion.checked});settle();};
 function launchMini(kind:MiniKind,variant:0|1){cancel();role=miniSkill[kind];phase='mini';trial=trials.find(t=>t.skill===role)!;match=new Match(trial.fen);mini=new MiniGame(kind,variant);selected=null;promotion=null;done=false;last=null;shown=[];support=false;ledger.recordSupport(profile,role,[]);novel=ledger.expose(profile,mini.match.start);menu.hidden=true;save();render();say(miniGoals[kind]);}
 $('[data-mini-start]').onclick=()=>launchMini(root.querySelector<HTMLSelectElement>('[data-mini-kind]')!.value as MiniKind,Number(root.querySelector<HTMLSelectElement>('[data-mini-variant]')!.value)as 0|1);$('[data-weak]').onclick=()=>launchMini('weak-pawn',0);
 $('[data-review]').onclick=()=>{const due=Object.entries(ledger.profile(profile).skills).find(([,e])=>e&&e.reviewAt>0&&e.reviewAt<=Date.now());if(due){role=due[0] as Skill;start('review');}};
 window.addEventListener('resize',()=>{if(!root.hidden){settle();animator.cancel();}});window.addEventListener('pagehide',()=>{if(!root.hidden){settle();animator.cancel();}});
 return (id:string,onClose:()=>void,focus?:Skill)=>{
  profile=id;loadSettings();close=onClose;root.hidden=false;menu.hidden=true;let restored;try{restored=restoreDraft(JSON.parse(localStorage.getItem(draftKey())??'null'));}catch{}
  if(focus&&restored?.role!==focus){role=focus;index=0;start('discover');return;}if(restored?.phase==='game'&&toFull){root.hidden=true;close();toFull(profile);return;}if(restored){({role,phase,trial,match,mini,support,novel,done,index,shown}=restored);selected=null;promotion=null;last=null;
   // A saved interrupted player move is replayed from its legal history before one reply.
   const history=current().history({verbose:true}),m=history.at(-1);if(m?.color==='w'){last=m.to;good=phase==='mini'||phase==='game'||trialMet(trial,input(m),current());}settle();say(done?'Welcome back. Your completed practice and rewards are saved.':'Welcome back. Continue your plan.');
  }else{role='p';index=0;start('discover');}
 };
}
