import type {Skill} from './ledger';
export const learningTrail:Skill[]=['p','n','r','b','q','k','threat','check','castle','promotion','en-passant','fork','pin','discovery','team','prevent','weakness','activity','active-king','pawn-defense','create-passer','passer','mate','stalemate'];
export function nextSkill(skill:Skill){return learningTrail[learningTrail.indexOf(skill)+1]??null;}
