import {extraTrials} from './plans-bank';
import {isPassedPawn} from './pawn-outcomes';
import {Session} from '../engine/session';
import type {Goal} from '../engine/lessons';
import {teachingReply} from '../engine/teaching-reply';
import {Chess,forkTargets,pins,discoveries,type Square,type InputMove} from '../engine/chess';import type {Role,Skill} from './ledger';
export type Trial={id:string;skill:Skill;fen:string;instruction:string;accepted:InputMove[];concept:string;objective?:'fork'|'pin'|'discovery';goal?:Goal;outcome?:'stalemate'|'passed-pawn';reply?:InputMove};
const names={p:'Pawn',n:'Knight',b:'Bishop',r:'Rook',q:'Queen',k:'King'};
// Finite authored placements, never random/generated-at-runtime puzzle guesses.
const layouts:Record<Role,[Square,Square,Square?][]>={
 p:[['c2','c3'],['e2','f3','f3'],['b2','c3','c3'],['f2','f4']],
 n:[['b1','c3'],['g1','e2'],['c3','d5','d5'],['f3','e5','e5']],
 b:[['c1','f4'],['f1','c4'],['b2','e5','e5'],['g2','d5','d5']],
 r:[['a1','a4'],['b1','b5'],['c2','c6','c6'],['f2','f6','f6']],
 q:[['d1','d4'],['e2','b5'],['c2','c5','c5'],['f2','c5','c5']],
 k:[['c2','d3'],['f2','e3'],['b3','c4','c4'],['f3','e4','e4']],
};
export const trials:Trial[]=[];
for(const role of Object.keys(layouts) as Role[])layouts[role].forEach(([from,to,target],i)=>{
 const c=new Chess();c.clear();c.put({type:'k',color:'b'},'h8');c.put({type:'p',color:'b'},'h7');c.put({type:'k',color:'w'},role==='k'?from:'h1');if(role!=='k')c.put({type:role,color:'w'},from);if(target)c.put({type:'p',color:'b'},target);
 // Fixed blockers / danger distinguish use from simply repeating a capture.
 if(role==='p'&&i===2)c.put({type:'n',color:'w'},'b3');if(role==='n'&&i===2)c.put({type:'p',color:'w'},'c4');
 if(role==='r'&&i===3)c.put({type:'p',color:'w'},'f7');if(role==='b'&&i===3)c.put({type:'p',color:'w'},'c6');
 trials.push({id:`use-${role}-${i}`,skill:role,fen:c.fen(),instruction:target?`${names[role]}: choose the useful safe capture.`:`${names[role]}: reach the star safely. Look at the path.`,accepted:[{from,to}],concept:role==='n'?'One L jump; only the landing matters.':role==='p'?'Move forward. Capture diagonally. Never jump a blocker.':role==='k'?'One safe step. Never enter an attacked square.':'Follow the line. Stop at blockers. Look before taking.'});
});
// Contextual strategic probes: authored alternatives, not engine-score thresholds.
trials.push(
 {id:'team-centre',skill:'team',fen:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',instruction:'Give the team room in the center.',concept:'Several good central starts can help.',accepted:[{from:'e2',to:'e4'},{from:'d2',to:'d4'}]},
 {id:'team-develop',skill:'team',fen:'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',instruction:'Bring a new friend toward the center.',concept:'Develop before chasing a guarded pawn.',accepted:[{from:'g1',to:'f3'},{from:'b1',to:'c3'}]},
 {id:'prevent-ray',skill:'prevent',fen:'7k/8/8/8/r7/2K5/7P/8 w - - 0 1',instruction:'Keep the king away from the rook road.',concept:'Look where they can attack before moving.',accepted:[{from:'c3',to:'b3'},{from:'c3',to:'d3'},{from:'c3',to:'b2'},{from:'c3',to:'d2'}]},
 {id:'passer-help',skill:'passer',fen:'7k/8/8/8/4P3/3K4/8/8 w - - 0 1',instruction:'Bring the king beside the passed pawn safely.',concept:'The king can help when there are few pieces.',accepted:[{from:'d3',to:'d4'},{from:'d3',to:'e3'}]},
);
// Each layout is explicitly authored, then converted to a legal FEN for the bank.
function authored(id:string,skill:Skill,pieces:[Square,string][],move:InputMove,concept:string,objective?:Trial['objective']){
 const c=new Chess();c.clear();c.put({type:'k',color:'w'},'a1');c.put({type:'k',color:'b'},'h8');for(const [sq,p] of pieces){c.put({type:p[1] as Role,color:p[0] as 'w'|'b'},sq);}trials.push({id,skill,fen:c.fen(),accepted:[move],instruction:concept,concept,objective});
}
for(const [i,from,to,left,right] of [[0,'c3','d5','b6','f6'],[1,'d3','e5','c6','g6'],[2,'e3','f5','d6','h6'],[3,'f3','e5','c6','g6']] as const)authored('fork-'+i,'fork',[[from,'wn'],[left,'br'],[right,'br']],{from,to},'Threaten two valuable guards with one safe jump.','fork');
for(const [i,from,to,guard,king] of [[0,'d1','e1','e7','e8'],[1,'c1','d1','d7','d8'],[2,'b1','c1','c7','c8'],[3,'e1','f1','f7','f8']] as const){const c=new Chess();c.clear();c.put({type:'k',color:'w'},'a1');c.put({type:'k',color:'b'},king);c.put({type:'n',color:'b'},guard);c.put({type:'r',color:'w'},from);trials.push({id:'pin-'+i,skill:'pin',fen:c.fen(),accepted:[{from,to}],instruction:'Line up the guard and its king.',concept:'A pinned guard cannot leave its king exposed.',objective:'pin'});}
for(const [i,rook,knight,to,guard] of [[0,'e1','e2','c3','e4'],[1,'d1','d2','b3','d4'],[2,'c1','c2','a3','c4'],[3,'f1','f2','d3','f4']] as const)authored('discovery-'+i,'discovery',[[rook,'wr'],[knight,'wn'],[guard,'br']],{from:knight,to},'Move the knight to reveal your rook attack.','discovery');
for(const [i,from,to,guard] of [[0,'a2','a5','a5'],[1,'b2','b5','b5'],[2,'c2','c5','c5'],[3,'d2','d5','d5']] as const)authored('weakness-'+i,'weakness',[[from,'wr'],[guard,'bp'],['g7','bp']],{from,to},'Find the unguarded weak pawn. Take safely, not just any capture.');
for(const [i,from,to,block] of [[0,'c1','d1','c2'],[1,'d1','e1','d2'],[2,'e1','f1','e2'],[3,'f1','g1','f2']] as const)authored('activity-'+i,'activity',[[from,'wr'],[block,'wp']],{from,to},'Give the blocked rook an open road.');
authored('team-space-2','team',[['d2','wp'],['b1','wn'],['g1','wn'],['e7','bp']],{from:'d2',to:'d4'},'Give the team room in the center.');
authored('team-space-3','team',[['e2','wp'],['c1','wb'],['f1','wb'],['d7','bp']],{from:'e2',to:'e4'},'Open a central road for your friends.');
for(const [i,king,to] of [[1,'d3','e3'],[2,'e3','f3'],[3,'f3','g3']] as const){const c=new Chess();c.clear();c.put({type:'k',color:'b'},'h8');c.put({type:'k',color:'w'},king);c.put({type:'r',color:'b'},'a4');c.put({type:'p',color:'w'},'h2');trials.push({id:'prevent-'+i,skill:'prevent',fen:c.fen(),accepted:[{from:king,to}],instruction:'Stay off the rook road.',concept:'Look where they could attack before moving.'});}
for(const [i,pawn,king,to] of [[1,'d4','c3','c4'],[2,'c4','b3','b4'],[3,'f4','e3','e4']] as const){const c=new Chess();c.clear();c.put({type:'k',color:'b'},'h8');c.put({type:'k',color:'w'},king);c.put({type:'p',color:'w'},pawn);trials.push({id:'passer-'+i,skill:'passer',fen:c.fen(),accepted:[{from:king,to}],instruction:'Bring the king beside the pawn safely.',concept:'A safe active king can escort a passed pawn.'});}
trials.push(...extraTrials);
export function trialMet(t:Trial,move:InputMove,c:Chess){
 const played=c.history({verbose:true}).at(-1);if(!played||played.color!=='w'||played.from!==move.from||played.to!==move.to||played.after!==c.fen())return false;
 const before=new Chess(played.before);
 if(t.goal)return new Session().goalMet(before,c,played,t.goal);
 if(t.outcome==='stalemate')return c.isStalemate();
 if(t.outcome==='passed-pawn')return played.piece==='p'&&!isPassedPawn(before,move.from)&&isPassedPawn(c,move.to);
 const tactical=t.objective==='fork'?forkTargets(c,move.to).length>=2:t.objective==='pin'?pins(c,'w').some(p=>p.attacker===move.to)&&!pins(before,'w').length:t.objective==='discovery'?discoveries(before,c,played).length>0:true;
 return tactical&&(t.objective?true:t.accepted.some(m=>m.from===move.from&&m.to===move.to&&(!m.promotion||m.promotion===move.promotion)))&&c.attackers(move.to,'b').length===0;
}
export const miniStart='7k/7p/8/8/4P3/3K4/8/8 w - - 0 1';

export function trialReply(t:Trial,c:Chess){if(c.isGameOver()||c.turn()!=='b')return null;return t.reply&&c.moves({verbose:true}).some(m=>m.from===t.reply!.from&&m.to===t.reply!.to)?t.reply:teachingReply(c);}

export function trialHintMove(t:Trial,c:Chess):InputMove|null{for(const move of c.moves({verbose:true})){const after=new Chess(c.fen()),m={from:move.from,to:move.to,...(move.promotion?{promotion:move.promotion as InputMove['promotion']}:{})};after.move(m);if(trialMet(t,m,after))return m;}return null;}
