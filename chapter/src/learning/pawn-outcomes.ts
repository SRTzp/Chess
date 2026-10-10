import {Chess,type Square} from '../engine/chess';
export function isPassedPawn(c:Chess,square:Square){const p=c.get(square);if(p?.type!=='p')return false;const file=square.charCodeAt(0),rank=Number(square[1]);return !c.board().flat().some(q=>q?.type==='p'&&q.color!==p.color&&Math.abs(q.square.charCodeAt(0)-file)<=1&&(p.color==='w'?Number(q.square[1])>rank:Number(q.square[1])<rank));}
