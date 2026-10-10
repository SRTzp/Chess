import type {Move,PieceSymbol,Square} from './engine/chess';
export const attackTiming={duration:820,ready:130,arrival:340,strike:350,contact:480,release:600,recover:680,fadeEnd:720}as const;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export function attackBeat(role:PieceSymbol,ms:number,reduced=false){
 if(reduced)return{phase:ms<360?'contact':'done',pose:3,progress:1,lift:0,victim:ms<360?1:0,effect:ms<360?1:0,settle:0};
 const a=attackTiming,p=clamp((ms-a.ready)/(a.arrival-a.ready)),settle=clamp((ms-a.recover)/(a.duration-a.recover));
 return{phase:ms<a.ready?'ready':ms<a.strike?'approach':ms<a.contact?'strike':ms<a.recover?'contact':ms<a.duration?'recover':'done',pose:ms<a.ready?1:ms<a.strike?2:ms<a.recover?3:0,progress:p,lift:role==='n'?Math.sin(p*Math.PI)*.32:0,victim:1-clamp((ms-a.release)/(a.fadeEnd-a.release)),effect:ms<a.strike?0:Math.min(clamp((ms-a.strike)/40),1-clamp((ms-a.release)/(a.recover-a.release))),settle};
}
export function captureSquare(m:Pick<Move,'from'|'to'|'flags'>):Square{return m.flags.includes('e')?(m.to[0]+m.from[1])as Square:m.to;}
/** Role-specific bounded weapon strokes; the raster atlas supplies the actual character pose. */
export const weaponPaths:Record<PieceSymbol,string>={
 p:'M40 46L67 50M51 43L68 50 51 55',
 n:'M20 50H65M54 43L67 50 54 57',
 r:'M42 40H60V60H42ZM31 44H37M31 56H37',
 b:'M25 58Q43 40 65 50M33 63Q48 45 65 50',
 q:'M23 50H66M35 43L66 50 35 57',
 k:'M28 50H59M59 45L64 40 69 45 64 50Z'
};
