import {beginAttempt,assistAttempt,commitAttempt,completeAttempt,restoreAttempt,type AttemptState} from './context-attempt';
import {clearingSquares} from './clearing';
import {stepPool,stepName,checkStep,microConfig,journeyReady,nextContextId,nextJourneyStep} from './microsteps';
import {authorPlans,plansForMission,PlanPreview,shouldGuide} from './choices';
import {BoardMotion} from '../board-motion';
import {TeachingOverlay,algebraicPoint} from '../visual-path';
import {miniGoals,miniHintMove} from './mini-guidance';
import {nextSkill,learningTrail} from './trail';
import {loadViewSettings,saveViewSettings} from './view-settings';
import {teachingReply} from '../engine/teaching-reply';
import {Match,bestMove,input,type Square,type InputMove} from '../engine/chess';
import {trials,trialMet,trialReply,trialHintMove,type Trial} from './bank';
import {MiniGame,miniKinds,miniNames,miniForSkill,miniSkill,type MiniKind} from './mini';
import {roles,reviewEligible,reviewVariant,type Role,type Skill} from './ledger';
import {ledger,persistLearning} from './store';
import {actor,glyphs,enemyGlyphs} from './actors';
import {phases,restoreDraft,type Phase} from './draft';
import type {Voice} from '../speech';
import './room.css';
const names:Record<Skill,string>={p:'Pawn',n:'Knight',b:'Bishop',r:'Rook',q:'Queen',k:'King',team:'Team plan',prevent:'Look ahead',passer:'King helps pawn',activity:'Active pieces',weakness:'Weak pawns',fork:'Fork',pin:'Pin',discovery:'Reveal an attack',threat:'See threats',check:'Check and rescue',castle:'Safe castling',promotion:'Promotion','en-passant':'Passing capture',mate:'Checkmate',stalemate:'Mate or draw','active-king':'Active king','pawn-defense':'Defend pawns','create-passer':'Create a passer'};
export function createLearningRoom(voice:Voice,toFull?:(id:string)=>void){
 const root=document.createElement('section');root.className='learning-room';root.hidden=true;
 root.innerHTML=`<header><button data-close aria-label="Return to adventure">✕</button><strong>Forest school</strong><button data-menu aria-label="Learning choices">☰</button></header><aside hidden><label>Friend <select data-role>${Object.entries(names).map(([r,n])=>`<option value="${r}">${n}</option>`).join('')}</select></label><label>Try <select data-phase>${phases.map(p=>`<option>${p}</option>`).join('')}</select></label><label><input type="checkbox" data-symbols> Chess symbols</label><label><input type="checkbox" data-fade checked> Suggest less help from evidence</label><label><input type="checkbox" data-motion> Reduce motion</label><label>Short game <select data-mini-kind>${miniKinds.map(k=>`<option value="${k}">${miniNames[k]}</option>`).join('')}</select></label><label>Board <select data-mini-variant><option value="0">A</option><option value="1">B</option></select></label><button data-mini-start>▶ Play short game</button><button data-weak>Weak-pawn short game</button><p>Hints and Undo keep every reward. Familiar boards can earn gear too: complete two different reviews without help on later visits. No timer. Gear belongs to each friend; plans earn their own badges.</p></aside><p class="learning-stage"></p><p class="learning-badges" aria-label="Learning milestones"></p><div class="learning-field"><div class="learning-board" role="group" aria-label="Learning chess board"></div></div><div class="learning-promotion" hidden role="group" aria-label="Choose promotion"><strong>Choose a new friend</strong>${(['q','r','b','n'] as Role[]).map(r=>`<button data-promote="${r}">${glyphs[r]} ${names[r]}</button>`).join('')}<button data-promote="cancel">Cancel</button></div><footer><p class="learning-line" aria-live="polite"></p><div><button data-hint>Help</button><button data-undo>Undo</button><button data-listen>Listen</button><button data-next>Next</button></div><button data-demo>↷ Watch</button><button data-restart>Try again</button><button data-review hidden>Review due</button><small class="learning-save" hidden>Saving unavailable. Keep this page open.</small></footer>`;
 document.body.append(root);
 const $=(s:string)=>root.querySelector<HTMLElement>(s)!;
 const board=$('.learning-board'),line=$('.learning-line'),menu=$('aside');for(const selector of ['[data-listen]','[data-demo]','[data-restart]','[data-review]'])menu.append($(selector));const overlay=new TeachingOverlay(board,p=>board.querySelector<HTMLButtonElement>('[data-square="'+String.fromCharCode(97+p.x)+(8-p.y)+'"]'));
 const route=new PlanPreview<InputMove>();let plans=authorPlans(trials[0]);
 const guidedChoices=()=>!mini&&phase!=='game'&&(shown.includes('adventure choices')||shouldGuide(phase,root.querySelector<HTMLInputElement>('[data-fade]')!.checked,lessonFlow?0:ledger.evidence(profile,role).practice.length));
 const animator=new BoardMotion(board,()=>{if(!root.hidden)render();});
 function showTrialDemo(){if(mini)return;const m=trialHintMove(trial,current());if(!m)return;mark('path demonstration');selected=m.from;save();render();const p=current().get(m.from);if(p)void overlay.show({from:algebraicPoint(m.from),to:algebraicPoint(m.to),piece:p.type,capture:!!current().get(m.to)},'demo',motion.checked);}
 let lessonFlow=false,stepReady=false;
 let attempt:AttemptState={version:1,id:'',startedAt:0,firstCommit:false,committedFirst:false,support:false,shown:[],credited:false};
 let profile='akin',role:Skill='p',phase:Phase='discover',trial:Trial=trials[0],match=new Match(trial.fen),mini:MiniGame|null=null;
 let selected:Square|null=null,promotion:InputMove|null=null,support=false,shown:string[]=[],novel=false,busy=false,token=0,done=false,index=0,good=false,last:Square|null=null,close:()=>void=()=>{};
 const current=()=>mini?.chess??match.chess;
 const draftKey=()=> 'chessia-learning-draft-'+profile+'-'+(new URLSearchParams(location.search).get('preview')??'journey');
 const motion=root.querySelector<HTMLInputElement>('[data-motion]')!,symbols=root.querySelector<HTMLInputElement>('[data-symbols]')!;
 function loadSettings(){const settings=loadViewSettings(profile==='prin'?'prin':'akin');motion.checked=settings.reducedMotion;symbols.checked=settings.symbols;}
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{if(!root.hidden){loadSettings();settle();}});
 function say(text:string){line.textContent=text;voice.say(text);}
 function cancel(){route.cancel();animator.cancel();overlay.cancel();token++;busy=false;voice.stop();board.getAnimations({subtree:true}).forEach(a=>a.cancel());}
 function syncAttempt(){support=attempt.support;shown=attempt.shown;}
 function mark(mode:string){if(!mini&&phase!=='game')assistAttempt(ledger.journey(profile,role),attempt,mode);else{attempt.support=true;if(!attempt.shown.includes(mode))attempt.shown.push(mode);}syncAttempt();ledger.recordSupport(profile,role,shown);}
 function rebuildPlans(source=trial){plans=plansForMission(source,lessonFlow?ledger.journey(profile,role):undefined);}
 function save(){const persisted=persistLearning();try{localStorage.setItem(draftKey(),JSON.stringify({version:1,role,phase,trialId:trial.id,match:match.save(),mini:mini?.save(),lessonFlow,firstCommit:attempt.firstCommit,attempt,support,shown,novel,done,index}));$('.learning-save').hidden=persisted;}catch{$('.learning-save').hidden=false;}}
 function start(nextPhase=phase,restart=false){
  if(nextPhase==='game'&&toFull){cancel();save();root.hidden=true;close();toFull(profile);return;}
  const restarting=restart?trial:null;cancel();stepReady=false;if(['mini','review','game'].includes(nextPhase))lessonFlow=false;phase=nextPhase;selected=null;promotion=null;done=false;last=null;shown=[];
  index=phase==='discover'?0:phase==='practice'?1:phase==='review'?(restart?index:index+1):Math.max(2,index);
  const list=trials.filter(t=>t.skill===role);if(lessonFlow&&['practice','independent'].includes(phase)){const journey=ledger.journey(profile,role);if(journey.step>checkStep(role)){phase='mini';}else{phase=journey.step===checkStep(role)?'independent':'practice';const pool=stepPool(role,journey.step,list.map(t=>t.id));const id=nextContextId(journey,pool,phase==='independent');index=list.findIndex(t=>t.id===id);}}trial=list[index%list.length]??trials[0];
  if(phase==='independent'&&!restart&&!lessonFlow){const fresh=list.find(t=>!ledger.profile(profile).seen.includes(t.fen.split(' ').slice(0,4).join(' ')));if(fresh)trial=fresh;else phase='review';}
  if(phase==='review'){const variant=reviewVariant(ledger.evidence(profile,role),list.map(t=>t.id),index);trial=list.find(t=>t.id===variant)??trial;index=list.indexOf(trial);}
  if(restarting&&phase!=='mini'&&phase!=='game'){trial=restarting;index=list.indexOf(trial);}rebuildPlans();match=new Match(phase==='game'?undefined:trial.fen);mini=phase==='mini'?new MiniGame(miniForSkill(role),(index%2)as 0|1):null;
  attempt=beginAttempt(ledger.journey(profile,role),trial.id);syncAttempt();ledger.recordSupport(profile,role,shown);if(guidedChoices())mark('adventure choices');
  novel=ledger.expose(profile,mini?.match.start??match.start);menu.hidden=true;
  save();render();say(phase==='game'?'Try a real game whenever you feel ready. Keep your king safe.':phase==='mini'?miniGoals[mini!.kind]+' Watch every reply.':phase==='review'?(reviewEligible(ledger.evidence(profile,role),trial.id)?'Familiar board: try it without Help. This later review can earn gear.':'Familiar board: practice whenever you like. A later visit can earn review gear; no hurry.'):trial.instruction+(phase==='independent'&&!novel?' You have seen this board; it counts as practice.':''));
 }
 function render(){
  root.classList.toggle('journey-reduced',motion.checked);overlay.cancel();const c=current(),e=ledger.evidence(profile,role),piece=roles.includes(role as Role);
  $('.learning-stage').textContent=`${learningTrail.indexOf(role)+1}/${learningTrail.length} · ${lessonFlow?stepName(role,ledger.journey(profile,role).step)+' · short mission':phase} · ${names[role]} · ${piece?e.owned+' gear':e.owned==='master'?'Plan badge earned':'Plan practice'}${phase==='review'?' · familiar board · '+(reviewEligible(e,trial.id)&&!support?'independent review':'review practice'):phase==='independent'?' · '+(novel&&!support?'new board':'practice'):''}`;
  $('.learning-badges').textContent=Object.entries(ledger.profile(profile).skills).filter(([skill,e])=>!roles.includes(skill as Role)&&e?.owned==='master').map(([skill])=>skill==='team'?'✦ Team clearing':skill==='prevent'?'◆ Safe camp':skill==='passer'?'✧ Pawn bridge':names[skill as Skill]+' badge').join(' · ');root.querySelector<HTMLSelectElement>('[data-role]')!.value=role;root.querySelector<HTMLSelectElement>('[data-phase]')!.value=phase;
  board.replaceChildren();const visible=mini||phase==='game'?null:clearingSquares(trial,c,plans,guidedChoices()),columns=visible?Math.sqrt(visible.length):8;board.style.gridTemplateColumns=`repeat(${columns},1fr)`;board.style.gridTemplateRows=`repeat(${columns},1fr)`;board.setAttribute('aria-label',columns<8?'Learning forest clearing':'Learning chess board');const targets=selected&&support&&!guidedChoices()?c.moves({square:selected,verbose:true}):[];
  for(let rank=8;rank>=1;rank--)for(const file of 'abcdefgh'){
   const sq=(file+rank)as Square;if(visible&&!visible.includes(sq))continue;const p=c.get(sq),b=document.createElement('button');b.dataset.square=sq;b.className='learning-cell '+((file.charCodeAt(0)+rank)%2?'light':'dark');
   b.setAttribute('aria-label',sq+(p?' '+(p.color==='w'?'White':'Black')+' '+names[p.type]:''));b.setAttribute('aria-pressed',String(selected===sq));b.disabled=busy||animator.active||done||!!promotion||c.turn()!=='w';
   if(p){const symbol=p.color==='b'?enemyGlyphs[p.type]:glyphs[p.type],symbols=root.querySelector<HTMLInputElement>('[data-symbols]')!.checked;b.classList.toggle('chess-symbols',symbols);b.classList.add(p.color==='w'?'friend':'enemy');b.innerHTML=symbols?`<span class="full-symbol" data-role="${p.type}" data-side="${p.color==='b'?'enemy':'friend'}">${symbol}</span>`:actor(p.type,p.color==='b',ledger.evidence(profile,p.type).owned)+`<span class="chess-bridge">${symbol}</span>`;}
   if(p?.type==='k'&&p.color===c.turn()&&c.isCheck())b.classList.add('checked');if(selected===sq)b.classList.add('selected');if(targets.some(m=>m.to===sq))b.classList.add('landing');
   if(roles.includes(role as Role)&&phase!=='mini'&&phase!=='game'&&!p&&trial.accepted.some(m=>m.to===sq))b.innerHTML+='<span class="learning-star" aria-hidden="true">✦</span>';
   if(guidedChoices()&&plans.some(plan=>plan.move.to===sq&&(!selected||plan.move.from===selected))){b.classList.add('adventure-choice');b.innerHTML+='<span class="plan-beacon" aria-hidden="true">↗</span>';b.setAttribute('aria-label',b.getAttribute('aria-label')+' · Preview adventure route');}if(route.target===sq){b.classList.add('plan-preview');b.innerHTML+='<span class="plan-confirm" aria-hidden="true">Go ↗</span>';b.setAttribute('aria-label',sq+' · Confirm this route');}
   b.innerHTML+=`<span class="learning-coordinate">${sq}</span>`;b.onclick=()=>void tap(sq);board.append(b);
  }
  ($('[data-undo]')as HTMLButtonElement).disabled=!c.history().length;
  ($('[data-next]')as HTMLButtonElement).disabled=busy||animator.active||!!promotion;
  ($('[data-hint]')as HTMLButtonElement).disabled=busy||animator.active||done||!!promotion;
  $('.learning-promotion').hidden=!promotion;$('[data-demo]').hidden=!!mini||phase!=='discover'&&phase!=='practice';$('[data-next]').textContent=phase==='review'?(e.owned==='master'?'Next friend →':'Next review →'):'Next →';if(mini){root.querySelector<HTMLSelectElement>('[data-mini-kind]')!.value=mini.kind;root.querySelector<HTMLSelectElement>('[data-mini-variant]')!.value=String(mini.variant);}
  animator.refresh();if(route.value){const m=route.value,p=c.get(m.from);if(p)overlay.show({from:algebraicPoint(m.from),to:algebraicPoint(m.to),piece:p.type,capture:!!c.get(m.to)},'preview',motion.checked);}
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
   if(done){if(lessonFlow&&['practice','independent'].includes(phase))stepReady=completeAttempt(ledger.journey(profile,role),attempt,true,checkStep(role))||journeyReady(ledger.journey(profile,role),checkStep(role));const prior=ledger.evidence(profile,role).owned,e=ledger.credit(profile,role,trial.id,novel,support,true,phase==='review');const badge=!roles.includes(role as Role)&&e.owned==='master'&&prior!=='master';say(badge?`${names[role]} badge earned! ${role==='team'?'The team lights the clearing.':role==='passer'?'The bridge is ready.':role==='prevent'?'The camp is safe.':'Your plan worked.'}`:phase==='review'&&!support&&e.owned!==prior?'Review complete! Your familiar-board practice earned new gear.':support?'Practice complete! Your gear stays. Try without help on a later visit.':'Goal reached! Your friend helped the plan.');if(badge&&!motion.checked){root.dataset.signature=role;}if(badge&&!motion.checked)board.animate([{boxShadow:'0 0 0 4px #ffe39a'},{boxShadow:'0 0 25px #ffe39a00'}],{duration:450});}
   else {novel=false;mark('retried plan');say('Look at their reply. Undo and try a new plan.');}
  }
  save();render();const replied=c.history({verbose:true}).at(-1);if(c.history().length>before&&replied)void animator.play(replied,shots,motion.checked||symbols.checked);voice.sound(done);
 }
 function settle(){const pending=busy||current().turn()==='b';cancel();if(pending)finishTurn();else{save();render();}}
 async function tap(sq:Square){
  if(busy||animator.active||done||promotion||current().turn()!=='w')return;const c=current(),p=c.get(sq);
  if(p?.color==='w'){route.cancel();selected=sq;voice.sound();render();say(guidedChoices()?'Choose a glowing route. See its path, then tap it again to go.':support?trial.concept:'Choose a safe landing.');if(phase==='discover'&&!shown.includes('path demonstration')&&trialHintMove(trial,c)?.from===sq)showTrialDemo();return;}
  if(!selected&&guidedChoices()){const plan=plans.find(p=>p.move.to===sq);if(plan)selected=plan.move.from;}if(!selected){say('Tap your friend first.');return;}
  const options=c.moves({square:selected,verbose:true}).filter(m=>m.to===sq);
  if(!options.length){route.cancel();novel=false;mark('retried landing');save();render();if(guidedChoices()){say('That road is closed. Try another route together.');return;}say('That path does not work. Try again; this board counts as practice.');return;}
  if(guidedChoices()){const plan=plans.find(p=>p.move.from===selected&&p.move.to===sq);if(!plan){route.cancel();render();say('Choose a glowing route, or use the menu to try on your own.');return;}mark('adventure choices');if(route.choose(sq,{from:selected!,to:sq})==='preview'){save();render();say('This is the path. Tap the same glowing stone again to go.');return;}route.cancel();}if(options.some(m=>m.promotion)){promotion={from:selected,to:sq};render();$('[data-promote="q"]').focus();return;}
  await play({from:selected,to:sq});
 }
 async function play(move:InputMove){
  const c=current(),shots=animator.snapshot();route.cancel();promotion=null;
  const played=mini?mini.play(move):(match.beginRound(),match.move(move));if(!played){if(!mini)match.undoRound();render();return;}
  commitAttempt(attempt);selected=null;last=move.to;good=phase==='game'||phase==='mini'||trialMet(trial,move,c);if(!good){novel=false;mark('retried plan');}busy=true;const turn=++token;save();render();
  await animator.play(played,shots,motion.checked||symbols.checked);
  if(token!==turn)return;finishTurn();
 }
 $('.learning-promotion').onclick=e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-promote]');if(!b||!promotion)return;const choice=b.dataset.promote;if(choice==='cancel'){promotion=null;render();return;}void play({...promotion,promotion:choice as InputMove['promotion']});};
 $('[data-demo]').onclick=showTrialDemo;$('[data-hint]').onclick=()=>{route.cancel();if(!mini&&phase!=='game'){mark('extra guidance');mark('adventure choices');try{rebuildPlans({...trial,fen:current().fen()});}catch{say('Look at the changed board. Undo to explore the routes again.');save();render();return;}selected=plans[0]?.move.from??null;save();render();say('Choose a route. Tap once to see the path, then again to go.');return;}if(mini){const move=miniHintMove(mini);mark(move?'answer revealed':'plan reminder');if(move)selected=move.from;save();render();say(miniGoals[mini.kind]+(move?' Try '+move.from+' to '+move.to+'.':' Your board changed. Look at their threat; Undo or try another plan.'));return;}const suggestion=phase==='game'?null:trialHintMove(trial,current());mark(suggestion?'answer revealed':'plan reminder');if(suggestion)selected=suggestion.from;save();render();say(phase==='game'?'Check your king, their threats, then one useful move.':suggestion?trial.concept+' Try '+suggestion.from+' to '+suggestion.to+'.':'Your board changed. Look for the goal, or Undo and try another plan.');};
 $('[data-undo]').onclick=()=>{cancel();novel=false;mark('Undo used');if(mini)mini.undo();else match.undoRound();done=false;selected=null;promotion=null;last=null;save();render();say('Try another plan. Your rewards stay. This board counts as practice.');};
 $('[data-listen]').onclick=()=>voice.replay();$('[data-restart]').onclick=()=>start(phase,true);
 $('[data-next]').onclick=()=>{if(!done&&phase!=='review'&&phase!=='game'){say('Finish this activity, or choose another in the menu.');return;}if(phase==='discover'){const existing=ledger.profile(profile).journeys?.[role];lessonFlow=true;const j=ledger.journey(profile,role);if(!existing&&ledger.evidence(profile,role).owned==='master')j.step=checkStep(role)+1;start('practice');return;}if(lessonFlow&&['practice','independent'].includes(phase)){const journey=ledger.journey(profile,role);if(stepReady)nextJourneyStep(journey);start(journey.step>checkStep(role)?'mini':'practice');return;}if(phase==='independent'&&index===2){index=3;start('independent');return;}if(phase==='review'&&ledger.evidence(profile,role).owned!=='master'){start('review');return;}if(phase==='review'){const next=nextSkill(role);if(next){role=next;index=0;start('discover');}else start('game');return;}index=0;start(phases[(phases.indexOf(phase)+1)%phases.length]);};
 $('[data-close]').onclick=()=>{settle();animator.cancel();root.hidden=true;close();};$('[data-menu]').onclick=()=>{route.cancel();render();menu.hidden=!menu.hidden;};
 root.querySelector<HTMLSelectElement>('[data-role]')!.onchange=e=>{lessonFlow=false;role=(e.target as HTMLSelectElement).value as Skill;index=0;start('discover');};
 root.querySelector<HTMLSelectElement>('[data-phase]')!.onchange=e=>{lessonFlow=false;index=0;start((e.target as HTMLSelectElement).value as Phase);};
 symbols.onchange=()=>{animator.cancel();saveViewSettings(profile==='prin'?'prin':'akin',{symbols:symbols.checked});render();};motion.onchange=()=>{saveViewSettings(profile==='prin'?'prin':'akin',{reducedMotion:motion.checked});settle();};
 function launchMini(kind:MiniKind,variant:0|1){lessonFlow=false;cancel();role=miniSkill[kind];phase='mini';trial=trials.find(t=>t.skill===role)!;match=new Match(trial.fen);mini=new MiniGame(kind,variant);selected=null;promotion=null;done=false;last=null;attempt={version:1,id:'mini-'+kind,startedAt:Date.now(),firstCommit:true,committedFirst:false,support:false,shown:[],credited:false};syncAttempt();ledger.recordSupport(profile,role,[]);novel=ledger.expose(profile,mini.match.start);menu.hidden=true;save();render();say(miniGoals[kind]);}
 $('[data-mini-start]').onclick=()=>launchMini(root.querySelector<HTMLSelectElement>('[data-mini-kind]')!.value as MiniKind,Number(root.querySelector<HTMLSelectElement>('[data-mini-variant]')!.value)as 0|1);$('[data-weak]').onclick=()=>launchMini('weak-pawn',0);
 $('[data-review]').onclick=()=>{const due=Object.entries(ledger.profile(profile).skills).find(([,e])=>e&&e.reviewAt>0&&e.reviewAt<=Date.now());if(due){role=due[0] as Skill;start('review');}};
 window.addEventListener('resize',()=>{if(!root.hidden){settle();animator.cancel();}});window.addEventListener('pagehide',()=>{if(!root.hidden){settle();animator.cancel();}});
 return (id:string,onClose:()=>void,focus?:Skill,training=false)=>{
  cancel();attempt={version:1,id:'',startedAt:0,firstCommit:false,committedFirst:false,support:false,shown:[],credited:false};stepReady=false;profile=id;lessonFlow=false;loadSettings();close=onClose;root.hidden=false;menu.hidden=true;let restored;try{restored=restoreDraft(JSON.parse(localStorage.getItem(draftKey())??'null'));}catch{}
  if(training&&focus&&!(restored?.role===focus&&restored.lessonFlow)){role=focus;index=0;lessonFlow=true;const existing=ledger.profile(profile).journeys?.[role],j=ledger.journey(profile,role);if(!existing&&ledger.evidence(profile,role).owned==='master')j.step=checkStep(role)+1;start('practice');return;}if(focus&&restored?.role!==focus){role=focus;index=0;start('discover');return;}if(restored?.phase==='game'&&toFull){root.hidden=true;close();toFull(profile);return;}if(restored){lessonFlow=restored.lessonFlow===true;({role,phase,trial,match,mini,support,novel,done,index,shown}=restored);selected=null;promotion=null;last=null;attempt=restoreAttempt(restored.attempt,ledger.journey(profile,role),trial.id,current().history().length,done,restored);syncAttempt();rebuildPlans();if(guidedChoices()&&!support)mark('adventure choices');if(done&&lessonFlow){const j=ledger.journey(profile,role);stepReady=journeyReady(j,checkStep(role));}
   // A saved interrupted player move is replayed from its legal history before one reply.
   const history=current().history({verbose:true}),m=history.at(-1);if(m?.color==='w'){last=m.to;good=phase==='mini'||phase==='game'||trialMet(trial,input(m),current());}settle();say(done?'Welcome back. Your completed practice and rewards are saved.':'Welcome back. Continue your plan.');
  }else{role='p';index=0;start('discover');}
 };
}
