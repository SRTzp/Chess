import type {Role,Tier} from './ledger';
import './actors.css';
export const enemyGlyphs={p:'♟',n:'♞',b:'♝',r:'♜',q:'♛',k:'♚'};
export const glyphs={p:'♙',n:'♘',b:'♗',r:'♖',q:'♕',k:'♔'};
export function actor(role:Role,enemy:boolean,tier:Tier){
 const variant=enemy?3:tier==='master'?2:tier==='guardian'?1:0;
 const file={p:'pawn',n:'knight',k:'king',r:'rook',b:'bishop',q:'queen'}[role],rows=role==='k'?2:4,row=role==='k'?(enemy?1:0):variant,version=['p','n','k'].includes(role)?4:3;
 return `<span class="journey-sprite journey-atlas" data-role="${role}" data-tier="${tier}" data-side="${enemy?'enemy':'friend'}" style="--tier-y:${row/(rows-1)*100}%;--atlas-height:${rows*100}%;background-image:url('${import.meta.env.BASE_URL}rook-grove-v2/${file}-frames-v${version}.webp')" aria-hidden="true"></span>`;
}
