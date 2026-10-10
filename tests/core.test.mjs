import test from 'node:test';
import assert from 'node:assert/strict';
import {midiToName,midiToFrequency,frequencyToMidi,isBlackKey,range} from '../js/music.js';
import {pitchYin,downsample,rmsOf} from '../js/pitch.js';
import {LessonEngine} from '../js/lesson.js';
import {readFileSync} from 'node:fs';
const lessons=JSON.parse(readFileSync(new URL('../lessons/lessons.json',import.meta.url),'utf8'));
test('25-key full range C4 to C6',()=>{
  assert.equal(range().length,25);
  assert.equal(midiToName(60),'C4');assert.equal(midiToName(72),'C5');assert.equal(midiToName(84),'C6');
  assert.equal(range().filter(isBlackKey).length,10);
});
test('A4 pitch and frequency conversion',()=>{
  assert.equal(midiToFrequency(69),440);
  assert.equal(frequencyToMidi(261.626),60);
});
test('YIN recognizes clean sine tones',()=>{
  const fs=12000;
  for(const midi of [60,64,67,69,72]){
    const hz=midiToFrequency(midi);
    const samples=Float32Array.from({length:2048},(_,i)=>0.18*Math.sin(2*Math.PI*hz*i/fs));
    const detected=pitchYin(samples,fs);
    assert.ok(detected,`Expected pitch for ${midi}`);
    assert.ok(Math.abs(detected.frequency-hz)<2,`Expected ~${hz}, got ${detected.frequency}`);
    assert.ok(detected.clarity>.9);
  }
});
test('YIN rejects silence and noise energy',()=>{
  const zero=new Float32Array(2048);
  assert.equal(pitchYin(zero,12000),null);
  assert.equal(rmsOf(zero),0);
  assert.equal(downsample(new Float32Array([1,1,2,2]),2)[1],2);
});
test('lesson success and mistake do not accidentally advance',()=>{
  const engine=new LessonEngine(lessons);
  assert.equal(engine.target,60);
  assert.equal(engine.accept(64).correct,false);
  assert.equal(engine.position,0);
  assert.equal(engine.accept(60).correct,true);
  assert.equal(engine.target,60);
  engine.select('high-low');
  assert.equal(engine.target,60);
  for(const note of engine.lesson.notes) assert.equal(engine.accept(note).correct,true);
  assert.equal(engine.state().done,true);
});

import {MicrophoneDetector,runPitchSelfTest,levelPercent,dbFromRms} from '../js/audio-input.js';
test('v1.1 built-in self test identifies generated C4',()=>{
  const result=runPitchSelfTest();
  assert.equal(result.passed,true);
  assert.equal(result.midi,60);
});
test('v1.1 input meter is usable even at quiet microphone levels',()=>{
  assert.equal(dbFromRms(0),-120);
  assert.ok(levelPercent(.002)>0);
  assert.ok(levelPercent(.002)<100);
});
test('v1.1 audio callback recognizes a quiet C4 through the microphone analysis code',()=>{
  const fs=48000,hz=midiToFrequency(60),frames=[];
  const samples=Float32Array.from({length:8192},(_,i)=>.008*(Math.sin(2*Math.PI*hz*i/fs)+.12*Math.sin(4*Math.PI*hz*i/fs)));
  const notes=[];
  const detector=new MicrophoneDetector(f=>frames.push(f),n=>notes.push(n),e=>{throw e;});
  detector.context={sampleRate:fs,state:'running'};
  detector.analyser={getFloatTimeDomainData:(dest)=>dest.set(samples)};
  detector.track={readyState:'live'};
  detector.trackLabel='Simulated laptop microphone';
  detector.samples=new Float32Array(8192);
  detector.running=true;
  detector.tick();detector.tick();detector.tick();
  assert.ok(frames[0].rms>=detector.threshold);
  assert.ok(frames[0].db<-40);
  assert.equal(frames[0].midi,null); // first frame stabilizes before committing a note
  assert.equal(frames[1].midi,60);
  assert.equal(notes.length,1);
  assert.equal(notes[0].midi,60);
});


import {evaluateReference,compareReferences,applyCorrection,centsBetween} from '../js/calibration.js';
test('v1.2 raw 48kHz audio detector is accurate for C/E/G',()=>{
  const fs=48000;
  for(const note of [60,64,67]){
    const hz=midiToFrequency(note);
    const samples=Float32Array.from({length:8192},(_,i)=>.11*(Math.sin(2*Math.PI*hz*i/fs)+.35*Math.sin(4*Math.PI*hz*i/fs)+.12*Math.sin(6*Math.PI*hz*i/fs)));
    const result=pitchYin(samples,fs,{minHz:115,maxHz:575,threshold:.20});
    assert.ok(result,`no pitch for ${note}`);
    assert.ok(Math.abs(centsBetween(result.frequency,hz))<10,`${note}: ${result.frequency} Hz`);
  }
});
test('v1.2 reference check accepts consistent near +1 semitone shift with warning',()=>{
  const offset=100;
  const shifted=note=>midiToFrequency(note)*2**(offset/1200);
  const c=evaluateReference(60,Array.from({length:14},(_,i)=>shifted(60)*(1+(i%3-1)*.00015)));
  const g=evaluateReference(67,Array.from({length:14},(_,i)=>shifted(67)*(1+(i%3-1)*.00015)));
  assert.ok(c.ok);assert.ok(g.ok);
  const both=compareReferences(c,g);
  assert.equal(both.ok,true);assert.equal(both.large,true);
  assert.ok(Math.abs(centsBetween(applyCorrection(shifted(60),both.correction),midiToFrequency(60)))<1);
});
test('v1.2 refuses inconsistent two-note calibration',()=>{
  const samples=(n,offset)=>Array.from({length:12},()=>midiToFrequency(n)*2**(offset/1200));
  const c=evaluateReference(60,samples(60,100));
  const g=evaluateReference(67,samples(67,0));
  assert.equal(compareReferences(c,g).ok,false);
});
test('v1.2 calibrated callback maps C sharp captured on transposed keyboard back to C',()=>{
  const fs=48000,hz=midiToFrequency(61),frames=[],notes=[];
  const detector=new MicrophoneDetector(f=>frames.push(f),n=>notes.push(n),e=>{throw e;});
  detector.setCorrection(100);
  detector.context={sampleRate:fs,state:'running'};
  const samples=Float32Array.from({length:8192},(_,i)=>.014*(Math.sin(2*Math.PI*hz*i/fs)+.3*Math.sin(4*Math.PI*hz*i/fs)));
  detector.analyser={getFloatTimeDomainData:dest=>dest.set(samples)};
  detector.track={readyState:'live'};detector.trackLabel='Simulated electronic piano';
  detector.samples=new Float32Array(8192);detector.running=true;
  for(let i=0;i<5;i++)detector.tick();
  assert.equal(frames.at(-1).rawMidi,61);
  assert.equal(frames.at(-1).midi,60);
  assert.equal(notes.length,1);
  assert.equal(notes[0].midi,60);
});


test('v1.4 microphone self test covers highest C6 on 25-key piano',()=>{
  const r=runPitchSelfTest();
  assert.equal(r.passed,true);
  assert.equal(r.results.length,6);
  assert.ok(Math.abs(r.results.at(-1).hz-1046.502261)<2);
});
test('v1.4 live microphone detects simulated high C6',()=>{
  const fs=48000,hz=midiToFrequency(84),notes=[];
  const detector=new MicrophoneDetector(()=>{},event=>notes.push(event),e=>{throw e;});
  const input=Float32Array.from({length:8192},(_,i)=>.07*(Math.sin(2*Math.PI*hz*i/fs)+.18*Math.sin(4*Math.PI*hz*i/fs)));
  detector.context={sampleRate:fs,state:'running'};
  detector.analyser={getFloatTimeDomainData:d=>d.set(input)};
  detector.track={readyState:'live'};detector.trackLabel='Simulated Android mic';
  detector.samples=new Float32Array(8192);detector.running=true;
  for(let i=0;i<5;i++)detector.tick();
  assert.equal(notes.length,1);
  assert.equal(notes[0].midi,84);
});
