import {changePreferences,restorePreferences,viewPreferences,type PlayerId,type ViewPreferences} from './preferences';
const preview=new URLSearchParams(location.search).get('preview');
export const preferencesKey=preview?'chessia-ui-preview-'+preview+'-v1':'chessia-ui-preferences-v1';
function read(){try{return restorePreferences(JSON.parse(localStorage.getItem(preferencesKey)||'null'));}catch{return restorePreferences(null);}}
export function loadViewSettings(id:PlayerId){return viewPreferences(read(),id,matchMedia('(prefers-reduced-motion: reduce)').matches);}
export function saveViewSettings(id:PlayerId,patch:ViewPreferences){try{localStorage.setItem(preferencesKey,JSON.stringify(changePreferences(read(),id,patch)));return true;}catch{return false;}}
