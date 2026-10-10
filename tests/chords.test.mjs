import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LessonEngine,eventNotes,validateLessons} from '../js/lesson.js';
import {midiToFrequency} from '../js/music.js';
import {buildMelodyTimeline} from '../js/melody.js';
import {spectralNotes,ChordFrameStabilizer} from '../js/chord-audio.js';
const lessons=JSON.parse(readFileSync(new URL('../lessons/lessons.json',import.meta.url),'utf8'));
test('Twenty lessons with eleven chord lessons and all notes within toy piano',()=>{
 assert.equal(validateLessons(lessons).length,20);
 assert.equal(lessons.filter(l=>l.notes.some(Array.isArray)).length,11);
 for(const lesson of lessons)for(const ev of lesson.notes)for(const n of eventNotes(ev))assert.ok(n>=53&&n<=77);
});
test('A chord is not complete until all three different correct notes are played',()=>{
 const e=new LessonEngine(lessons);e.select('f-major');
 assert.deepEqual(e.target,[53,57,60]);
 let r=e.accept(53);assert.equal(r.eventComplete,false);assert.deepEqual(r.remaining,[57,60]);
 r=e.accept(57);assert.equal(r.eventComplete,false);
 r=e.accept(60);assert.equal(r.eventComplete,true);assert.equal(e.position,1);
 assert.equal(e.state().summary.correctPresses,3);
});
test('Wrong or repeated key counts as extra attempt; score measures individual presses',()=>{
 const e=new LessonEngine(lessons);e.select('c-major');
 e.accept(60);e.accept(60);e.accept(71);e.accept(64);e.accept(67);
 const x=e.summary();assert.equal(x.attempts,5);assert.equal(x.correctPresses,3);assert.equal(x.wrongPresses,2);assert.equal(x.accuracy,60);
 assert.equal(x.expectedPresses,9);
});
test('Chord preview has simultaneous notes at the same start time',()=>{
 const l=lessons.find(x=>x.id==='three-chord-song');
 const events=buildMelodyTimeline(l.notes,l.melodyBeats,l.bpm).events;
 assert.equal(events.length,4);assert.deepEqual(events[0].notes,[53,57,60]);
 assert.equal(events[1].start,events[0].start+events[0].duration);
});
test('Reject duplicate note within a chord',()=>{
 assert.throws(()=>validateLessons([{id:'bad',title:'Bad',description:'Bad',notes:[[53,53,60]]}]),/Invalid note/);
});
test('Chords held on MIDI can be accepted atomically',()=>{
 const e=new LessonEngine(lessons);e.select('f-major');
 const r=e.acceptChord([53,57,60]);
 assert.equal(r.eventComplete,true);assert.equal(e.position,1);assert.equal(e.summary().attempts,3);
});
function synth(notes){const fs=48000,n=8192;return Float32Array.from({length:n},(_,i)=>notes.reduce((sum,midi)=>{const f=midiToFrequency(midi);return sum+0.09*Math.sin(2*Math.PI*f*i/fs)+0.018*Math.sin(4*Math.PI*f*i/fs);},0));}
test('Experimental frequency analysis detects simultaneous triad in a clean synthetic recording',()=>{
 const found=spectralNotes(synth([53,57,60]),48000);
 for(const n of [53,57,60])assert.ok(found.includes(n),`Missing ${n}; found ${found}`);
});
test('Experimental frequency analysis does not report a single note as a full triad',()=>{
 const found=spectralNotes(synth([53]),48000);
 assert.equal([53,57,60].every(n=>found.includes(n)),false);
});
test('Chord frame latch emits once until silence resets',()=>{
 const f=new ChordFrameStabilizer(3);
 assert.equal(f.accept([53,57,60]),null);assert.equal(f.accept([53,57,60]),null);
 assert.deepEqual(f.accept([53,57,60]),[53,57,60]);assert.equal(f.accept([53,57,60]),null);
 f.accept([]);f.accept([]);f.accept([]);
 f.accept([53,57,60]);f.accept([53,57,60]);assert.deepEqual(f.accept([53,57,60]),[53,57,60]);
});
test('Repeated single-note lessons still advance and mark each complete',()=>{
 const e=new LessonEngine(lessons);e.select('middle-c');
 assert.equal(e.accept(53).eventComplete,true);assert.equal(e.position,1);
 assert.equal(e.accept(53).eventComplete,true);assert.equal(e.position,2);
});
test('Replaying an identical chord counts as a new event only after re-entering three notes',()=>{
 const e=new LessonEngine(lessons);e.select('f-major');
 assert.equal(e.acceptChord([53,57,60]).eventComplete,true);
 assert.equal(e.position,1);
 assert.equal(e.acceptChord([53,57,60]).eventComplete,true);
 assert.equal(e.position,2);
});
test('Multiple clean simulated chords return exact notes without adjacent ghost notes',()=>{
 for(const chord of [[53,57,60],[60,64,67],[58,62,65],[62,65,69]]){
  assert.deepEqual(spectralNotes(synth(chord),48000),chord);
 }
});
