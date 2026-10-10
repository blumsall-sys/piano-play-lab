import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MIN_MIDI,MAX_MIDI,midiToName,midiToFrequency,frequencyToMidi,isBlackKey,range} from '../js/music.js';
import {pitchYin,rmsOf} from '../js/pitch.js';
import {LessonEngine} from '../js/lesson.js';
import {MicrophoneDetector,runPitchSelfTest,levelPercent,dbFromRms} from '../js/audio-input.js';
import {evaluateReference,compareReferences,applyCorrection,centsBetween} from '../js/calibration.js';
const lessons=JSON.parse(readFileSync(new URL('../lessons/lessons.json',import.meta.url),'utf8'));
const simulate=(midi, amplitude=.08)=>{
  const hz=midiToFrequency(midi),fs=48000;
  return Float32Array.from({length:8192},(_,i)=>amplitude*(Math.sin(2*Math.PI*hz*i/fs)+.18*Math.sin(4*Math.PI*hz*i/fs)));
};
test('Exactly 25 piano keys from F3 through F5',()=>{
  assert.equal(MIN_MIDI,53);assert.equal(MAX_MIDI,77);
  assert.equal(range().length,25);
  assert.equal(midiToName(53),'F3');assert.equal(midiToName(77),'F5');
  assert.equal(range().filter(isBlackKey).length,10);
  assert.equal(range().filter(m=>!isBlackKey(m)).length,15);
});
test('Photo black key group order 3,2,3,2',()=>{
  const expected=[54,56,58,61,63,66,68,70,73,75];
  assert.deepEqual(range().filter(isBlackKey),expected);
});
test('Pitch conversion A4 = 440 and F boundaries',()=>{
  assert.equal(midiToFrequency(69),440);
  assert.equal(frequencyToMidi(midiToFrequency(53)),53);
  assert.equal(frequencyToMidi(midiToFrequency(77)),77);
});
test('YIN handles sine/harmonic notes across F3-F5',()=>{
  for(const note of [53,57,60,65,72,77]){
    const result=pitchYin(simulate(note),48000,{minHz:145,maxHz:850,threshold:.2});
    assert.ok(result,`No pitch detected for ${midiToName(note)}`);
    assert.ok(Math.abs(centsBetween(result.frequency,midiToFrequency(note)))<10,`${midiToName(note)}: ${result.frequency}`);
  }
});
test('YIN rejects silence',()=>{
  assert.equal(pitchYin(new Float32Array(8192),48000,{minHz:145,maxHz:850}),null);
  assert.equal(rmsOf(new Float32Array(128)),0);
});
test('Lesson notes remain within F3 through F5',()=>{
  const engine=new LessonEngine(lessons);
  for(const lesson of engine.lessons)for(const note of lesson.notes)assert.ok(note>=53&&note<=77);
});
test('Lesson first note is F3, tracks mistakes, and progresses',()=>{
  const engine=new LessonEngine(lessons);
  assert.equal(engine.target,53);
  assert.equal(engine.accept(54).correct,false);
  assert.equal(engine.position,0);
  assert.equal(engine.accept(53).correct,true);
  assert.equal(engine.target,53);
  const summary=engine.summary();
  assert.equal(summary.attempts,2);assert.equal(summary.correctPresses,1);
  assert.equal(summary.accuracy,50);
});
test('High/Low lesson uses F3 F4 F5',()=>{
  const engine=new LessonEngine(lessons);
  engine.select('high-low');
  assert.deepEqual(engine.lesson.notes,[53,65,77,65,53]);
  for(const n of engine.lesson.notes)assert.equal(engine.accept(n).correct,true);
  assert.equal(engine.state().done,true);
  assert.equal(engine.summary().accuracy,100);
});
test('Built-in pitch self-test uses F3 and top F5',()=>{
  const result=runPitchSelfTest();
  assert.equal(result.passed,true);
  assert.equal(result.midi,53);
  assert.equal(result.results.length,6);
  assert.ok(Math.abs(result.results.at(-1).hz-midiToFrequency(77))<3);
});
test('Microphone level meter behaves at quiet levels',()=>{
  assert.equal(dbFromRms(0),-120);
  assert.ok(levelPercent(.002)>0&&levelPercent(.002)<100);
});
for(const midi of [53,60,77]){
  test(`Simulated microphone recognizes ${midiToName(midi)}`,()=>{
    const fs=48000,events=[],frames=[];
    const detector=new MicrophoneDetector(f=>frames.push(f),n=>events.push(n),e=>{throw e;});
    detector.context={sampleRate:fs,state:'running'};
    const input=simulate(midi);
    detector.analyser={getFloatTimeDomainData:dest=>dest.set(input)};
    detector.track={readyState:'live'};detector.trackLabel='Simulated piano';
    detector.samples=new Float32Array(8192);detector.running=true;
    for(let i=0;i<5;i++)detector.tick();
    assert.equal(events.length,1);
    assert.equal(events[0].midi,midi);
  });
}
test('Calibration reference capture validates F3 / C4 measured offset',()=>{
  const shifted=n=>midiToFrequency(n)*2**(90/1200);
  const a=evaluateReference(53,Array.from({length:14},()=>shifted(53)));
  const b=evaluateReference(60,Array.from({length:14},()=>shifted(60)));
  const c=compareReferences(a,b);
  assert.equal(c.ok,true);
  assert.ok(Math.abs(centsBetween(applyCorrection(shifted(53),c.correction),midiToFrequency(53)))<1);
});
test('Calibration rejects inconsistent references',()=>{
  const a=evaluateReference(53,Array.from({length:14},()=>midiToFrequency(53)*2**(100/1200)));
  const b=evaluateReference(60,Array.from({length:14},()=>midiToFrequency(60)));
  assert.equal(compareReferences(a,b).ok,false);
});

// UI contract: the guided reference controls must have matching IDs in HTML and JS.
test('Guided F3/C4 reference buttons are wired to existing elements',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../js/main.js',import.meta.url),'utf8');
  for(const name of ['capture-f3','capture-c4','f3-reference','c4-reference']){
    assert.ok(html.includes(`id="${name}"`),`${name} missing in HTML`);
    assert.ok(main.includes(`'${name}'`),`${name} missing in JS`);
  }
  assert.ok(!html.includes('id="capture-f4"'));
  assert.ok(!html.includes('id="capture-c5"'));
});
test('All lesson events were shifted down one octave relative to old F4 version',()=>{
  const first=lessons.find(l=>l.id==='middle-c');
  assert.deepEqual(first.notes,[53,53,53,53,53]);
  const five=lessons.find(l=>l.id==='five-fingers');
  assert.deepEqual(five.notes,[53,55,57,58,60,58,57,55,53]);
  const melody=lessons.find(l=>l.id==='little-melody');
  assert.deepEqual(melody.notes,[53,53,60,60,62,62,60,58,58,57,57,55,55,53]);
});
