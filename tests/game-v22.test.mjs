import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {unlockedThrough,checkpoints,restoreActive,saveActive} from '../js/game-ui.js';
import {highwayPosition} from '../js/rhythm-highway.js';
import {LessonEngine} from '../js/lesson.js';
import {eventTimeline} from '../js/rhythm.js';
const lessons=JSON.parse(readFileSync(new URL('../lessons/lessons.json',import.meta.url),'utf8'));
function storage(){const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}}
test('Twenty lessons and every lesson begins its spoken instructions for Cleo',()=>{
 assert.ok(lessons.length>=50);
 for(const l of lessons)assert.match(l.spokenInstructions,/^Hey Cleo, for this lesson we are going to /,l.id);
});
test('Sequential lesson unlocking requires a passing 70% score',()=>{
 assert.equal(unlockedThrough(lessons,[]),1);
 assert.equal(unlockedThrough(lessons,[{lessonId:lessons[0].id,keyAccuracy:69}]),1);
 assert.equal(unlockedThrough(lessons,[{lessonId:lessons[0].id,keyAccuracy:70}]),2);
 assert.equal(unlockedThrough(lessons,[{lessonId:lessons[0].id,keyAccuracy:100},{lessonId:lessons[1].id,keyAccuracy:80}]),3);
 assert.equal(unlockedThrough(lessons,[],true),lessons.length);
});
test('Three learning checkpoints cover the full playable note sequence',()=>{
 const engine=new LessonEngine(lessons);
 const first=checkpoints(engine.state());
 assert.equal(first.length,3);assert.equal(first[0].start,0);assert.equal(first[2].end,5);
 assert.equal(first[0].done,false);
 engine.position=2;assert.equal(checkpoints(engine.state())[0].done,true);
 engine.position=5;assert.ok(checkpoints(engine.state()).every(s=>s.done));
});
test('Rhythm highway follows engine in Learn Mode and beat clock in Perform Mode',()=>{
 const timeline=eventTimeline(lessons[0],80,1);
 assert.equal(highwayPosition({timeline,position:2,anchorMs:null,nowMs:2000}),2);
 assert.equal(highwayPosition({timeline,position:0,anchorMs:1000,nowMs:2500}),2);
 assert.equal(highwayPosition({timeline,position:0,anchorMs:1000,nowMs:250}),-1);
});
test('Partial lesson progression is stored and restored without storing audio',()=>{
 globalThis.localStorage=storage();
 const first=new LessonEngine(lessons);
 first.accept(53);first.accept(53);
 saveActive(first.state());
 const restarted=new LessonEngine(lessons);
 assert.equal(restoreActive(restarted),true);
 assert.equal(restarted.position,2);
 assert.equal(restarted.summary().correctPresses,2);
 restarted.position=5;saveActive(restarted.state());
 assert.equal(localStorage.getItem('cleos-piano-play-v2.2-active'),null);
 delete globalThis.localStorage;
});
test('Game assets include mobile layout, navigation and metronome-ready highway',()=>{
 const main=readFileSync(new URL('../js/main.js',import.meta.url),'utf8');
 const styles=readFileSync(new URL('../css/game-v22.css',import.meta.url),'utf8');
 assert.match(main,/new GameUI\(/);assert.match(styles,/#highway-canvas/);
 assert.match(styles,/@media\(max-width:820px\)/);
});
