import {Chess,type Square,type InputMove} from '../engine/chess';
import {lessons,type Goal} from '../engine/lessons';
import type {Trial} from './bank';import type {Skill} from './ledger';
export const extraTrials:Trial[]=[];
function fromLesson(skill:Skill,id:string,source:string){const l=lessons.find(l=>l.id===source)!;extraTrials.push({id,skill,fen:l.fen,instruction:l.story,concept:l.hint[0],accepted:l.goal.accepted??[l.goal.move!],goal:l.goal});}
function add(skill:Skill,id:string,fen:string,move:InputMove,instruction:string,goal?:Goal,outcome?:Trial['outcome'],reply?:InputMove){extraTrials.push({id,skill,fen,accepted:[move],instruction,concept:instruction,goal,outcome,reply});}
for(const[id,source]of ['give-check','king-escape','king-capture-check','king-block-check'].entries())fromLesson('check','check-'+id,source);
// Independent check contexts are new, not old campaign boards with changed clocks.
extraTrials.splice(2,2);
add('check','check-2','7k/5r2/8/8/8/1B6/8/5K2 w - - 0 1',{from:'b3',to:'f7'},'Your bishop can take the checking rook.',{kind:'capture',square:'f7',piece:'b'});
add('check','check-3','3r3k/8/8/8/5N2/1B6/8/3K4 w - - 0 1',{from:'b3',to:'d5'},'Answer check safely. A bishop can block this road.',{kind:'escape-check'},undefined,{from:'d8',to:'d6'});
for(const[id,source]of ['castle-shelter','castle-friends','castle-other-side'].entries())fromLesson('castle','castle-'+id,source);
add('castle','castle-3','3r2k1/8/8/8/8/8/8/R3K2R w KQ - 0 1',{from:'e1',to:'g1'},'The left road is attacked. Find the safe castle.',{kind:'castle'});
for(const[id,source]of ['promotion','promotion-capture','promotion-new-road'].entries())fromLesson('promotion','promote-'+id,source);
extraTrials.push({id:'promote-3',skill:'promotion',fen:'7k/2P5/8/8/8/8/7p/K7 w - - 0 1',instruction:'Reach the last row and choose any new friend.',concept:'Queen, Rook, Bishop or Knight are legal choices.',accepted:[{from:'c7',to:'c8',promotion:'q'}],goal:{kind:'promotion',square:'c8'}});
for(const[id,source]of ['en-passant','en-passant-right','en-passant-new'].entries())fromLesson('en-passant','passing-'+id,source);
add('en-passant','passing-3','7k/8/8/1pP5/8/8/8/K7 w - b6 0 1',{from:'c5',to:'b6'},'The passing capture is available only now.',{kind:'en-passant'});
for(const[id,source]of ['mate','mate-rook','mate-light'].entries())fromLesson('mate','finish-'+id,source);
add('mate','finish-3','k7/pp6/2Q5/8/8/8/8/7K w - - 0 1',{from:'c6',to:'c8'},'Give check and close every safe escape.',{kind:'mate'});
add('stalemate','draw-0','7k/5Q2/6K1/8/8/8/8/8 w - - 0 1',{from:'f7',to:'e6'},'No check and no legal move is a draw. Make the quiet trap, then compare mate.',undefined,'stalemate');
add('stalemate','draw-1','k7/2Q5/1K6/8/8/8/8/8 w - - 0 1',{from:'c7',to:'d6'},'A trapped king without check means stalemate: neither side wins.',undefined,'stalemate');
add('stalemate','draw-2','7k/5Q2/5K2/8/8/8/8/8 w - - 1 3',{from:'f7',to:'g7'},'Finish with checkmate, not a quiet draw.',{kind:'mate'});
add('stalemate','draw-3','k7/2Q5/2K5/8/8/8/8/8 w - - 1 3',{from:'c7',to:'b7'},'On a new board, close the exits and give check.',{kind:'mate'});
for(const[i,from,to]of [[0,'d4','e4'],[1,'c4','b4'],[2,'e4','f4'],[3,'f4','g4']]as const){const file=from[0];add('threat','threat-'+i,`3rk3/8/8/8/3Q4/8/P7/K7 w - - 0 1`.replace('3rk3',({c:'2r1k3',d:'3rk3',e:'4rk2',f:'5rk1'}as Record<string,string>)[file]).replace('3Q4',({c:'2Q5',d:'3Q4',e:'4Q3',f:'5Q2'}as Record<string,string>)[file]),{from,to},'The queen is threatened. Keep it safe before making another plan.');}
for(const[i,king,to,pawn]of [[0,'c3','d4','e4'],[1,'d3','e4','f4'],[2,'e3','f4','g4'],[3,'b3','c4','d4']]as const){const c=new Chess();c.clear();c.put({type:'k',color:'w'},king);c.put({type:'k',color:'b'},'h8');c.put({type:'p',color:'w'},pawn);c.put({type:'p',color:'b'},'h7');add('active-king','active-king-'+i,c.fen(),{from:king,to},'With few pieces, bring the king safely toward the pawn.');}
for(const[i,king,pawn,enemy]of [[0,'c3','c4','d4'],[1,'d3','d4','e4'],[2,'e3','e4','f4'],[3,'b3','b4','c4']]as const){const c=new Chess();c.clear();c.put({type:'k',color:'w'},king);c.put({type:'k',color:'b'},'h8');c.put({type:'p',color:'w'},pawn);c.put({type:'p',color:'b'},enemy);c.put({type:'p',color:'b'},'h7');add('pawn-defense','pawn-defense-'+i,c.fen(),{from:king,to:enemy},'Remove the pawn that attacks your king and threatens the team.',{kind:'capture',square:enemy,piece:'k'});}
for(const[i,king,from,to,friend,guard]of [[0,'c4','c5','d6','d5','c6'],[1,'d4','d5','e6','e5','d6'],[2,'e4','e5','f6','f5','e6'],[3,'b4','b5','c6','c5','b6']]as const){const c=new Chess();c.clear();c.put({type:'k',color:'w'},king);c.put({type:'k',color:'b'},'h8');for(const sq of [from,friend])c.put({type:'p',color:'w'},sq);for(const sq of [to,guard])c.put({type:'p',color:'b'},sq);add('create-passer','create-passer-'+i,c.fen(),{from,to},'Exchange the blocking pawn to create a passed pawn. Then escort it in a short game.',undefined,'passed-pawn',{from:guard,to:(guard[0]+'5')as Square});}
