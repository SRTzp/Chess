import type {Role,Tier} from './ledger';
const bounds={p:[[136,86,421,513],[725,86,419,513],[96,637,556,537],[690,630,504,544]],n:[[73,108,520,510],[658,59,550,563],[60,658,561,545],[673,653,563,551]],r:[[125,88,459,487],[677,87,520,490],[61,634,570,527],[669,627,505,533]],k:[[62,48,548,569],[70,654,537,559],[62,48,548,569],[658,48,547,571]]};
const files={p:'pawns',n:'knights',r:'rook-upgrades',k:'kings'};
export const enemyGlyphs={p:'♟',n:'♞',b:'♝',r:'♜',q:'♛',k:'♚'};
export const glyphs={p:'♙',n:'♘',b:'♗',r:'♖',q:'♕',k:'♔'};
export function actor(role:Role,enemy:boolean,tier:Tier,characterRook=false){
 if(role==='b'||role==='q'){const color=enemy?'#a677cc':tier==='master'?'#ffe09e':tier==='guardian'?'#c3dce0':'#e7eacb';return `<span class="journey-vector" style="color:${color}">${role==='b'?'♗':'♕'}<small>${role==='b'?'◆':'✦'}</small></span>`;}
 const variant=enemy?3:tier==='master'?2:tier==='guardian'?1:0;if(role==='r'&&!characterRook)return `<span class="journey-sprite journey-tower" data-role="r" style="width:86%;height:86%;left:7%;background-image:url('${import.meta.env.BASE_URL}rook-grove-v2/rook-tower-${variant}.svg');background-size:100% 100%"></span>`;
 const i=enemy?3:tier==='master'?2:tier==='guardian'?1:0,[x,y,w,h]=bounds[role][i],aspect=w/h,width=Math.min(.9,.9*aspect),height=width/aspect;
 return `<span class="journey-sprite" data-role="${role}" data-tier="${tier}" data-side="${enemy?'enemy':'friend'}" style="width:${width*100}%;height:${height*100}%;left:${(1-width)*50}%;background-image:url('${import.meta.env.BASE_URL}rook-grove-v2/${files[role]}.webp');background-size:${1254/w*100}% ${1254/h*100}%;background-position:${x/(1254-w)*100}% ${y/(1254-h)*100}%"></span>`;
}
