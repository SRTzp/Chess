import {Ledger,restoreJournal,freshJournal} from './ledger';
const preview=new URLSearchParams(location.search).get('preview');export const journalKey=preview?'chessia-learning-preview-'+preview+'-v1':'chessia-learning-evidence-v1';
export const ledger=new Ledger((()=>{try{return restoreJournal(JSON.parse(localStorage.getItem(journalKey)||'null'));}catch{return freshJournal();}})());
export function persistLearning(){try{localStorage.setItem(journalKey,JSON.stringify(ledger.data));return true;}catch{return false;}}
