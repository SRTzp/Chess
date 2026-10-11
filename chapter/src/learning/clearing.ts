import {Chess,type Square} from '../engine/chess';
import {roles,type Role} from './ledger';
import type {Trial} from './bank';
import type {AdventurePlan} from './choices';
import {algebraicPoint} from '../visual-path';
// Only movement missions crop their quiet distant reserve kings/pawn. Tactical and
// strategic missions keep every square. Legal moves still come from the full FEN.
export function clearingSquares(t:Trial,c:Chess,plans:AdventurePlan[],guided:boolean):Square[]{
 const all=Array.from({length:64},(_,i)=>(String.fromCharCode(97+i%8)+(8-Math.floor(i/8))) as Square);
 if(!roles.includes(t.skill as Role))return all;
 const initial=new Chess(t.fen);
 const focus=[...t.accepted.flatMap(m=>[m.from,m.to]),...(guided?plans.flatMap(p=>[p.move.from,p.move.to]):[])];
 for(const sq of all){const p=initial.get(sq);if(p&&!(sq==='h8'&&p.color==='b'&&p.type==='k')&&!(sq==='h7'&&p.color==='b'&&p.type==='p')&&!(sq==='h1'&&p.color==='w'&&p.type==='k'&&t.skill!=='k'))focus.push(sq);}
 const points=focus.map(algebraicPoint),minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
 const size=Math.min(8,Math.max(4,maxX-minX+2,maxY-minY+2)),left=Math.max(0,Math.min(8-size,minX-1)),top=Math.max(0,Math.min(8-size,minY-1));
 return all.filter(sq=>{const p=algebraicPoint(sq);return p.x>=left&&p.x<left+size&&p.y>=top&&p.y<top+size;});
}
