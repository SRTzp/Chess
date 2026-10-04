import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lessons} from '../chapter/src/rules';
import {recordings} from '../chapter/src/narration';
test('every Chapter 1 lesson story, guide and completion has a packaged recording',()=>{
 for(const lesson of lessons.slice(0,6))for(const field of ['intro','guide','done'] as const){
  const file=recordings[lesson[field]];assert.ok(file,`${lesson.title}: ${field}`);
  const data=readFileSync(new URL('../chapter/public/audio/'+file,import.meta.url));
  assert.ok(data.length>1000,file);
  if(file.endsWith('.wav'))assert.equal(data.toString('ascii',0,4),'RIFF');
 }
 assert.equal(Object.keys(recordings).length,28);
});
