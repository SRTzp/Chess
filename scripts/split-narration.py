"""Split supplied recordings using locally transcribed word timestamps.
Requires numpy; /tmp/chessia-*.json contains faster-whisper word timestamps.
Uses PyAV through faster-whisper to decode; source files are never modified.
"""
import json,re,difflib,subprocess,wave
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parents[1]
lines=json.loads((root/'scripts/narration-lines.json').read_text())
report=[]
def tokens(s): return re.findall(r"[a-z]+",s.lower().replace("here's","here is"))
for name,group in [('chessia-01-levels-1-3',lines[:8]),('chessia-02-levels-4-6',lines[8:17]),('chessia-03-shared-lines',lines[17:])]:
 words=json.loads(Path('/tmp/'+name+'.json').read_text());actual=[];timed=[]
 for w in words:
  for t in tokens(w['word']):actual.append(t);timed.append(w)
 expected=[];ranges=[]
 for key,text in group:
  begin=len(expected);expected.extend(tokens(text));ranges.append((begin,len(expected)))
 matcher=difflib.SequenceMatcher(None,expected,actual,autojunk=False)
 assert matcher.ratio()>.96,(name,matcher.ratio())
 mapping={a+i:b+i for a,b,n in matcher.get_matching_blocks() for i in range(n)}
 from faster_whisper.audio import decode_audio
 rate=22050;channels=1
 samples=decode_audio(str(Path('/Users/peach/Downloads')/(name+'.mp3')),sampling_rate=rate)
 data=(np.clip(samples,-1,1)*32767).astype('<i2').reshape(-1,1)
 duration=len(data)/rate
 cuts=[0.0]
 for start,end in ranges[1:]:
  assert start in mapping and start-1 in mapping,(name,start)
  left=timed[mapping[start-1]]['end'];right=timed[mapping[start]]['start']
  # Choose the quietest 20 ms window close to the ASR boundary.
  midpoint=(left+right)/2;lo=max(0,midpoint-.16);hi=min(duration,midpoint+.16)
  candidates=np.arange(lo,hi,.005)
  def energy(t):
   segment=data[max(0,int((t-.01)*rate)):int((t+.01)*rate)].astype(float)
   return np.mean(segment**2)+abs(t-midpoint)*.01
  cut=float(min(candidates,key=energy));cuts.append(cut)
 # Clip-level transcription found the final "to" crossing the original ASR boundary.
 if name=='chessia-03-shared-lines':cuts[2]=3.55
 cuts.append(duration)
 for i,(key,text) in enumerate(group):
  a,b=cuts[i:i+2];clip=data[round(a*rate):round(b*rate)]
  dest=root/'chapter/public/audio'/f'{key}.wav'
  with wave.open(str(dest),'wb') as f:f.setnchannels(channels);f.setsampwidth(2);f.setframerate(rate);f.writeframes(clip.tobytes())
  report.append({'id':key,'source':name+'.mp3','start':round(a,3),'end':round(b,3),'text':text,'alignmentScore':round(matcher.ratio(),4)})
  print(key,round(a,2),round(b,2))
(root/'scripts/narration-cuts.json').write_text(json.dumps(report,indent=2))
