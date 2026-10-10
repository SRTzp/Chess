import {Chess,values,input,type Move,type InputMove} from './chess';
function evaluate(c:Chess){if(c.isCheckmate())return -100000;if(c.isDraw())return 0;let n=0;for(const row of c.board())for(const p of row)if(p){const center=3.5-Math.abs(p.square.charCodeAt(0)-100.5);n+=(p.color===c.turn()?1:-1)*(values[p.type]+(p.type==='p'||p.type==='n'?center*8:0));}return n;}
export function teachingReply(c:Chess):InputMove|null{
 if(c.isGameOver())return null;const cfg={depth:1,nodes:700};let nodes=0;
 const moves=()=>c.moves({verbose:true}).sort((a,b)=>(values[b.captured??'p']*(b.captured?1:0)+values[b.promotion??'p']*(b.promotion?1:0))-(values[a.captured??'p']*(a.captured?1:0)+values[a.promotion??'p']*(a.promotion?1:0))||a.lan.localeCompare(b.lan));
 function search(depth:number,alpha:number,beta:number):number{
  nodes++;if(depth===0||nodes>=cfg.nodes||c.isGameOver())return evaluate(c);
  let value=-Infinity;for(const m of moves()){c.move(input(m));const score=-search(depth-1,-beta,-alpha);c.undo();value=Math.max(value,score);alpha=Math.max(alpha,value);if(alpha>=beta||nodes>=cfg.nodes)break;}return value;
 }
 let best:Move|undefined,score=-Infinity;for(const m of moves()){if(nodes>=cfg.nodes&&best)break;c.move(input(m));const s=-search(cfg.depth-1,-Infinity,Infinity);c.undo();if(s>score){score=s;best=m;}}
return best?input(best):null;
}
