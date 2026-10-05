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
// Deterministic, bounded opponent. Tiers are search settings, not Elo ratings.
export const opponentTiers={gentle:{depth:1,nodes:700},steady:{depth:2,nodes:5000},challenge:{depth:3,nodes:18000}}as const;
export type OpponentTier=keyof typeof opponentTiers;
function evaluate(c:Chess){if(c.isCheckmate())return -100000;if(c.isDraw())return 0;let n=0;for(const row of c.board())for(const p of row)if(p){const center=3.5-Math.abs(p.square.charCodeAt(0)-100.5);n+=(p.color===c.turn()?1:-1)*(values[p.type]+(p.type==='p'||p.type==='n'?center*8:0));}return n;}
export function bestMove(c:Chess,tier:OpponentTier='steady',stats?:{nodes:number}):InputMove|null{
 if(c.isGameOver())return null;const cfg=opponentTiers[tier];let nodes=0;
 const moves=()=>c.moves({verbose:true}).sort((a,b)=>(values[b.captured??'p']*(b.captured?1:0)+values[b.promotion??'p']*(b.promotion?1:0))-(values[a.captured??'p']*(a.captured?1:0)+values[a.promotion??'p']*(a.promotion?1:0))||a.lan.localeCompare(b.lan));
 function search(depth:number,alpha:number,beta:number):number{
  nodes++;if(depth===0||nodes>=cfg.nodes||c.isGameOver())return evaluate(c);
  let value=-Infinity;for(const m of moves()){c.move(input(m));const score=-search(depth-1,-beta,-alpha);c.undo();value=Math.max(value,score);alpha=Math.max(alpha,value);if(alpha>=beta||nodes>=cfg.nodes)break;}return value;
 }
 let best:Move|undefined,score=-Infinity;for(const m of moves()){if(nodes>=cfg.nodes&&best)break;c.move(input(m));const s=-search(cfg.depth-1,-Infinity,Infinity);c.undo();if(s>score){score=s;best=m;}}
 if(stats)stats.nodes=nodes;return best?input(best):null;
}
