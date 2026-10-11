import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LessonEngine,validateLessons,eventNotes} from '../js/lesson.js';
import {loadLessonCatalog,validateCatalogUpgrade} from '../js/catalog-loader.js';
import {eventTimeline} from '../js/rhythm.js';
import {unlockedThrough} from '../js/game-ui.js';
const lessonList=JSON.parse(readFileSync(new URL('../lessons/lessons.json',import.meta.url),'utf8'));

test('50 lessons with 30 new uniquely identifiable lessons and correct notes',()=>{
  assert.ok(lessonList.length>=50);
  assert.equal(new Set(lessonList.map(l=>l.id)).size,50);
  assert.ok(validateLessons(lessonList).length>=50);
  const added=lessonList.slice(20,50);
  assert.equal(added.length,30);
  assert.ok(added.some(l=>l.category==='theory'));
  assert.ok(added.some(l=>l.category==='hands'));
  assert.ok(added.some(l=>l.category==='song'));
  assert.ok(added.some(l=>l.notes.some(Array.isArray)));
  for(const l of added){
    assert.match(l.spokenInstructions,/^Hey Cleo, for this lesson we are going to /);
    assert.ok(l.bpm>=50&&l.bpm<=100);
    assert.equal(l.notes.length,l.melodyBeats.length);
    assert.ok(l.notes.every(n=>eventNotes(n).every(k=>k>=53&&k<=77)));
    assert.equal(eventTimeline(l,l.bpm).events.length,l.notes.length);
  }
});
test('all supplied finger assignments align with the notes in their events',()=>{
  for(const l of lessonList){
    if(!l.handAssignments)continue;
    assert.equal(l.handAssignments.length,l.notes.length);
    for(let i=0;i<l.notes.length;i++){
      assert.equal(eventNotes(l.handAssignments[i]).length,eventNotes(l.notes[i]).length);
      for(const code of eventNotes(l.handAssignments[i]))assert.match(code,/^(LH|RH)[1-5]$/);
    }
  }
  const invalid={...lessonList[29],handAssignments:[['RH1']]};
  assert.throws(()=>validateLessons([invalid]),/finger guidance/);
});
test('the 50th lesson can be played and passed with existing note/chord engine',()=>{
  const engine=new LessonEngine(lessonList);engine.select(lessonList[49].id);
  const {notes}=engine.lesson;
  for(const event of notes){
    for(const midi of eventNotes(event))assert.equal(engine.accept(midi).correct,true);
  }
  assert.equal(engine.state().done,true);
  assert.equal(engine.summary().accuracy,100);
  assert.equal(engine.state().nextLessonId,lessonList[50]?.id??null);
});
test('existing lesson IDs stay stable for saved progress',()=>{
  assert.equal(unlockedThrough(lessonList,[],true),lessonList.length);
  assert.equal(unlockedThrough(lessonList,[{lessonId:lessonList[0].id,keyAccuracy:100}]),2);
});
test('editing only lessons.json can append a 51st lesson with no code changes',async()=>{
  const next={id:'future-51',title:'Next Tune',description:'Try a tune',hint:'Find F',notes:[53,55],melodyBeats:[1,2],spokenInstructions:'Hey Cleo, for this lesson we are going to play a new tune.'};
  const catalog=[...lessonList,next];
  assert.equal(validateCatalogUpgrade(catalog,lessonList).length,51);
  const calls=[];
  const fetcher=async (url,opts)=>{calls.push({url,opts});return {ok:true,json:async()=>catalog};};
  const result=await loadLessonCatalog({fallback:lessonList,fetcher,now:()=>123});
  assert.equal(result.source,'lessons.json');
  assert.equal(result.lessons.length,51);
  assert.match(calls[0].url,/lessons\.json\?catalog=123/);
  assert.equal(calls[0].opts.cache,'no-store');
});
test('invalid or old external catalog falls back with a visible warning',async()=>{
  for(const bad of [lessonList.slice(0,20),[...lessonList.slice(0,49),{...lessonList[49],id:'renamed-id'}]]){
    const result=await loadLessonCatalog({fallback:lessonList,fetcher:async()=>({ok:true,json:async()=>bad})});
    assert.equal(result.source,'embedded fallback');
    assert.ok(result.warning);
    assert.equal(result.lessons.length,50);
  }
  const missing=await loadLessonCatalog({fallback:lessonList,fetcher:async()=>{throw Error('Offline');}});
  assert.match(missing.warning,/Offline/);
});
