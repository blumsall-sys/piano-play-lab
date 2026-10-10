import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateLessons,LessonEngine} from '../js/lesson.js';
import {MIN_MIDI,MAX_MIDI} from '../js/music.js';
import {buildMelodyTimeline} from '../js/melody.js';
const lessons = JSON.parse(readFileSync(new URL('../lessons/lessons.json',import.meta.url),'utf8'));
const newIDs=['twinkle-twinkle','wheels-on-bus','puppy-rescue','ice-cream-truck','mary-lamb'];
test('Five new melody lessons included alongside original four',()=>{
  assert.equal(validateLessons(lessons).length,20);
  assert.deepEqual(lessons.slice(4,9).map(l=>l.id),newIDs);
  for(const l of lessons.slice(4,9)){
    assert.ok(l.spokenInstructions.length>60);
    assert.equal(l.notes.length,l.melodyBeats.length);
    assert.ok(l.notes.every(n=>n>=MIN_MIDI&&n<=MAX_MIDI));
    assert.ok(l.melodyBeats.every(x=>x>0&&x<=8));
  }
});
test('Rhythmic preview builds one event per press and stays in sequence',()=>{
  for(const l of lessons.slice(4,9)){
    const timeline=buildMelodyTimeline(l.notes,l.melodyBeats,l.bpm);
    assert.equal(timeline.events.length,l.notes.length);
    assert.ok(timeline.totalSeconds>3);
    assert.equal(timeline.events[0].midi,l.notes[0]);
    for(let i=1;i<timeline.events.length;i++){
      const previous=timeline.events[i-1];
      assert.ok(Math.abs(timeline.events[i].start-(previous.start+previous.duration))<1e-6);
    }
  }
});
test('Music previews never alter the score; attempts count only after key events',()=>{
  const e=new LessonEngine(lessons);
  e.select('twinkle-twinkle');
  const before=e.state().summary;
  const timeline=buildMelodyTimeline(e.lesson.notes,e.lesson.melodyBeats,e.lesson.bpm);
  assert.equal(timeline.events.length,e.lesson.notes.length);
  assert.deepEqual(e.state().summary,before);
  assert.equal(e.accept(60).correct,false);
  assert.equal(e.accept(65).correct,true);
  assert.equal(e.state().summary.attempts,2);
  assert.equal(e.state().summary.correctPresses,1);
});
test('Completing each melody offers the correct next lesson and metrics',()=>{
  const e=new LessonEngine(lessons);
  for(let i=4;i<9;i++){
    e.select(lessons[i].id);
    for(const n of e.lesson.notes)assert.equal(e.accept(n).correct,true);
    assert.equal(e.state().done,true);
    assert.equal(e.state().summary.accuracy,100);
    assert.equal(e.state().summary.attempts,e.state().summary.expectedPresses);
    assert.equal(e.state().nextLessonId,lessons[i+1]?.id||null);
  }
});
test('Invalid beat arrays and out-of-range notes fail cleanly',()=>{
  assert.throws(()=>validateLessons([{...lessons[4],melodyBeats:[1,2]}]),/duration|beat/i);
  assert.throws(()=>validateLessons([{...lessons[4],notes:[78]}]),/invalid note/i);
});
