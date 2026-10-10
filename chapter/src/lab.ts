import {actor} from './learning/actors';
import {ledger,persistLearning} from './learning/store';
import './learning/room.css';
import './forest-campaign.css';
import {lessons as originalLessons} from './rules';
import {Voice} from './speech';
import {lessons} from './engine/lessons';
import {Session} from './engine/session';
import {lessonAchievement,captureReflection} from './engine/achievement';
import {canOpenLesson,earnedBadges,recordLessonCompletion,freshProgress,nextLesson,restoreProgress,villageComplete,worlds,type CampaignProgress} from './engine/campaign';
import {input,type InputMove,type OpponentTier,type Square} from './engine/chess';
import {TeachingOverlay,algebraicPoint,type VisualMove} from './visual-path';
import './lab.css';
import {groveActor,groveScenery,GroveMotion,rookTravelSquares} from './rook-grove';
import './rook-grove.css';
type Profile='akin'|'prin';
const previewMode=new URLSearchParams(location.search).get('preview'),grovePreview=previewMode==='rook-grove'||previewMode==='forest-adventure';
const key=previewMode==='forest-adventure'?'chessia-forest-preview-campaign-v1':grovePreview?'chessia-rook-preview-campaign-v1':'chessia-campaign-v2',oldKey=previewMode==='forest-adventure'?'chessia-forest-preview-legacy-v1':grovePreview?'chessia-rook-preview-legacy-v1':'chessia-lab-v1';
const glyphs:Record<string,string>={wk:'♔',wq:'♕',wr:'♖',wb:'♗',wn:'♘',wp:'♙',bk:'♚',bq:'♛',br:'♜',bb:'♝',bn:'♞',bp:'♟'};
const records:Partial<Record<Profile,CampaignProgress>>={};
try{const current=JSON.parse(localStorage.getItem(key)||'{}'),old=JSON.parse(localStorage.getItem(oldKey)||'{}');for(const id of ['akin','prin'] as Profile[]){if(current[id]||old[id])records[id]=restoreProgress(current[id],old[id]);}}catch{}
function iconFor(id:string){if(id==='mate-light')return'🐉';if(id.startsWith('rook'))return'♖';if(id.startsWith('bishop'))return'♗';if(id.startsWith('queen'))return'♕';if(id.startsWith('king')||id.startsWith('castle'))return'♔';if(id.startsWith('promotion')||id.startsWith('en-passant'))return'♙';if(id.includes('fork'))return'♘';return'✦';}
export function markLegacyCampaignSeen(id:Profile){for(const lesson of lessons)if(records[id]?.done.includes(lesson.id))ledger.expose(id,lesson.fen);}
export function createLab(goOriginal:(level:number)=>void,voice:Voice,onClose:()=>void){
 const root=document.createElement('section');root.id='chess-lab-panel';root.hidden=true;root.innerHTML=`<div class="lab-shell"><header><div><small>CHESSIA · ADVENTURE MAP</small><h2>The Knight and Toothless</h2></div><button id="lab-close" aria-label="Return to the village">✕</button></header><p id="lab-profile"></p><p id="lab-badges" aria-label="Adventure badges"></p><div class="lab-layout"><nav id="lab-lessons" aria-label="Adventure map"></nav><div class="lab-play"><h3 id="lab-title"></h3><p id="lab-story"></p><p id="lab-status" aria-live="polite"></p><div id="lab-board" role="group" aria-label="Chess board"></div><button id="lab-skip-demo" hidden>Skip demo →</button><button id="lab-repeat-demo" hidden>↻ Replay demo</button><div id="lab-promotion" role="group" aria-label="Choose a new piece" hidden><strong>Choose your new piece</strong><div><button data-promotion="q" aria-label="Promote to Winged Guardian">♕ Guardian</button><button data-promotion="r" aria-label="Promote to Rook">♖ Rook</button><button data-promotion="b" aria-label="Promote to Bishop">♗ Bishop</button><button data-promotion="n" aria-label="Promote to Knight">♘ Knight</button><button data-promotion="cancel">Cancel</button></div></div><div class="lab-actions"><button id="lab-hint">🐉 Help me</button><button id="lab-listen">♫ Listen</button><button id="lab-sound">Sound on</button><button id="lab-undo">↶ Undo</button><button id="lab-restart">↻ Try again</button><button id="lab-next">Next quest →</button></div><p id="lab-help" aria-live="polite"></p><p class="lab-small">♙ Pawn · ♘ Knight · ♗ Bishop · ♖ Rook · ♕ Winged Guardian (queen moves) · ♔ King. Tap a piece, then a square. Help brings back the path. No timer or hint penalty.</p></div></div></div>`;
 document.body.append(root);
 const $=<T extends HTMLElement=HTMLElement>(id:string)=>root.querySelector<T>('#'+id)!;
 const nav=$('lab-lessons'),board=$('lab-board');
 root.insertAdjacentHTML('afterbegin',groveScenery());
 const groveStage=document.createElement('div');groveStage.className='grove-stage';board.before(groveStage);groveStage.append(board);groveStage.insertAdjacentHTML('afterbegin','<div class="grove-banner" aria-hidden="true"><strong>ROOK GROVE</strong><small id="grove-caption"></small></div><div class="grove-dragon" aria-hidden="true"></div>');
 const groveGuidance=document.createElement('div');groveGuidance.className='grove-guidance';$('lab-help').before(groveGuidance);groveGuidance.append($('lab-help'));
 const groveQuests=document.createElement('div');groveQuests.className='grove-quests';groveQuests.setAttribute('aria-label','Rook Grove preview quests');groveQuests.innerHTML='<button data-grove-quest="rook-road">1 · Clear the road</button><button data-grove-quest="rook-capture">2 · Free the guard</button>';$('lab-title').before(groveQuests);
 groveQuests.onclick=e=>{const b=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-grove-quest]');if(b&&!b.disabled)start(b.dataset.groveQuest);};
 const groveMotion=new GroveMotion(board);
 const groveMotionButton=document.createElement('button');groveMotionButton.id='grove-motion';groveMotionButton.hidden=true;groveMotionButton.textContent='Reduce motion';$('lab-sound').after(groveMotionButton);
 let groveTier:'apprentice'|'guardian'|'master'='apprentice';
 const groveTierButton=document.createElement('button');groveTierButton.id='grove-tier';groveTierButton.hidden=true;groveTierButton.setAttribute('aria-label','Preview cosmetic effect tier');root.querySelector('.lab-actions')!.append(groveTierButton);groveTierButton.onclick=()=>{groveTier=groveTier==='apprentice'?'guardian':groveTier==='guardian'?'master':'apprentice';render();};
 const groveMore=document.createElement('button');groveMore.id='grove-more';groveMore.textContent='⚙ More';groveMore.hidden=true;root.querySelector('.lab-actions')!.append(groveMore);groveMore.onclick=()=>{const open=root.classList.toggle('grove-options-open');groveMore.setAttribute('aria-expanded',String(open));};
 groveMotionButton.onclick=()=>{const option=document.querySelector<HTMLInputElement>('#motion')!;option.checked=!option.checked;option.dispatchEvent(new Event('change'));render();};

 for(const [id,label] of [['lab-status','Quest status'],['lab-help','Dragon guidance']]){const el=$(id);el.tabIndex=0;el.setAttribute('role','region');el.setAttribute('aria-label',label);}
 function revealActiveQuest(){const active=nav.querySelector<HTMLElement>('.active');if(!active)return;const item=active.getBoundingClientRect(),box=nav.getBoundingClientRect(),top=box.top+nav.clientTop,bottom=top+nav.clientHeight;if(item.top<top)nav.scrollTop+=item.top-top;else if(item.bottom>bottom)nav.scrollTop+=item.bottom-bottom;}

 const overlay=new TeachingOverlay(board,p=>board.querySelector<HTMLButtonElement>(`button[aria-label^="${String.fromCharCode(97+p.x)}${8-p.y}"]`));
 let profile:Profile|null=null,session:Session|null=null,selected:Square|null=null,promotionPick:{from:Square;to:Square}|null=null,busy=false,demoActive=false,demoShown=false,visualHelp=0,serial=0,oldDone:boolean[]=Array(12).fill(false),feedback='';
 let encounterNovel=false,assisted=true,shownSupports:string[]=[];
 const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.querySelector<HTMLInputElement>('#motion')?.checked===true;
 function visualFor(from:Square,to:Square):VisualMove|null{if(!session)return null;const move=session.chess.moves({square:from,verbose:true}).find(m=>m.to===to);return move?{from:algebraicPoint(from),to:algebraicPoint(to),piece:move.piece,capture:!!move.captured}:null;}
 function clearVisual(){overlay.cancel();if(demoActive){demoActive=false;busy=false;}$('lab-skip-demo').hidden=true;}
 let pending:{id:number;resolve:(move:InputMove|null)=>void}|null=null;
 const newWorker=()=>{const w=new Worker(new URL('./engine/opponent.worker.ts',import.meta.url),{type:'module'});w.onmessage=(e:MessageEvent<{id:number;move:InputMove|null}>)=>{if(pending?.id===e.data.id){pending.resolve(e.data.move);pending=null;}};w.onerror=()=>{pending?.resolve(null);pending=null;w.terminate();if(worker===w)worker=newWorker();};return w;};
 let worker=newWorker();
 function cancelWork(){serial++;groveMotion.cancel();clearVisual();pending?.resolve(null);pending=null;worker.terminate();worker=newWorker();}
 const unlocked=()=>villageComplete(oldDone);
 const progress=()=>records[profile!]?.done??[];
 function close(){cancelWork();root.hidden=true;selected=null;promotionPick=null;busy=false;voice.stop();document.getElementById('app')!.inert=false;document.getElementById('chess-lab')?.focus({preventScroll:true});onClose();}
 function save(){if(!profile)return;const current=records[profile]??freshProgress();if(session){recordLessonCompletion(current,session);if(session.finished&&session.lesson){const l=session.lesson,h=session.chess.history({verbose:true}),m=h.filter(m=>m.color==='w').at(-1)!;ledger.recordSupport(profile!,m.piece,shownSupports);ledger.credit(profile!,m.piece,l.id,encounterNovel,assisted,true);const skill=l.setupGoal?.kind==='fork'?'fork':l.goal.kind==='pin'?'pin':l.goal.kind==='discovery'?'discovery':l.id.startsWith('opening')?'team':l.goal.kind==='defend'||l.goal.kind==='escape-check'?'prevent':l.goal.kind==='promotion'?'passer':null;if(skill){ledger.recordSupport(profile!,skill,shownSupports);ledger.credit(profile!,skill,l.id,encounterNovel,assisted,true);}persistLearning();}}if(session?.mode==='game'&&session.chess.isCheckmate()&&session.chess.turn()==='b'&&current.session?.match.moves.length!==session.chess.history().length)current.wins++;
  current.session=session?.save()??null;records[profile]=current;try{localStorage.setItem(key,JSON.stringify(records));}catch{$('lab-help').textContent='Save unavailable. Keep this page open.';}}
 function start(id?:string,tier:OpponentTier='gentle'){if(id&&!unlocked())return;cancelWork();busy=false;selected=null;promotionPick=null;demoShown=false;visualHelp=0;feedback='';session=new Session(lessons.find(l=>l.id===id),tier);encounterNovel=ledger.expose(profile!,session.match.start);assisted=session.lesson?.ladder!=='independent'||session.hintLevel>0;shownSupports=assisted?['initial concept/hint or legal landing cues']:[];persistLearning();save();render();revealActiveQuest();voice.say(session.lesson?'Tap your piece. Then choose a square.':'Your turn. Tap a piece, then a square.');}
 function worldBadges(){return[...(oldDone.slice(0,6).every(Boolean)?['♙ Pawn Valley']:[]),...(villageComplete(oldDone)?['♘ Knight Bridge']:[]),...earnedBadges(progress())].join(' · ');}
 function describe(){if(!unlocked())return'Finish Pawn Valley and Knight Bridge to open the next world.';if(!session)return'Choose a quest on the map.';if(session.finished)return'★ '+(session.lesson?lessonAchievement(session.lesson):'Game complete!');const end=session.end;if(end==='checkmate')return session.turn==='w'?'Checkmate. Try Undo or Try again.':'Checkmate! The kingdom is safe!';if(end==='stalemate'||end==='repetition'||end==='fifty-move'||end==='insufficient')return`Draw: ${end}. Try another plan.`;if(end==='check')return session.turn==='w'?'Your king is in check.':'The other king is in check.';if(session.onFinalStep)return'The guard moved. Find your second move.';if(session.lesson&&session.turn==='w'&&session.chess.history().length>=2)return'Try Undo and a new plan, or keep looking for a safe path.';return busy?'The guard is thinking…':session.turn==='w'?'Your turn.':'Guard’s turn.';}
 function buildMap(){const scroll=nav.scrollTop;nav.replaceChildren();const add=(label:string)=>{const h=document.createElement('h4');h.textContent=label;nav.append(h);};add('Village Memories');for(let i=0;i<originalLessons.length;i++){const b=document.createElement('button');b.dataset.original=String(i);b.textContent=`${oldDone[i]?'★ ':'🔒 '}${i+1}. ${originalLessons[i].title}`;b.disabled=i>0&&!oldDone[i-1];nav.append(b);}let begin=0;for(const world of worlds){add(`${world.icon} ${world.name}`);for(let i=begin;i<world.end;i++){const l=lessons[i],b=document.createElement('button'),open=canOpenLesson(i,oldDone,progress());b.dataset.lesson=l.id;b.textContent=`${progress().includes(l.id)?'★ ':open?'':'🔒 '}${iconFor(l.id)} ${l.title}`;b.disabled=!open;b.classList.toggle('done',progress().includes(l.id));b.classList.toggle('active',session?.lesson?.id===l.id);nav.append(b);}begin=world.end;}const guide=document.createElement('details');guide.className='lab-plan-guide';guide.innerHTML=`<summary>🐉 Make a plan</summary><p>Before taking: is it safe, and does it help?</p><strong>Opening</strong><p>Bring your team out. Don’t chase every pawn.<br>Hold the center.<br>Bring your friends out.<br>Castle when it is safe and helpful.</p><strong>Middlegame</strong><p>Look for a weak spot.<br>Help each piece do a job.<br>What will they do next? Can we prevent it?</p><strong>Endgame</strong><p>Look for a weak pawn.<br>Let the king help when it is safe.<br>Help a passed pawn reach the far side.</p><p>These are ideas to check, not orders for every board. Taking can help too!</p>`;nav.append(guide);add('♔ Full Chess Game');for(const tier of ['gentle','steady','challenge'] as OpponentTier[]){const b=document.createElement('button');b.dataset.tier=tier;b.textContent=`♔ Play ${tier}`;b.disabled=false;b.classList.toggle('active',session?.mode==='game'&&session.tier===tier);nav.append(b);}nav.scrollTop=scroll;}
 function isGrove(){return previewMode==='rook-grove'&&(session?.lesson?.id==='rook-road'||session?.lesson?.id==='rook-capture');}
 function render(){
  groveMotion.cancel();
  groveTierButton.hidden=!isGrove();groveTierButton.textContent=`FX: ${groveTier[0].toUpperCase()+groveTier.slice(1)}`;root.dataset.groveTier=groveTier;
  groveMotionButton.hidden=!isGrove();groveMore.hidden=!isGrove();$('grove-caption').textContent=session?.lesson?.title??'';groveMotionButton.setAttribute('aria-pressed',String(reduceMotion()));
  for(const b of Array.from(groveQuests.querySelectorAll<HTMLButtonElement>('button'))){const i=lessons.findIndex(l=>l.id===b.dataset.groveQuest);b.disabled=!canOpenLesson(i,oldDone,progress());b.setAttribute('aria-pressed',String(session?.lesson?.id===b.dataset.groveQuest));}
  const actions=root.querySelector('.lab-actions')!;if(isGrove())actions.before(groveGuidance);else actions.after(groveGuidance);
  root.classList.toggle('rook-grove',isGrove());root.classList.toggle('forest-campaign',previewMode!=='classic'&&!isGrove());
  root.classList.toggle('grove-reduced',reduceMotion());
  buildMap();$('lab-profile').textContent=`${profile==='akin'?'Akin':'Prin'} · ${oldDone.filter(Boolean).length}/12 village quests · ${progress().length}/${lessons.length} new quests`;
  $('lab-badges').textContent=(worldBadges()||'Badges mark learning milestones. Hints and Undo always help.')+(records[profile!]?.wins?` · ♔ ${records[profile!]!.wins} full-game win${records[profile!]!.wins===1?'':'s'}`:'');
  $('lab-title').textContent=session?.lesson?.title??(session?'Full Chess Game':'The next world waits');
  $('lab-story').textContent=session?.lesson?.story??(session?'Play a full game with Toothless watching. Keep your king safe!':unlocked()?'Choose your next quest.':'Complete the village bridge first.');
  $('lab-status').textContent=promotionPick?'Choose a piece to finish your pawn move.':selected?'Piece selected. Choose a square.':describe();
  $<HTMLElement>('lab-promotion').hidden=!promotionPick;overlay.cancel();board.replaceChildren();
  if(session){const stage=session.lesson?.ladder,showTargets=!stage||stage==='discover'||stage==='apply'||stage==='plan'||visualHelp>0;
   const allowed=selected&&showTargets?session.chess.moves({square:selected,verbose:true}).map(m=>m.to):[];
   for(let rank=8;rank>=1;rank--)for(const file of 'abcdefgh'){
    const sq=(file+rank) as Square,p=session.chess.get(sq),button=document.createElement('button');
    button.dataset.square=sq;button.className=`lab-square ${(rank+(file.charCodeAt(0)-97))%2?'dark':'light'}`;
    if(p)button.classList.add(p.color==='w'?'white-piece':'black-piece');
    if(allowed.includes(sq))button.classList.add('target');if(selected===sq)button.classList.add('selected');button.setAttribute('aria-pressed',String(selected===sq));if(!selected&&p?.color==='w'&&stage==='discover')button.classList.add('tap-cue');
    button.textContent=p?glyphs[p.color+p.type]:'';if(root.classList.contains('forest-campaign'))button.innerHTML=(p?actor(p.type,p.color==='b',ledger.evidence(profile!,p.type).owned):'')+`<span class="chess-bridge">${p?glyphs[p.color+p.type]:''}</span><span class="learning-coordinate">${sq}</span>`;if(isGrove())button.innerHTML=(p?groveActor(p.type,p.color==='b',groveTier):'')+`<span class="grove-square-label" aria-hidden="true">${sq}</span>`;button.setAttribute('aria-label',`${sq}${p?' '+(p.color==='w'?'White':'Black')+' '+p.type:''}`);
    button.disabled=!!session.lesson&&!unlocked()||busy||!!promotionPick||session.finished||session.chess.isGameOver()||session.turn!=='w';button.onclick=()=>void choose(sq);board.append(button);
   }
  }
  $<HTMLButtonElement>('lab-undo').disabled=!session||!demoActive&&!session.chess.history().length;$<HTMLButtonElement>('lab-hint').disabled=!session?.lesson||session.finished||demoActive;
  $<HTMLButtonElement>('lab-restart').disabled=!session;$<HTMLButtonElement>('lab-next').hidden=!session?.finished||!session.lesson;$('lab-next').textContent=isGrove()&&session?.lesson?.id==='rook-capture'?'Back to first quest':'Next quest →';
  $('lab-sound').textContent=voice.enabled?'Sound on':'Sound off';$('lab-help').textContent=feedback||session?.hint||'';
  $('lab-repeat-demo').hidden=!session?.lesson||session.lesson.ladder!=='discover'||!demoShown||session.finished;
  $<HTMLButtonElement>('lab-repeat-demo').disabled=busy;
  if(selected&&(visualHelp>=2||session?.lesson?.ladder==='discover'&&demoShown)){const suggested=session?.teachingMove;if(suggested?.from===selected){const spec=visualFor(suggested.from,suggested.to);if(spec)overlay.show(spec,'hint',reduceMotion());}}
 }
 async function showDemo(sq:Square){const suggestion=session?.teachingMove;if(!suggestion||suggestion.from!==sq)return;const spec=visualFor(suggestion.from,suggestion.to);if(!spec)return;demoShown=true;assisted=true;if(!shownSupports.includes('path demonstration'))shownSupports.push('path demonstration');const line=spec.piece==='n'?'Two… then one! One jump. Over pieces. Land on a free square or an enemy.':spec.piece==='p'?spec.capture?'Diagonal to free a guard. One move.':'Straight ahead. One move.':'Watch the path. Now you try.';
  if(reduceMotion()){render();overlay.show(spec,'demo',true);voice.say(line);return;}
  render();overlay.show(spec,'hint',reduceMotion());voice.say(line);}

 async function choose(sq:Square){if(!session||!!session.lesson&&!unlocked()||busy||promotionPick||session.finished||session.chess.isGameOver()||session.turn!=='w')return;
  const p=session.chess.get(sq);if(p?.color==='w'){overlay.cancel();selected=sq;feedback=session.lesson?.ladder==='independent'&&visualHelp===0?'Choose a landing square.':'Choose a glowing square.';voice.sound();voice.stop();render();if(session.lesson?.ladder==='discover'&&!demoShown)await showDemo(sq);return;}
  if(!selected){feedback='Tap one of your pieces first.';voice.say(feedback);render();return;}const opts=session.chess.moves({square:selected,verbose:true}).filter(m=>m.to===sq);if(!opts.length){feedback='That move does not work. Choose another square.';render();if(!reduceMotion())board.querySelector<HTMLButtonElement>(`button[aria-label^="${sq}"]`)?.animate([{boxShadow:'inset 0 0 0 5px #ffcc77'},{boxShadow:'none'}],{duration:350});voice.say(feedback);return;}
  overlay.cancel();if(opts.some(m=>m.promotion)){promotionPick={from:selected,to:sq};render();root.querySelector<HTMLButtonElement>('#lab-promotion [data-promotion="q"]')?.focus({preventScroll:true});return;}await playMove({from:selected,to:sq});}
 async function playMove(moveInput:InputMove){
  if(!session)return;const active=session,token=serial,grove=isGrove(),origin=board.querySelector<HTMLButtonElement>(`button[aria-label^="${moveInput.from}"]`)?.getBoundingClientRect(),capturedActor=grove?board.querySelector<HTMLElement>(`button[aria-label^="${moveInput.to}"] .grove-actor`)?.outerHTML:undefined;
  clearVisual();promotionPick=null;const move=session.play(moveInput);selected=null;if(!move){render();return;}
  feedback=session.finished&&session.lesson?'✦ '+lessonAchievement(session.lesson):move.captured?captureReflection:'';voice.sound(session.finished);save();render();
  let flight=Promise.resolve(true);if(grove&&origin){const destination=board.querySelector<HTMLButtonElement>(`button[aria-label^="${move.to}"]`);if(destination)flight=groveMotion.move(origin,destination,move.captured?capturedActor:undefined,reduceMotion(),move.piece==='r'?rookTravelSquares(move.from,move.to):[],groveTier);}
  if(session.finished){voice.say(session.lesson?lessonAchievement(session.lesson):'Game complete!');return;}
  if(move.captured)voice.say(captureReflection);if(session.chess.isGameOver())return;
  if(session.chess.turn()==='b'){if(grove){busy=true;await flight;if(token!==serial||session!==active||root.hidden)return;}await reply();}
 }
 async function reply(){if(!session)return;const active=session,token=++serial;busy=true;render();const scripted=active.lesson?.reply;if(scripted){active.reply(scripted);busy=false;save();render();return;}const move=await new Promise<InputMove|null>(resolve=>{pending={id:token,resolve};worker.postMessage({id:token,save:active.match.save(),tier:active.tier});});if(token!==serial||session!==active)return;const fallback=active.chess.moves({verbose:true})[0];if(move||fallback)active.reply(move??input(fallback));busy=false;save();render();}
 $('lab-close').onclick=close;
 $('lab-skip-demo').onclick=()=>{if(!demoActive)return;clearVisual();demoShown=true;selected=null;voice.stop();render();};
 $('lab-repeat-demo').onclick=()=>{if(busy||!session)return;const sq=session.teachingMove?.from;if(sq)void showDemo(sq);};
 $('lab-promotion').onclick=e=>{const button=(e.target as HTMLElement).closest<HTMLButtonElement>('button[data-promotion]');if(!button||!promotionPick)return;const choice=button.dataset.promotion;if(choice==='cancel'){promotionPick=null;selected=null;render();return;}const {from,to}=promotionPick;void playMove({from,to,promotion:choice as InputMove['promotion']});};
 $('lab-hint').onclick=()=>{if(session&&!demoActive){assisted=true;if(!shownSupports.includes('hint requested'))shownSupports.push('hint requested');ledger.recordSupport(profile!,session.lesson?.goal.piece??'team',['hint requested']);feedback='';visualHelp=Math.min(3,visualHelp+1);const line=session.askHint();voice.say(line);save();render();}};
 $('lab-listen').onclick=()=>voice.replay();$('lab-sound').onclick=()=>{voice.enabled=!voice.enabled;if(!voice.enabled)voice.stop();if(demoActive){clearVisual();demoShown=true;}render();};
 $('lab-undo').onclick=()=>{if(session){cancelWork();busy=false;encounterNovel=false;promotionPick=null;session.undo();selected=null;feedback='';save();render();voice.say('Try a new plan.');}};
 $('lab-restart').onclick=()=>{if(session)start(session.lesson?.id,session.tier);};
 $('lab-next').onclick=()=>{if(!session?.lesson)return;if(isGrove()&&session.lesson.id==='rook-capture'){start('rook-road');return;}const i=lessons.findIndex(l=>l.id===session!.lesson!.id);if(i<lessons.length-1)start(lessons[i+1].id);else start(undefined,'gentle');};
 nav.onclick=e=>{const b=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!b||b.disabled)return;if(b.dataset.original){const i=Number(b.dataset.original);close();goOriginal(i);}else if(b.dataset.lesson)start(b.dataset.lesson);else if(b.dataset.tier)start(undefined,b.dataset.tier as OpponentTier);};
 window.addEventListener('resize',()=>{if(root.hidden)return;clearVisual();demoShown=true;voice.stop();render();});
 return (id:Profile,completed:boolean[])=>{cancelWork();profile=id;oldDone=[...completed];demoShown=false;visualHelp=0;root.hidden=false;document.getElementById('app')!.inert=true;$('lab-close').focus({preventScroll:true});encounterNovel=false;assisted=true;shownSupports=[];const saved=records[id]?.session;session=saved?Session.restore(saved):null;if(session?.lesson){const i=lessons.findIndex(l=>l.id===session!.lesson!.id);if(!canOpenLesson(i,oldDone,progress()))session=null;}else if(session&&session.mode!=='game')session=null;if(!session&&unlocked()){const next=nextLesson(progress());start(next?.id,'gentle');}else{selected=null;busy=false;render();revealActiveQuest();voice.say(session?'Tap your piece. Then choose a square.':describe());if(session?.turn==='b'&&!session.finished)void reply();}};
}
