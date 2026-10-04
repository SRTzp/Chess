export type Cell={x:number;y:number};
export type Piece=Cell&{id:string;side:'hero'|'friend'|'enemy';moved:boolean;kind?:'pawn'|'knight'|'rook'};
export type State={level:number;pieces:Piece[];turn:'player'|'enemy';status:'playing'|'won'|'lost';round:number;helperMoved:boolean;forked?:boolean};
export type Move={id:string;to:Cell};
export const WIDTH=5,HEIGHT=6;
export const same=(a:Cell,b:Cell)=>a.x===b.x&&a.y===b.y;
export const copy=<T>(v:T):T=>structuredClone(v);
export const cells:Cell[]=Array.from({length:WIDTH*HEIGHT},(_,i)=>({x:i%WIDTH,y:Math.floor(i/WIDTH)}));
export const inside=(p:Cell)=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.x<WIDTH&&p.y>=0&&p.y<HEIGHT;
export const boardSize=(level:number)=>level<6?{width:5,height:6}:{width:8,height:8};
export const boardCells=(level:number):Cell[]=>{const d=boardSize(level);return Array.from({length:d.width*d.height},(_,i)=>({x:i%d.width,y:Math.floor(i/d.width)}));};
export const onBoard=(s:State,p:Cell)=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<boardSize(s.level).width&&p.y<boardSize(s.level).height;
export const kind=(p:Piece)=>p.kind??'pawn';
const piece=(id:string,x:number,y:number,side:Piece['side']='hero'):Piece=>({id,x,y,side,moved:false});
export const lessons=[
 {title:'A Call in the Mist',skill:'Move forward one square',icon:'↑',goal:'Find Toothless',intro:'Listen… Someone is hiding in the mist. It is a little dragon! His name is Toothless. “I cannot find my way home. Will you help me?” A path of stones leads into the forest. Your adventure starts with one small step.',guide:"This little hero is your pawn. Watch it move one square forward. Now you try! Tap your pawn, then the square ahead.",done:"You found Toothless! Thank you! Will you come with me?",help:1},
 {title:'A Friend in the Way',skill:'Pawns cannot jump over pieces',icon:'↑ ▣',goal:'Wait for your friend, then follow',intro:"Toothless spots a friend on the path. Can your pawn move forward with someone in the way?",guide:"A pawn cannot jump over another piece. Tap your friend. Let us ask him to clear the path.",done:"The path was clear, so your pawn could follow. Come on! Our friend has spotted something in the mist.",help:1},
 {title:'The Wooden Shield',skill:'Capture one square diagonally forward',icon:'↗',goal:'Free the guard',intro:"Oh! The mist has put a spell on a guard. Capture his piece to break the spell and set him free!",guide:"Pawns move straight ahead, but capture diagonally. That means one square forward and one to the side. Watch, then try!",done:"The guard is free! Move straight. Capture diagonally. Two different moves!",help:1},
 {title:'Across the Garden',skill:'Choose a move or a capture',icon:'↑ ↗',goal:'Move closer, then free the guard',intro:"Another guard is coming through the garden. Toothless stays close. This time, you choose the way.",guide:"Look before you move. Can you capture yet, or do you need to move closer? Watch what changes after the guard moves.",done:"You moved closer, then spotted your capture! Beyond the garden, a golden star lights the path.",help:0},
 {title:'The First Big Step',skill:'A pawn may move two squares on its first move',icon:'↑ ↑',goal:'Reach the star',intro:"The star is just ahead! Your pawn is on its starting square. It has not moved yet.",guide:"On its first move, a pawn may go one or two squares forward. For two steps, both squares must be empty. Watch, then choose!",done:"You reached the star! After a pawn has moved, it cannot take that two-square first step again.",help:1},
 {title:'Open the Gate',skill:'Choose a pawn and watch the enemy',icon:'♟ ♟',goal:'Free both guards',intro:"The village gate is near! But two guards are still under the spell. You have two pawns to help them. Toothless is counting on you!",guide:"Choose one pawn to move each turn. Then watch the guards. Look for captures, and keep your pawns safe. I am here if you need help.",done:"Both guards are free. The gate swings open! You and Toothless did it together. Here is your dragon badge!",help:0},
 {title:'Beyond the Village',skill:'Remember pawn moves',icon:'↑ ↗',goal:'Free the guard',intro:'Toothless finds a new path beyond the gate. A guard is lost in the mist. Can you help without the glowing path?',guide:'Remember your pawn. Move straight. Capture diagonally forward. Watch the guard move too.',done:'You remembered! A knight on horseback is waiting by the bridge.',help:0},
 {title:'Meet the Knight',skill:'Jump in an L shape',icon:'♞',goal:'Jump to the star',intro:'Meet your new friend, the knight! His horse can make a special jump.',guide:'Watch: two squares, then one to the side. One L-shaped jump! Tap your knight, then the star.',done:'Your first knight jump! A knight can jump in any direction, always in an L shape.',help:1},
 {title:'Over Our Friends',skill:'Jump over pieces',icon:'♞ ↷',goal:'Jump over friends to the star',intro:'Our friends are resting on the bridge. A pawn cannot jump over them. What about a knight?',guide:'The knight can jump over pieces. Land on an empty square or an enemy, never on a friend. Find the star!',done:'You jumped over your friends! Only the landing square matters for a knight.',help:1},
 {title:'A Safe Landing',skill:'Look before you jump',icon:'♞ !',goal:'Reach the star safely',intro:'A stone rook is guarding the bridge. It moves in straight lines. Choose your landing square carefully.',guide:'A legal jump may still be dangerous. Look where the rook can capture. Reach the star without losing your knight.',done:'You found a safe way! Toothless spots two more stone guards ahead.',help:0},
 {title:'One Jump, Two Threats',skill:'A knight fork',icon:'♞ ⚔',goal:'Fork two rooks, then capture one',intro:'Two rooks block the path. Can one knight threaten both at the same time?',guide:'Jump to a square that attacks both rooks. That is a fork! They get one move. Then capture a rook you still attack.',done:'One jump. Two threats! One rook moved away, and you captured the other. That is the power of a fork.',help:1},
 {title:'Across the Bridge',skill:'Choose the right piece',icon:'♟ ♞',goal:'Free the guard and bring the knight to the star',intro:'The bridge is almost open. Your pawn and knight must work together. Look carefully: one friend is in danger!',guide:'Choose which piece should move first. Free the guard, then bring your knight to the star. Ask Toothless if you need help.',done:'Your pawn and knight worked together! The bridge is open. You earned the knight badge!',help:0},
] as const;
export function initial(level:number):State {
 const setups:Piece[][]=[
 [piece('a',2,4)],
 [piece('a',2,4),piece('friend',2,3,'friend')],
 [piece('a',2,4),piece('e',3,3,'enemy')],
 [piece('a',2,4),piece('e',3,1,'enemy')],
 [piece('a',2,4)],
 [piece('a',1,4),piece('b',3,4),piece('e',0,1,'enemy'),piece('f',4,1,'enemy')],
 [piece('a',2,5),piece('e',3,2,'enemy')],
 [{...piece('n',1,7),kind:'knight'}],
 [{...piece('n',1,7),kind:'knight'},piece('f1',0,7,'friend'),piece('f2',2,7,'friend'),piece('f3',1,6,'friend'),piece('f4',2,5,'friend')],
 [{...piece('n',1,7),kind:'knight'},{...piece('r',3,3,'enemy'),kind:'rook'}],
 [{...piece('n',4,4),kind:'knight'},{...piece('r1',1,1,'enemy'),kind:'rook'},{...piece('r2',5,1,'enemy'),kind:'rook'}],
 [piece('a',4,4),{...piece('n',1,7),kind:'knight'},piece('e',5,3,'enemy')],
 ];
 return {level,pieces:copy(setups[level]),turn:'player',status:'playing',round:0,helperMoved:false};
}
export function legal(s:State,p:Piece):Cell[]{
 if(kind(p)==='knight')return [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].map(([dx,dy])=>({x:p.x+dx,y:p.y+dy})).filter(q=>onBoard(s,q)&&!s.pieces.some(t=>same(t,q)&&(t.side==='enemy')===(p.side==='enemy')));
 if(kind(p)==='rook'){
  const moves:Cell[]=[];
  for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]])for(let n=1;n<8;n++){
   const q={x:p.x+dx*n,y:p.y+dy*n};if(!onBoard(s,q))break;
   const t=s.pieces.find(t=>same(t,q));if(!t||(t.side==='enemy')!==(p.side==='enemy'))moves.push(q);if(t)break;
  }return moves;
 }
 const dir=p.side==='enemy'?1:-1,forward={x:p.x,y:p.y+dir};
 const occupied=(q:Cell)=>s.pieces.find(a=>same(a,q));
 const result:Cell[]=[];
 if(onBoard(s,forward)&&!occupied(forward)){
  result.push(forward);const two={x:p.x,y:p.y+dir*2};
  if(s.level>=4&&!p.moved&&p.y===(p.side==='enemy'?1:boardSize(s.level).height-2)&&onBoard(s,two)&&!occupied(two))result.push(two);
 }
 for(const dx of [-1,1]){const q={x:p.x+dx,y:p.y+dir},target=occupied(q);if(onBoard(s,q)&&target&&(target.side==='enemy')!==(p.side==='enemy'))result.push(q);}
 return result;
}
export function attacks(s:State,p:Piece):Cell[]{
 if(kind(p)==='pawn')return [-1,1].map(dx=>({x:p.x+dx,y:p.y+(p.side==='enemy'?1:-1)})).filter(q=>onBoard(s,q));
 return legal(s,p);
}
export function threats(s:State):Cell[]{return s.pieces.filter(p=>p.side==='enemy').flatMap(p=>attacks(s,p));}
export function forkTargets(s:State,p:Piece):Piece[]{return s.pieces.filter(t=>t.side==='enemy'&&kind(t)==='rook'&&attacks(s,p).some(q=>same(q,t)));}
export function goalCell(level:number):Cell|null{return [0,4].includes(level)?{x:2,y:2}:[7,11].includes(level)?{x:2,y:5}:level===8?{x:0,y:5}:level===9?{x:4,y:4}:null;}
export function apply(s:State,m:Move):{from:Cell;captured?:Piece}|null{
 const p=s.pieces.find(p=>p.id===m.id);if(!p||!legal(s,p).some(q=>same(q,m.to)))return null;
 const from={x:p.x,y:p.y},captured=s.pieces.find(q=>same(q,m.to));
 if(captured)s.pieces=s.pieces.filter(q=>q.id!==captured.id);
 Object.assign(p,m.to,{moved:true});return{from,captured};
}
export function won(s:State){
 if(s.level===10)return s.forked===true&&s.pieces.filter(p=>p.side==='enemy').length<2;
 if(s.level===11)return !s.pieces.some(p=>p.side==='enemy')&&s.pieces.some(p=>p.id==='a'&&p.moved)&&s.pieces.some(p=>p.id==='n'&&same(p,goalCell(11)!));
 if([7,8,9].includes(s.level))return s.pieces.some(p=>p.side==='hero'&&same(p,goalCell(s.level)!)&&!threats(s).some(q=>same(q,p)));

 if([0,4].includes(s.level))return s.pieces.some(p=>p.side==='hero'&&p.x===2&&p.y===2);
 if(s.level===1)return s.helperMoved&&s.pieces.some(p=>p.side==='hero'&&p.y===3);
 return !s.pieces.some(p=>p.side==='enemy');
}
export function enemyMove(s:State):Move|null{
 const options=s.pieces.filter(p=>p.side==='enemy').flatMap(p=>legal(s,p).map(to=>({id:p.id,to})));
 // Predictable training policy: capture first; otherwise advance one square, then stable piece order.
 const capture=options.find(m=>s.pieces.some(p=>p.side!=='enemy'&&same(p,m.to)));if(capture)return capture;
 if(s.level>=9){
  const attacked=s.pieces.filter(p=>p.side==='hero').flatMap(p=>attacks(s,p));
  const threatened=s.pieces.find(p=>p.side==='enemy'&&attacked.some(q=>same(p,q)));
  if(threatened){const escape=options.find(m=>m.id===threatened.id&&!attacked.some(q=>same(q,m.to)));if(escape)return escape;}
  const rook=s.pieces.find(p=>p.side==='enemy'&&kind(p)==='rook');
  if(rook)return options.find(m=>m.id===rook.id&&m.to.x===rook.x&&m.to.y===rook.y-1)??options.find(m=>m.id===rook.id)??null;
 }
 return options.sort((a,b)=>Math.abs(a.to.y-s.pieces.find(p=>p.id===a.id)!.y)-Math.abs(b.to.y-s.pieces.find(p=>p.id===b.id)!.y))[0]??null;
}
function settle(s:State){
 if(won(s)){s.status='won';return;}
 if(!s.pieces.some(p=>p.side==='hero')||!s.pieces.filter(p=>p.side==='hero').some(p=>legal(s,p).length))s.status='lost';
}
export class ChapterGame{
 state:State;history:State[]=[];
 constructor(level=0){this.state=initial(level);}
 get snapshot(){return copy(this.state);}
 move(m:Move){const s=this.state,p=s.pieces.find(p=>p.id===m.id);if(s.status!=='playing'||s.turn!=='player'||p?.side!=='hero')return null;const before=this.snapshot,result=apply(s,m);if(!result)return null;this.history.push(before);s.round++;if(s.level===10&&kind(p)==='knight'&&forkTargets(s,p).length>=2)s.forked=true;if(won(s))s.status='won';else s.turn='enemy';return result;}
 reply(){const s=this.state;if(s.turn!=='enemy'||s.status!=='playing')return null;const m=enemyMove(s),r=m?apply(s,m):null;s.turn='player';if(r?.captured?.side==='hero')s.status='lost';else settle(s);return m&&r?{...m,...r}:null;}
 openPath(){const s=this.state;if(s.level!==1||s.helperMoved||s.turn!=='player')return null;const p=s.pieces.find(p=>p.id==='friend')!;const to={x:2,y:2};const r=apply(s,{id:p.id,to});if(r){s.helperMoved=true;return{id:p.id,to,...r};}return null;}
 undo(){const previous=this.history.pop();if(!previous)return false;this.state=previous;return true;}
}
export function solution(state:State,maxDepth=10):Move[]|null{
 const queue=[{s:copy(state),path:[] as Move[]}],seen=new Set<string>();
 for(let i=0;i<queue.length&&i<12000;i++){
  const {s,path}=queue[i];if(won(s))return path;if(path.length>=maxDepth)continue;
  for(const p of s.pieces.filter(p=>p.side==='hero'))for(const to of legal(s,p)){
   const g=new ChapterGame(s.level);g.state=copy(s);const m={id:p.id,to};g.move(m);g.reply();if(g.state.status==='lost')continue;
   const key=JSON.stringify([g.state.forked,g.state.pieces.map(p=>[p.id,p.x,p.y,p.moved])]);if(seen.has(key))continue;seen.add(key);queue.push({s:g.snapshot,path:[...path,m]});
  }
 }
 return null;
}
export function validState(v:unknown,level:number):v is State{
 if(!v||typeof v!=='object')return false;if(!Number.isInteger(level)||level<0||level>=lessons.length)return false;const s=v as State,expected=initial(level);
 return s.level===level&&(s.forked===undefined||typeof s.forked==='boolean')&&['player','enemy'].includes(s.turn)&&['playing','won','lost'].includes(s.status)&&Number.isInteger(s.round)&&s.round>=0&&typeof s.helperMoved==='boolean'&&Array.isArray(s.pieces)&&s.pieces.length<=expected.pieces.length&&s.pieces.every(p=>onBoard(s,p)&&typeof p.moved==='boolean'&&expected.pieces.some(a=>a.id===p.id&&a.side===p.side&&kind(a)===kind(p)))&&new Set(s.pieces.map(p=>p.id)).size===s.pieces.length&&new Set(s.pieces.map(p=>`${p.x},${p.y}`)).size===s.pieces.length;
}
