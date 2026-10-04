export class Voice {
 enabled=true;last='';private lastRecording?:string;private recording:HTMLAudioElement|null=null;
 private ctx:AudioContext|null=null;private generation=0;onMissing?:()=>void;
 finished:Promise<void>=Promise.resolve();private finish:()=>void=()=>{};
 constructor(){if('speechSynthesis' in window)speechSynthesis.getVoices();}
 stop(){
  this.generation++;this.finish();
  if(this.recording){this.recording.pause();this.recording.currentTime=0;this.recording=null;}
  if('speechSynthesis' in window)speechSynthesis.cancel();
 }
 replay(){this.say(this.last,this.lastRecording);}
 say(text:string,recordingUrl?:string){
  this.stop();this.last=text;this.lastRecording=recordingUrl;
  if(!this.enabled)return;
  if(recordingUrl){
   const generation=this.generation;
   const audio=new Audio(recordingUrl);this.recording=audio;
   this.finished=new Promise<void>(resolve=>{this.finish=resolve;});
   const finish=this.finish;audio.onended=finish;audio.onerror=finish;
   void audio.play().catch(()=>{
    // A rejected play from an old scene must never restart narration.
    if(generation!==this.generation||!this.enabled)return;
    audio.pause();this.recording=null;finish();this.speak(text);
   });
   return;
  }
  this.speak(text);
 }
 private speak(text:string){
  if(!('speechSynthesis' in window)){this.onMissing?.();return;}
  const voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('en'));
  if(!voice){this.onMissing?.();return;}
  const u=new SpeechSynthesisUtterance(text);u.voice=voice;u.lang=voice.lang;u.rate=.85;
  u.onerror=e=>{if(e.error!=='interrupted'&&e.error!=='canceled')this.onMissing?.();};
  speechSynthesis.speak(u);
 }
 sound(win=false){if(!this.enabled)return;try{this.ctx??=new AudioContext();void this.ctx.resume();const ctx=this.ctx;for(const [i,f]of(win?[523,659,784]:[520]).entries()){const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+i*.14;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.045,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g);g.connect(ctx.destination);o.onended=()=>{o.disconnect();g.disconnect();};o.start(t);o.stop(t+.21);}}catch{}}
}
