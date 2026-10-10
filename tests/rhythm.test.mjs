import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {eventTimeline,RhythmSession,gradeHold,gradeTiming,SPEEDS,lessonBeats} from '../js/rhythm.js';
import {durationName,noteLabel} from '../js/score-strip.js';
const lessons=JSON.parse(readFileSync(new URL('../lessons/lessons.json',import.meta.url)));
test('every lesson has deterministic valid rhythm and tempo',()=>{
 assert.equal(lessons.length,20);
 for(const lesson of lessons){
  const beats=lessonBeats(lesson);assert.equal(beats.length,lesson.notes.length);
  const timeline=eventTimeline(lesson,lesson.bpm||80,1);
  assert.equal(timeline.events.length,lesson.notes.length);
  assert.equal(timeline.events[0].onsetMs,0);
  assert.ok(timeline.totalMs>0);
 }
});
test('five speeds from quarter through double adjust effective tempo and event spacing',()=>{
 assert.deepEqual(SPEEDS,[.25,.5,1,1.5,2]);
 const sample=lessons.find(l=>l.id==='twinkle-twinkle');
 assert.ok(eventTimeline(sample,100,.25).beatMs>eventTimeline(sample,100,2).beatMs);
 assert.equal(eventTimeline(sample,100,2).effectiveBpm,200);
 assert.equal(eventTimeline(sample,100,.25).effectiveBpm,25);
});
test('count-in and early/on-time/late timing are tracked separately',()=>{
 const lesson=lessons.find(l=>l.id==='twinkle-twinkle');
 const session=new RhythmSession(lesson,100,1,4);
 assert.equal(session.start(2000),4400); // 4 beats at 600ms
 assert.equal(session.isCountingIn(4399),true);
 assert.equal(session.isCountingIn(4401),false);
 const first=session.observe(0,4445,'screen');
 assert.equal(first.label,'on-time');
 assert.equal(session.observe(0,5000,'screen'),null); // no double grade
 assert.equal(session.observe(1,4400+600-320,'midi').label,'early');
 assert.equal(session.observe(2,4400+1200+400,'midi').label,'late');
 assert.deepEqual([session.report().assessed,session.report().onTime,session.report().early,session.report().late],[3,1,1,1]);
});
test('hold durations distinguish short, acceptable, long',()=>{
 assert.equal(gradeHold(100,700).label,'short');
 assert.equal(gradeHold(700,700).label,'good');
 assert.equal(gradeHold(1400,700).label,'long');
 const s=new RhythmSession(lessons[0],80);
 assert.equal(s.recordHold(0,750,'midi').label,'good');
 assert.equal(s.recordHold(1,40,'mic'),null);
});
test('score strip uses distinguishable note names and durations',()=>{
 assert.equal(noteLabel(58),'B♭3');assert.equal(durationName(.5),'eighth');assert.equal(durationName(2),'half');
});
test('no unexpected timing grade when player has not started',()=>{
 const session=new RhythmSession(lessons[0],80);
 assert.equal(session.observe(0,1000,'midi'),null);
 assert.equal(session.report().timingAccuracy,null);
});
