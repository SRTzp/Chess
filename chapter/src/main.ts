import Phaser from 'phaser';
import './style.css';
import './visual-path.css';
import {Garden} from './scene';
import {Voice} from './speech';
import {recordings} from './narration';
import {createLab} from './lab';
import {TeachingOverlay,type VisualMove} from './visual-path';
import {ChapterGame,lessons,teachingStages,boardCells,boardSize,kind,goalCell,forkTargets,legal,same,solution,copy,validState,type State,type Cell,type Piece} from './rules';
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
type Profile='akin'|'prin';
type Save={level:number;state:State;history:State[];completed:boolean[];help:number;danger:boolean;introSeen:boolean};
const names={akin:'Akin',prin:'Prin'},key='chessia-pawn-chapter-v1';
const records:Partial<Record<Profile,Save>>={};
try{const raw=JSON.parse(localStorage.getItem(key)||'{}');for(const id of ['akin','prin'] as Profile[]){const v=raw[id];if(v&&Number.isInteger(v.level)&&v.level>=0&&v.level<lessons.length&&validState(v.state,v.level)){records[id]={...v,completed:Array.from({length:lessons.length},(_,i)=>v.completed?.[i]===true),history:Array.isArray(v.history)?v.history.filter((s:unknown)=>validState(s,v.level)).slice(-60):[],help:Number.isInteger(v.help)?Math.max(0,Math.min(3,v.help)):0,danger:v.danger===true,introSeen:v.introSeen===true};}}}catch{}
let profile:Profile|null=null,game=new ChapterGame(),selected:string|null=null,help=1,danger=false,started=false,busy=false,demoActive=false,demoShown=false,epoch=0,sceneReady=false,completed=Array(lessons.length).fill(false) as boolean[];
const scene=new Garden(),voice=new Voice();scene.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;$<HTMLInputElement>('motion').checked=scene.reduced;
const openLab=createLab(level=>{if(level===0||completed[level-1])loadLevel(level);},voice,()=>update(false));
const guided=()=>teachingStages[game.state.level]!=='independent'||help>0;
const chooseLine=()=>guided()?'Tap a glowing stone.':'Choose a landing stone.';
const beginLine=()=>game.state.level===1&&!game.state.helperMoved?'Tap your pawn, then the friend in front.':game.state.level<7?'Tap your pawn. Then choose a stone.':'Tap your knight. Then choose a stone.';
const fill=(text:string)=>text.replaceAll('{name}',profile?names[profile]:'Hero');
function say(text:string){const line=fill(text);$('line').textContent=line;voice.say(line,recordings[text]?`${import.meta.env.BASE_URL}audio/${recordings[text]}`:undefined);}
function profileLabels(){for(const id of ['akin','prin'] as Profile[]){const done=records[id]?.completed??[];const n=done.filter(Boolean).length;document.querySelector(`[data-profile="${id}"] .portrait`)?.classList.toggle('awarded',done.slice(0,6).filter(Boolean).length===6);$(id+'-progress').textContent=n===12?'♞ Knight badge earned':n?`Continue · ${n}/12 complete`:'Start adventure';}}
function save(){if(!profile)return;records[profile]={level:game.state.level,state:game.snapshot,history:copy(game.history),completed:[...completed],help,danger,introSeen:started};try{localStorage.setItem(key,JSON.stringify(records));}catch{$('save-warning').hidden=false;$('speaker').textContent='Cannot save. Keep this page open to finish.';}profileLabels();}
let cells=boardCells(0);let cellButtons:HTMLButtonElement[]=[];
function buildCells(){cells=boardCells(game.state.level);$('cells').replaceChildren();const width=boardSize(game.state.level).width;cellButtons=cells.map((p,i)=>{const b=document.createElement('button');b.className='cell';b.dataset.cell=`${p.x},${p.y}`;b.tabIndex=i===22?0:-1;b.onclick=()=>void choose(p);b.onkeydown=e=>{const shifts:Record<string,number>={ArrowUp:-width,ArrowDown:width,ArrowLeft:-1,ArrowRight:1},d=shifts[e.key];if(!d)return;e.preventDefault();const j=i+d;if(j>=0&&j<cells.length&&(Math.abs(d)===width||Math.floor(j/width)===p.y)){cellButtons.forEach(x=>x.tabIndex=-1);cellButtons[j].tabIndex=0;cellButtons[j].focus();}};$('cells').append(b);return b;});}
buildCells();
const visual=new TeachingOverlay($('world'),p=>cellButtons.find(b=>b.dataset.cell===`${p.x},${p.y}`)??null);
function visualMove(piece:Piece,to:Cell):VisualMove|null{if(!legal(game.state,piece).some(q=>same(q,to)))return null;return{from:{x:piece.x,y:piece.y},to,piece:kind(piece)==='knight'?'n':kind(piece)==='rook'?'r':'p',capture:game.state.pieces.some(q=>q.side==='enemy'&&same(q,to))};}
function clearVisual(){visual.cancel();demoActive=false;$('visual-skip').hidden=true;}
function visualHint(){const next=solution(game.state)?.[0],p=next&&game.state.pieces.find(q=>q.id===next.id);if(!p)return;const spec=visualMove(p,next!.to);if(spec)visual.show(spec,'hint',scene.reduced);}
const stageButtons=lessons.map((l,i)=>{const b=document.createElement('button');b.textContent=String(i%6+1);b.dataset.level=String(i);b.setAttribute('aria-label',`Chapter ${Math.floor(i/6)+1}, Level ${i%6+1}: ${l.title}`);b.onclick=()=>loadLevel(i);$('progress').append(b);return b;});
scene.layout=(x,y,c)=>{cellButtons.forEach((b,i)=>Object.assign(b.style,{left:`${x+cells[i].x*c}px`,top:`${y+cells[i].y*c}px`,width:`${c}px`,height:`${c}px`}));visual.refresh();};
function update(render=true){$('app').inert=!profile||document.getElementById('chess-lab-panel')?.hidden===false;const s=game.state,l=lessons[s.level];if(cells.length!==boardCells(s.level).length)buildCells();if(render&&sceneReady)scene.sync(game.snapshot,selected,help,danger,help>=3?solution(s)?.[0]??null:null);
 $('title').textContent=l.title;$('chapter-label').textContent=`${profile?names[profile]+' · ':''}Chapter ${Math.floor(s.level/6)+1} · Level ${s.level%6+1}/6`;$('goal').textContent='★ '+l.goal;$('lesson-symbol').textContent=l.icon;
 $('turn').textContent=busy?'Moving…':s.status==='won'?'✦ You did it!':s.status==='lost'?'↶ Try again':'♟ Your turn';
 $('visual-repeat').hidden=!profile||!started||teachingStages[s.level]!=='discover'||s.status!=='playing'||demoActive;$<HTMLButtonElement>('visual-repeat').disabled=busy;
 $('visual-skip').hidden=!demoActive;
 $('story').hidden=!profile||started;$('story-title').textContent=l.title;$('story-text').textContent=fill(l.intro);$('result').hidden=!profile||busy||!started||s.status==='playing';
 const won=s.status==='won';$('result-icon').textContent=won?(s.level===11?'♞':s.level===5?'🐉':'✦'):'↶';$('result-title').textContent=won?(s.level===11?'Bridge Hero!':s.level===5?'Village Hero!':'You did it!'):'Undo and try again';$('result-text').textContent=won?fill(l.done):'Look where the enemy moved. Undo and try a new move.';$('next').hidden=!won;$('next').textContent=s.level===11?'Adventure map →':s.level===5?'Meet the knight →':'Next →';$('retry-result').hidden=won;$('retry-result').textContent=game.history.length?'↶ Undo':'↻ Restart';
 $<HTMLButtonElement>('undo').disabled=!profile||!started||!game.history.length&&!demoActive;$<HTMLButtonElement>('hint').disabled=!profile||!started||busy||s.status!=='playing';$<HTMLButtonElement>('danger').disabled=!profile||!started||busy||s.status!=='playing'||!s.pieces.some(p=>p.side==='enemy');$<HTMLButtonElement>('settings').disabled=busy;
 cellButtons.forEach((b,i)=>{b.disabled=!profile||!started||busy||s.status!=='playing';const occupant=s.pieces.find(q=>same(q,cells[i]));const active=s.pieces.find(q=>q.id===selected);b.classList.toggle('tap-selected',!!occupant&&occupant.id===selected);b.setAttribute('aria-pressed',String(!!occupant&&occupant.id===selected));b.classList.toggle('tap-cue',!selected&&occupant?.side==='hero'&&teachingStages[s.level]==='discover'&&!busy);b.classList.toggle('tap-destination',!!active&&legal(s,active).some(q=>same(q,cells[i]))&&(teachingStages[s.level]==='discover'||teachingStages[s.level]==='apply'||help>0));const p=s.pieces.find(p=>same(p,cells[i]));b.setAttribute('aria-label',`Square ${cells[i].x+1}, ${cells[i].y+1}${p?' '+(p.side==='hero'?'Your '+kind(p):p.side==='friend'?'Friendly '+kind(p):'Cursed '+kind(p)):''}`);});
 document.querySelectorAll<HTMLButtonElement>('[data-chapter]').forEach(b=>{const chapter=Number(b.dataset.chapter);b.disabled=busy||(chapter===1&&!completed[5]);b.setAttribute('aria-pressed',String(chapter===Math.floor(s.level/6)));});
 stageButtons.forEach((b,i)=>{b.hidden=Math.floor(i/6)!==Math.floor(s.level/6);b.disabled=!profile||busy||(i>0&&!completed[i-1]);b.classList.toggle('current',i===s.level);b.classList.toggle('done',completed[i]);b.setAttribute('aria-current',i===s.level?'step':'false');});$('sound').textContent=voice.enabled?'♫':'♪̸';$('sound').setAttribute('aria-label',voice.enabled?'Mute sound':'Unmute sound');}
function outcome(){if(game.state.status==='won'){completed[game.state.level]=true;scene.celebrate();voice.sound(true);say(lessons[game.state.level].done);}else if(game.state.status==='lost')say('That is okay. Tap Undo. We can try together.');else say('Your turn. Look before you move.');save();update();}
function loadLevel(level:number){epoch++;scene.cancel();clearVisual();voice.stop();busy=false;demoShown=false;game=new ChapterGame(level);selected=null;help=lessons[level].help;danger=false;started=true;save();update();say(beginLine());}
function undo(){epoch++;scene.cancel();clearVisual();busy=false;voice.stop();if(game.undo()){selected=null;say('Back to your last turn. Try a new plan!');save();update();}else update();}
async function showOriginalDemo(piece:Piece,to:Cell){const spec=visualMove(piece,to);if(!spec)return;demoShown=true;const line=kind(piece)==='knight'?'Two… then one! One jump. Over pieces. Land on a free square or an enemy.':spec.capture?'Straight to move. Diagonal to free a guard.':'Straight ahead. Now you try!';
 if(scene.reduced){visual.show(spec,'demo',true);say(line);update(false);return;}
 visual.show(spec,'hint',scene.reduced);say(line);update(false);}

async function choose(p:Cell){if(!profile||!started||busy||game.state.status!=='playing')return;const s=game.state,target=s.pieces.find(q=>same(q,p));if(target?.side==='hero'){clearVisual();selected=target.id;voice.sound();say(kind(target)==='knight'?`Two, then one. ${chooseLine()}`:chooseLine());update();if(teachingStages[s.level]==='discover'&&!demoShown){const first=solution(s)?.[0];if(first?.id===target.id)await showOriginalDemo(target,first.to);}else if(help>=2||teachingStages[s.level]==='discover')visualHint();return;}
 if(!selected){if(target?.side==='enemy'){danger=!danger;say(kind(target)==='rook'?'The rook moves in straight lines. Look for the warning marks.':'Enemy pawns move down and capture diagonally down. Look for the warning marks.');update();}else say(s.level<7?'Tap your pawn first.':'Tap your knight or pawn first.');return;}
 if(s.level===1&&!s.helperMoved&&target?.side==='friend'){
  busy=true;const token=++epoch;update(false);say('Pawns cannot jump over pieces. Watch our friend move to clear the path.');await scene.pause(350);if(token!==epoch)return;const r=game.openPath();if(r)await scene.animate(r.id,r.from,r.to);if(token!==epoch)return;busy=false;say('Our friend has moved. The square ahead is clear. Follow along!');save();update();return;
 }
 const hero=s.pieces.find(q=>q.id===selected)!;const shape=visualMove(hero,p);
 if(!shape){const button=cellButtons.find(b=>b.dataset.cell===`${p.x},${p.y}`);if(!scene.reduced)button?.animate([{background:'#ffc46b88'},{background:'transparent'}],{duration:350});say(guided()?'Try a glowing stone.':'That move does not work. Try another stone.');if(teachingStages[s.level]!=='independent')visualHint();return;}
 clearVisual();const r=game.move({id:selected,to:p});if(!r){say('Not that square. Try another, or tap me for help.');return;}
 const madeFork=game.state.level===10&&game.state.pieces.some(p=>p.side==='hero'&&forkTargets(game.state,p).length>=2);
 const movingId=selected,token=++epoch;selected=null;busy=true;save();update(false);voice.sound();await scene.animate(movingId,r.from,p,!!r.captured);if(token!==epoch)return;scene.sync(game.snapshot,null,help,danger);
 if(game.state.status==='playing'){
  if(madeFork){say('One jump. Two threats! You made a fork. Watch which rook moves.');await scene.pause(600);if(token!==epoch)return;}
  if(game.state.pieces.some(q=>q.side==='enemy')){say('The guards are moving. Watch closely.');await scene.pause(200);if(token!==epoch)return;}
  const reply=game.reply();if(reply)await scene.animate(reply.id,reply.from,reply.to,!!reply.captured);if(token!==epoch)return;
 }
 busy=false;outcome();}
$('begin').onclick=async()=>{if(busy||started)return;started=true;scene.dragonCue('flap');save();say(lessons[game.state.level].guide);const level=game.state.level,p=game.state.pieces.find(p=>p.side==='hero')!;selected=null;update();
 if([0,2,4].includes(level)&&game.state.round===0){const to=level===0?{x:p.x,y:p.y-1}:level===2?{x:p.x+1,y:p.y-1}:{x:p.x,y:p.y-2};await showOriginalDemo(p,to);}
};
$('undo').onclick=undo;$('retry-result').onclick=()=>game.history.length?undo():loadLevel(game.state.level);
$('hint').onclick=()=>{scene.dragonCue('hint');help=Math.min(3,help+1);if(help>=2)danger=true;const path=solution(game.state);if(game.state.level===1&&!game.state.helperMoved){selected='a';say('Tap the square with your friend. Can you move through it?');}else if(help===3&&path?.length){selected=path[0].id;say(`Look at this ${kind(game.state.pieces.find(p=>p.id===selected)!)} and the little star.`);}else if(help===3&&!path){say('This path cannot reach the goal. Try Undo or restart this level.');}else{selected=help>=2&&path?.length?path[0].id:selected??game.state.pieces.find(p=>p.side==='hero')?.id??null;say(help===1?'The gold borders show where you can land.':'The path shows the shape. Only the landing square matters for a knight.');}save();update();if(help>=2&&path?.length)visualHint();};
$('visual-repeat').onclick=()=>{if(busy||!profile||!started)return;const next=solution(game.state)?.[0],piece=next&&game.state.pieces.find(p=>p.id===next.id);if(piece)void showOriginalDemo(piece,next!.to);};
$('visual-skip').onclick=()=>{if(!demoActive)return;epoch++;clearVisual();busy=false;voice.stop();update(false);};
$('danger').onclick=()=>{scene.dragonCue('hint');danger=!danger;say(danger?(game.state.pieces.some(p=>kind(p)==='rook')?'Rooks attack in straight lines. Look for the warning marks.':'Enemy pawns capture diagonally down. Look for the warning marks.'):'Try finding the enemy attacks on your own.');save();update();};
$('replay').onclick=()=>voice.replay();$('story-replay').onclick=()=>say(lessons[game.state.level].intro);
$('next').onclick=()=>game.state.level===11?(profile&&openLab(profile,completed)):loadLevel(game.state.level+1);
function camp(){epoch++;scene.cancel();clearVisual();voice.stop();busy=false;if(game.state.turn==='enemy')game.reply();if(game.state.status==='won')completed[game.state.level]=true;save();profile=null;selected=null;$('profiles').hidden=false;update();}
document.querySelectorAll<HTMLButtonElement>('[data-chapter]').forEach(b=>b.onclick=()=>loadLevel(Number(b.dataset.chapter)*6));
$('camp').onclick=camp;$('home').onclick=e=>{e.preventDefault();camp();};
$('chess-lab').onclick=()=>{if(profile){epoch++;scene.cancel();clearVisual();voice.stop();busy=false;if(game.state.turn==='enemy')game.reply();save();openLab(profile,completed);}};
document.querySelectorAll<HTMLButtonElement>('[data-profile]').forEach(b=>{b.disabled=true;b.onclick=()=>{profile=b.dataset.profile as Profile;epoch++;scene.cancel();clearVisual();busy=false;demoShown=false;selected=null;const saved=records[profile];if(saved){game=new ChapterGame(saved.level);game.state=copy(saved.state);game.history=copy(saved.history);completed=[...saved.completed];help=saved.help;danger=saved.danger;started=saved.introSeen;if(game.state.turn==='enemy')game.reply();if(game.state.status==='won')completed[game.state.level]=true;}else{game=new ChapterGame();completed=Array(lessons.length).fill(false);help=1;danger=false;started=false;}started=true;$('profiles').hidden=true;update();say(game.state.status==='won'?lessons[game.state.level].done:beginLine());};});
const options=$<HTMLDialogElement>('options');$('settings').onclick=()=>{voice.stop();options.showModal();};$('close-options').onclick=()=>options.close();$('restart').onclick=()=>{options.close();loadLevel(game.state.level);};const applyMotion=()=>{scene.reduced=$<HTMLInputElement>('motion').checked;document.body.classList.toggle('reduced-motion',scene.reduced);};applyMotion();$('motion').onchange=()=>{applyMotion();epoch++;scene.cancel();clearVisual();busy=false;voice.stop();if(game.state.turn==='enemy')game.reply();update();};$('sound').onclick=()=>{voice.enabled=!voice.enabled;if(!voice.enabled)voice.stop();update(false);};
voice.onMissing=()=>{$('voice-warning').hidden=false;$('speaker').textContent='Toothless · English voice unavailable. Follow the pictures.';};
window.addEventListener('pagehide',()=>{save();voice.stop();});
window.addEventListener('resize',()=>{if(!profile||document.getElementById('chess-lab-panel')?.hidden===false)return;epoch++;scene.cancel();clearVisual();voice.stop();busy=false;if(game.state.turn==='enemy')game.reply();update();});
scene.ready=()=>{sceneReady=true;document.querySelectorAll<HTMLButtonElement>('[data-profile]').forEach(b=>b.disabled=false);update();};profileLabels();
new Phaser.Game({type:Phaser.AUTO,parent:'canvas',backgroundColor:'#234932',pixelArt:true,scale:{mode:Phaser.Scale.RESIZE,width:$('canvas').clientWidth,height:$('canvas').clientHeight},scene:[scene],audio:{noAudio:true}});
