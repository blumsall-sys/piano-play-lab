import test from 'node:test';
import assert from 'node:assert/strict';
import {LoopPractice} from '../js/loop-practice.js';
import {LessonEngine} from '../js/lesson.js';
import {RhythmSession} from '../js/rhythm.js';
import {readFileSync} from 'node:fs';
const lessons=JSON.parse(readFileSync(new URL('../lessons/lessons.json',import.meta.url),'utf8'));
const setup=(id='middle-c',opts={})=>{
  const engine=new LessonEngine(lessons);engine.select(id);
  const loop=new LoopPractice(engine.lesson,80,1,opts);
  const session=new RhythmSession(engine.lesson,80,1);session.start(0);session.loopPractice=loop;
  return {engine,loop,session};
};
test('25-key F3–F5 song repeats three times with exactly four rest beats',()=>{
 const {loop}=setup();assert.equal(loop.passes,3);assert.equal(loop.restBeats,4);
 assert.equal(loop.startBeat(1)-loop.endBeat(0),4);
 assert.equal(loop.startBeat(2)-loop.endBeat(1),4);
 assert.equal(loop.totalBeats(),3*5+8);
});
test('successful complete first attempt still requires all three repetitions',()=>{
 const {engine,loop,session}=setup();
 for(let i=0;i<5;i++){
  assert.equal(loop.isAllowed(engine.position,i),true);
  engine.accept(53);session.observe(i,session.anchorMs+i*session.timeline.beatMs,'midi');
 }
 const transition=loop.advance(5,engine,session);
 assert.equal(transition.finished,false);assert.equal(loop.phase,'rest');assert.equal(loop.passed,true);
 assert.equal(loop.report().attempts.length,1);
 assert.equal(loop.report().attempts[0].missed,0);
});
test('missed notes are not silently counted as accurate and do not block subsequent attempts',()=>{
 const {engine,loop,session}=setup();
 let transition=loop.advance(5,engine,session);
 assert.equal(transition.finished,false);assert.equal(loop.phase,'rest');
 assert.equal(loop.results[0].missed,5);assert.equal(loop.results[0].passed,false);
 transition=loop.advance(7,engine,session);
 assert.equal(transition.phase,'rest');assert.equal(transition.restRemaining,2);
 transition=loop.advance(9,engine,session);
 assert.equal(transition.reset,true);assert.equal(loop.passIndex,1);assert.equal(engine.position,0);
 assert.equal(engine.summary().missedNotes,0);
 assert.equal(loop.isAllowed(0,7),false);
 assert.equal(loop.isAllowed(0,9),true);
});
test('all three unsuccessful tries end without passing or unlocking',()=>{
 const {engine,loop,session}=setup();
 for(let pass=0;pass<3;pass++){
  if(pass)loop.advance(loop.startBeat(pass),engine,session);
  loop.advance(loop.endBeat(pass),engine,session);
 }
 assert.equal(loop.finished,true);assert.equal(loop.passed,false);
 assert.equal(loop.results.length,3);
 assert.equal(loop.results.every(x=>x.missed===5),true);
 assert.equal(loop.report().reason,'out-of-tries');
});
test('early notes outside their slot are blocked, including on the four-beat break',()=>{
 const {engine,loop,session}=setup();
 assert.equal(loop.isAllowed(1,0),false);
 assert.equal(loop.isAllowed(0,-.8),false);
 loop.advance(5,engine,session);
 assert.equal(loop.isAllowed(0,6),false);
});
test('rhythm grades are correctly offset for subsequent loops',()=>{
 const {engine,loop,session}=setup();
 loop.advance(5,engine,session);loop.advance(9,engine,session);
 const grade=session.observe(0,session.anchorMs+9*session.timeline.beatMs,'midi');
 assert.equal(grade.pass,1);assert.equal(grade.onTime,true);
 assert.equal(session.reportPass(1).onTime,1);
});
test('chords repeat with their entire note set and missed pitches count individually',()=>{
 const {engine,loop,session}=setup('f-major',{needOnTime:false});
 engine.accept(53);
 const change=loop.advance(1,engine,session);
 assert.equal(change.skipped,1);
 assert.equal(engine.missedNotes,2);
});
test('the built project includes accessible repeat and loop status controls',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const main=readFileSync(new URL('../js/main.js',import.meta.url),'utf8');
 for(const name of ['rhythm-loop','rhythm-loop-status','loop-results'])assert.ok(html.includes(`id="${name}"`));
 assert.match(main,/new LoopPractice\(/);
 assert.match(main,/setInterval\(updateLoopPractice,30\)/);
});
