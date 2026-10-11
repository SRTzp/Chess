import {legal,same,solution,type Cell,type Piece,type State} from './rules';
// Authored teaching stages use at most three legal routes from the selected friend.
// The mission route is included; no outcome labels or guard responses are revealed.
export function chapterPlans(state:State,piece:Piece):Cell[]{
 const moves=legal(state,piece),mission=solution(state)?.find(m=>m.id===piece.id)?.to;
 const chosen=mission&&moves.some(m=>same(m,mission))?[mission]:[];
 for(const move of moves)if(chosen.length<3&&!chosen.some(m=>same(m,move)))chosen.push(move);
 return chosen.sort((a,b)=>a.y-b.y||a.x-b.x);
}

export const chapterPracticeRole=(level:number)=>[0,2,4].includes(level)?'p' as const:[7,8].includes(level)?'n' as const:level===10?'fork' as const:null;
