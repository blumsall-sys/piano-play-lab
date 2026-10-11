import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LessonEngine,eventNotes} from '../js/lesson.js';
import {LoopPractice} from '../js/loop-practice.js';
import {RhythmSession} from '../js/rhythm.js';
const lessons=JSON.parse(readFileSync(new URL('../lessons/lessons.json',import.meta.url),'utf8'));

const complete=(engine)=>{for(const event of engine.lesson.notes){for(const note of eventNotes(event))assert.equal(engine.accept(note).correct,true);}};

test('every one of the 50 lessons completes exactly three guided repetitions, including chords',()=>{
 assert.equal(lessons.length,50);
 for(const lesson of lessons){
   const engine=new LessonEngine(lessons);engine.select(lesson.id);
   const loop=new LoopPractice(lesson,lesson.bpm||80,1,{guided:true,passes:3,restBeats:4});
   for(let pass=0;pass<3;pass++){
     complete(engine);
     assert.equal(engine.state().done,true,`${lesson.id} pass ${pass+1}`);
     const summary=loop.completeGuidedPass(engine);
     assert.equal(summary.pass,pass+1);
     assert.equal(summary.missed,0);
     assert.equal(summary.accuracy,100);
     assert.equal(loop.finished,pass===2,`${lesson.id} finished too early`);
     if(pass<2){
       assert.equal(loop.phase,'rest');
       assert.equal(loop.startBeat(pass+1)-loop.endBeat(pass),4,lesson.id);
       assert.equal(loop.resumeGuidedPass(engine),true);
       assert.equal(engine.position,0);
     }
   }
   assert.equal(loop.report().attempts.length,3);
   assert.equal(loop.report().totals.expectedPresses,engine.expectedPresses*3);
   assert.equal(loop.report().totals.correctPresses,engine.expectedPresses*3);
   assert.equal(loop.report().totals.accuracy,100);
 }
});

test('Lesson 21 expects 27 successful key presses, plus two four-beat rests',()=>{
 const l=lessons[20]; assert.equal(l.id,'rh-five-fingers');
 assert.equal(l.notes.length,9);
 const engine=new LessonEngine(lessons);engine.select(l.id);
 const loop=new LoopPractice(l,66,1,{guided:true});
 for(let p=0;p<3;p++){
   complete(engine);loop.completeGuidedPass(engine);
   if(p<2)loop.resumeGuidedPass(engine);
 }
 assert.deepEqual(loop.report().totals,{expectedPresses:27,attempts:27,correctPresses:27,wrongPresses:0,missedNotes:0,accuracy:100});
 assert.equal(loop.startBeat(1)-loop.endBeat(0),4);
 assert.equal(loop.startBeat(2)-loop.endBeat(1),4);
});

test('successful on-time Perform pass does not stop repetitions early',()=>{
 const engine=new LessonEngine(lessons);engine.select('rh-five-fingers');
 const loop=new LoopPractice(engine.lesson,66,1,{passes:3,restBeats:4,needOnTime:true});
 const session=new RhythmSession(engine.lesson,66,1);session.start(0);session.loopPractice=loop;
 for(let pass=0;pass<3;pass++){
   if(pass){const transition=loop.advance(loop.startBeat(pass),engine,session);assert.equal(transition.reset,true);}
   for(let i=0;i<engine.lesson.notes.length;i++){
     engine.accept(engine.lesson.notes[i]);
     session.observe(i,session.anchorMs+(loop.startBeat(pass)+session.timeline.events[i].startBeat)*session.timeline.beatMs,'midi');
   }
   loop.advance(loop.endBeat(pass),engine,session);
   assert.equal(loop.finished,pass===2);
 }
 assert.equal(loop.results.length,3);
 assert.equal(loop.passed,true);
 assert.equal(loop.report().totals.attempts,27);
 assert.equal(loop.report().totals.expectedPresses,27);
 assert.deepEqual(loop.results.map(r=>r.onTime),[9,9,9]);
});

test('mistakes in one repetition do not alter the notes or expected count of later repetitions',()=>{
 const engine=new LessonEngine(lessons);engine.select('rh-five-fingers');
 const loop=new LoopPractice(engine.lesson,66,1,{guided:true});
 engine.accept(77);complete(engine);loop.completeGuidedPass(engine);
 assert.equal(loop.results[0].wrong,1);
 assert.equal(loop.finished,false);
 loop.resumeGuidedPass(engine);complete(engine);loop.completeGuidedPass(engine);
 loop.resumeGuidedPass(engine);complete(engine);loop.completeGuidedPass(engine);
 assert.equal(loop.results.length,3);
 assert.equal(loop.report().totals.attempts,28);
 assert.equal(loop.report().totals.correctPresses,27);
 assert.equal(loop.report().totals.expectedPresses,27);
 assert.equal(loop.report().totals.accuracy,27/28*100);
});

test('Learn and Perform pathways are wired to the same three-repetition controller',()=>{
 const main=readFileSync(new URL('../js/main.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(main,/function createGuidedLoop/);
 assert.match(main,/function handleGuidedPassCompletion/);
 assert.match(main,/if\(result\.done\)handleGuidedPassCompletion\(\)/);
 assert.match(main,/new LoopPractice\(engine\.lesson,bpm,speed,\{passes:3,restBeats:4/);
 assert.match(html,/3 repetitions · 1-bar breaks/);
});
