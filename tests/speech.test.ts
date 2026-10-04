import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Voice} from '../chapter/src/speech';

test('recorded narration replays, stops, respects mute, and ignores stale playback failures', async()=>{
 const played:FakeAudio[]=[];const spoken:string[]=[];
 class FakeAudio {
  currentTime=0;paused=false;reject!:()=>void;
  constructor(public src:string){played.push(this);}
  play(){return new Promise<void>((_,reject)=>{this.reject=()=>reject(new Error('blocked'));});}
  pause(){this.paused=true;}
 }
 const synth={getVoices:()=>[{lang:'en-US'}],cancel(){},speak(u:{text:string}){spoken.push(u.text);}};
 const mocks={window:{speechSynthesis:synth},speechSynthesis:synth,Audio:FakeAudio,SpeechSynthesisUtterance:class{constructor(public text:string){}}};
 const originals=new Map(Object.keys(mocks).map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 try{
  for(const [k,v]of Object.entries(mocks))Object.defineProperty(globalThis,k,{configurable:true,writable:true,value:v});
  const voice=new Voice();voice.say('Story','intro.mp3');assert.equal(played[0].src,'intro.mp3');assert.deepEqual(spoken,[]);
  voice.replay();assert.equal(played.length,2);assert.ok(played[0].paused);
  voice.say('Move one square');assert.ok(played[1].paused);assert.deepEqual(spoken,['Move one square']);
  played[0].reject();played[1].reject();await Promise.resolve();assert.deepEqual(spoken,['Move one square']);
  voice.say('Story','intro.mp3');played[2].reject();await Promise.resolve();assert.equal(spoken.at(-1),'Story');
  voice.enabled=false;voice.stop();voice.replay();assert.equal(played.length,3);
 }finally{
  for(const [k,d]of originals){if(d)Object.defineProperty(globalThis,k,d);else Reflect.deleteProperty(globalThis,k);}
 }
});
