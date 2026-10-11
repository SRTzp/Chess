type Profile='akin'|'prin';
type SaveStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;

// Only progress in the current game mode is reset. Other profiles and view settings survive.
export function resetProgress(storage:SaveStorage,ids:Profile[],preview:string|null=null){
 const forest=preview==='forest-adventure',grove=preview==='rook-grove';
 const keys=[
  forest?'chessia-forest-preview-village-v1':grove?'chessia-rook-preview-village-v1':'chessia-pawn-chapter-v1',
  forest?'chessia-forest-preview-campaign-v1':grove?'chessia-rook-preview-campaign-v1':'chessia-campaign-v2',
  forest?'chessia-forest-preview-legacy-v1':grove?'chessia-rook-preview-legacy-v1':'chessia-lab-v1',
  preview?'chessia-learning-preview-'+preview+'-v1':'chessia-learning-evidence-v1',
  preview?'chessia-full-preview-'+preview+'-v1':'chessia-full-game-v1',
 ];
 const changes:{key:string;before:string|null;after:string|null}[]=[];
 for(const key of keys){
  const before=storage.getItem(key);if(before===null)continue;
  const data=JSON.parse(before);if(!data||typeof data!=='object')throw Error('Unreadable save');
  const profiles=key===keys[3]||key===keys[4]?data.profiles:data;
  if(!profiles||typeof profiles!=='object')throw Error('Unreadable profiles');
  for(const id of ids)delete profiles[id];
  changes.push({key,before,after:JSON.stringify(data)});
 }
 for(const id of ids){const key='chessia-learning-draft-'+id+'-'+(preview??'journey');changes.push({key,before:storage.getItem(key),after:null});}
 // Roll back partial writes if storage is unavailable; report failure instead of claiming a reset.
 try{for(const c of changes)if(c.after===null)storage.removeItem(c.key);else storage.setItem(c.key,c.after);}
 catch(error){for(const c of changes)try{if(c.before===null)storage.removeItem(c.key);else storage.setItem(c.key,c.before);}catch{}throw error;}
}
