import {Chess, DEFAULT_POSITION, SQUARES, type Square, type Color, type PieceSymbol, type Move} from 'chess.js';
export {Chess, DEFAULT_POSITION, SQUARES};
export type {Square, Color, PieceSymbol, Move};
export type InputMove={from:Square;to:Square;promotion?:'q'|'r'|'b'|'n'};
export type EndState='playing'|'check'|'checkmate'|'stalemate'|'repetition'|'fifty-move'|'insufficient';
export const opposite=(color:Color):Color=>color==='w'?'b':'w';
export const values:Record<PieceSymbol,number>={p:100,n:320,b:330,r:500,q:900,k:20000};
export function status(c:Chess):EndState {
 if(c.isCheckmate())return 'checkmate';if(c.isStalemate())return 'stalemate';
 if(c.isThreefoldRepetition())return 'repetition';if(c.isDrawByFiftyMoves())return 'fifty-move';
 if(c.isInsufficientMaterial())return 'insufficient';return c.isCheck()?'check':'playing';
}
export function tryMove(c:Chess,m:InputMove):Move|null {if(c.isGameOver())return null;try{return c.move(m);}catch{return null;}}
export const input=(m:Move):InputMove=>({from:m.from,to:m.to,...(m.promotion?{promotion:m.promotion as InputMove['promotion']}: {})});
export function attacksFrom(c:Chess,from:Square):Square[]{const p=c.get(from);return p?SQUARES.filter(s=>c.attackers(s,p.color).includes(from)):[];}
export function forkTargets(c:Chess,from:Square):Square[]{const p=c.get(from);return p?attacksFrom(c,from).filter(s=>{const t=c.get(s);return t&&t.color!==p.color&&values[t.type]>=320;}):[];}
export function discoveries(before:Chess,after:Chess,m:Move):{attacker:Square;target:Square}[]{
 const result:{attacker:Square;target:Square}[]=[];
 for(const target of SQUARES){const t=after.get(target);if(!t||t.color===m.color)continue;
 for(const attacker of after.attackers(target,m.color)){
  if(attacker===m.to||!before.get(attacker)||!['r','b','q'].includes(after.get(attacker)!.type))continue;
  if(!before.attackers(target,m.color).includes(attacker))result.push({attacker,target});
 }}return result;
}
export function pins(c:Chess,color:Color):{attacker:Square;target:Square;king:Square}[]{
 const result:{attacker:Square;target:Square;king:Square}[]=[];
 for(const from of SQUARES){const p=c.get(from);if(p?.color!==color||!['b','r','q'].includes(p.type))continue;
 const dirs=p.type==='b'?[[1,1],[1,-1],[-1,1],[-1,-1]]:p.type==='r'?[[1,0],[-1,0],[0,1],[0,-1]]:[[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
 for(const [dx,dy] of dirs){let target:Square|undefined;
 for(let x=from.charCodeAt(0)-97+dx,y=Number(from[1])-1+dy;x>=0&&x<8&&y>=0&&y<8;x+=dx,y+=dy){const s=(String.fromCharCode(97+x)+(y+1))as Square;const t=c.get(s);if(!t)continue;
 if(t.color===color)break;if(!target){if(t.type==='k')break;target=s;}else{if(t.type==='k')result.push({attacker:from,target,king:s});break;}
 }} }return result;
}
export type ChessSave={version:2;start:string;moves:InputMove[];rounds:number[]};
export class Match {
 readonly chess:Chess;readonly start:string;private rounds:number[]=[];
 constructor(fen=DEFAULT_POSITION){this.start=fen;this.chess=new Chess(fen);}
 move(m:InputMove){return tryMove(this.chess,m);}
 beginRound(){this.rounds.push(this.chess.history().length);}
 undoRound(){const target=this.rounds.pop();if(target===undefined)return false;while(this.chess.history().length>target)this.chess.undo();return true;}
 save():ChessSave{return{version:2,start:this.start,moves:this.chess.history({verbose:true}).map(input),rounds:[...this.rounds]};}
 static restore(v:unknown):Match|null{
  try{const s=v as ChessSave;if(s?.version!==2||typeof s.start!=='string'||!Array.isArray(s.moves)||s.moves.length>2000||!Array.isArray(s.rounds))return null;
  const m=new Match(s.start),expected:number[]=[];for(const move of s.moves){if(m.chess.turn()==='w')expected.push(m.chess.history().length);if(!m.move(move))return null;}
  if(s.rounds.length!==expected.length||s.rounds.some((n,i)=>n!==expected[i]))return null;
  m.rounds=[...s.rounds];return m;}catch{return null;}
 }
}
// Bounded iterative search. Cosmetic/tutorial replies are deliberately separate.
export const opponentTiers={gentle:{depth:2,nodes:2200,ms:220},steady:{depth:3,nodes:7000,ms:500},challenge:{depth:4,nodes:18000,ms:1000}}as const;
export type OpponentTier=keyof typeof opponentTiers;
export type SearchStats={nodes:number;depth?:number;elapsedMs?:number;limited?:boolean};
function evaluate(c:Chess){
 if(c.isCheckmate())return -100000;if(c.isDraw())return 0;
 const pieces=c.board().flat().filter(p=>!!p),endgame=!pieces.some(p=>p.type==='q')&&pieces.filter(p=>p.type!=='p'&&p.type!=='k').length<=4;
 let score=0;
 for(const p of pieces){const file=p.square.charCodeAt(0)-97,rank=Number(p.square[1])-1,advance=p.color==='w'?rank:7-rank,center=7-Math.abs(file-3.5)-Math.abs(rank-3.5);let positional=0;
  if(p.type==='p')positional=center*5+advance*9+(advance>=5?advance*14:0);
  if(p.type==='n'||p.type==='b')positional=center*(p.type==='n'?12:7)+(advance===0?-24:0);
  if(p.type==='r')positional=advance===6?20:0;
  if(p.type==='q')positional=center*3+(!endgame&&advance>2&&pieces.some(x=>x.color===p.color&&['n','b'].includes(x.type)&&(p.color==='w'?Number(x.square[1])===1:Number(x.square[1])===8))?-35:0);
  if(p.type==='k')positional=endgame?center*12:(advance===0&&(file===6||file===2)?42:0)-center*10-advance*15;
  score+=(p.color===c.turn()?1:-1)*(values[p.type]+positional);
 }
 return score;
}
export function bestMove(c:Chess,tier:OpponentTier='steady',stats?:SearchStats):InputMove|null{
 const begin=performance.now(),cfg=opponentTiers[tier];let nodes=0,completed=0,limited=false;const stop={};
 const ordered=()=>c.moves({verbose:true}).sort((a,b)=>{const priority=(m:Move)=>(m.promotion?values[m.promotion]:0)+(m.captured?values[m.captured]*10-values[m.piece]:0)+(m.san.includes('+')?50:0);return priority(b)-priority(a)||a.lan.localeCompare(b.lan);});
 const budget=()=>{if(nodes>=cfg.nodes||performance.now()-begin>=cfg.ms){limited=true;throw stop;}nodes++;};
 function quiet(alpha:number,beta:number,left:number):number{
  budget();if(c.isCheckmate())return-100000;if(c.isDraw())return 0;
  const checked=c.isCheck(),stand=evaluate(c);if(left===0)return stand;
  if(!checked){if(stand>=beta)return stand;alpha=Math.max(alpha,stand);}
  const moves=ordered().filter(m=>checked||m.captured||m.promotion||left>=3&&m.san.includes('+'));
  for(const m of moves){c.move(input(m));let score;try{score=-quiet(-beta,-alpha,left-1);}finally{c.undo();}if(score>=beta)return score;alpha=Math.max(alpha,score);}return alpha;
 }
 function search(depth:number,alpha:number,beta:number):number{
  if(depth===0)return quiet(alpha,beta,4);budget();if(c.isCheckmate())return-100000-depth;if(c.isDraw())return 0;
  for(const m of ordered()){c.move(input(m));let score;try{score=-search(depth-1,-beta,-alpha);}finally{c.undo();}if(score>=beta)return score;alpha=Math.max(alpha,score);}return alpha;
 }
 const roots=ordered();if(!roots.length||c.isGameOver()){if(stats)Object.assign(stats,{nodes:0,depth:0,elapsedMs:performance.now()-begin,limited:false});return null;}
 let chosen=roots[0],fallback=-Infinity;const side=c.turn();for(const m of roots){if(m.san.endsWith('#')){if(stats)Object.assign(stats,{nodes,depth:1,elapsedMs:performance.now()-begin,limited:false});return input(m);}c.move(input(m));let risk=0;for(const piece of c.board().flat()){if(!piece||piece.color!==side||piece.type==='k')continue;const attackers=c.attackers(piece.square,opposite(side));if(!attackers.length)continue;const least=Math.min(...attackers.map(s=>values[c.get(s)!.type]));const defended=c.attackers(piece.square,side).length>0;risk+=defended?Math.max(0,values[piece.type]-least)*.8:values[piece.type]*.9;}const candidate=-evaluate(c)-risk;c.undo();if(candidate>fallback){fallback=candidate;chosen=m;}}
 for(let depth=1;depth<=cfg.depth;depth++){
  let best=chosen,score=-Infinity;try{for(const m of [...roots].sort((a,b)=>a.lan===chosen.lan?-1:b.lan===chosen.lan?1:0)){c.move(input(m));let candidate;try{candidate=-search(depth-1,-Infinity,-score);}finally{c.undo();}if(candidate>score){score=candidate;best=m;if(depth===1&&score>=fallback)chosen=best;}}chosen=best;completed=depth;if(score>=100000)break;}catch(e){if(e!==stop)throw e;break;}
 }
 if(stats)Object.assign(stats,{nodes,depth:completed,elapsedMs:performance.now()-begin,limited});return input(chosen);
}
