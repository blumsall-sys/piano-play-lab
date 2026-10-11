import {MIN_MIDI,MAX_MIDI} from './music.js?v=2.2';
export const eventNotes=event=>Array.isArray(event)?event:[event];
export function validateLessons(lessons){
 if(!Array.isArray(lessons)||!lessons.length)throw new Error('No lessons.');
 const ids=new Set();
 for(const lesson of lessons){
  if(!lesson.id||!lesson.title||!lesson.description||!Array.isArray(lesson.notes)||!lesson.notes.length||ids.has(lesson.id))throw new Error('Invalid or duplicate lesson '+lesson.id);
  ids.add(lesson.id);
  for(const event of lesson.notes){
   const notes=eventNotes(event);
   if(!notes.length||notes.length>5||new Set(notes).size!==notes.length||notes.some(n=>!Number.isInteger(n)||n<MIN_MIDI||n>MAX_MIDI))throw new Error('Invalid note/chord in '+lesson.id);
  }
  if(lesson.melodyBeats&&(!Array.isArray(lesson.melodyBeats)||lesson.melodyBeats.length!==lesson.notes.length||lesson.melodyBeats.some(b=>!Number.isFinite(b)||b<=0)))throw new Error('Invalid note durations in '+lesson.id);
 }
 return lessons;
}
export class LessonEngine{
 constructor(lessons){this.lessons=validateLessons(lessons);this.select(lessons[0].id);}
 select(id){const index=this.lessons.findIndex(l=>l.id===id);if(index<0)throw new Error('Unknown lesson');this.lessonIndex=index;this.lesson=this.lessons[index];return this.restart();}
 restart(){this.position=0;this.attempts=0;this.correctPresses=0;this.wrongPresses=0;this.missedNotes=0;this.collected=new Set();return this.state();}
 get target(){return this.lesson.notes[this.position]??null;}
 get expectedPresses(){return this.lesson.notes.reduce((n,event)=>n+eventNotes(event).length,0);}
 nextLessonId(){return this.lessons[this.lessonIndex+1]?.id??null;}
 summary(){const expected=this.expectedPresses,attempts=this.attempts,correct=this.correctPresses,wrong=this.wrongPresses,missed=this.missedNotes;return {expectedPresses:expected,attempts,correctPresses:correct,wrongPresses:wrong,missedNotes:missed,accuracy:attempts+missed?correct/(attempts+missed)*100:0,perfect:wrong===0&&missed===0&&attempts===expected};}
 state(){return {lesson:this.lesson,lessonIndex:this.lessonIndex,position:this.position,length:this.lesson.notes.length,done:this.target===null,target:this.target,remaining:this.target?eventNotes(this.target).filter(n=>!this.collected.has(n)):[],collected:[...this.collected],nextLessonId:this.nextLessonId(),summary:this.summary()};}
 accept(midi){
  if(this.target===null)return {correct:false,finished:true,...this.state()};
  const required=eventNotes(this.target),expected=this.target;
  const beforePosition=this.position;
  this.attempts++;
  const correct=required.includes(midi)&&!this.collected.has(midi);
  if(correct){this.collected.add(midi);this.correctPresses++;if(this.collected.size===required.length){this.position++;this.collected.clear();}}
  else this.wrongPresses++;
  return {correct,expected,finished:this.target===null,eventComplete:this.position!==beforePosition,...this.state()};
 }
 skipEvent(){
  if(this.target===null)return 0;
  const remaining=eventNotes(this.target).filter(n=>!this.collected.has(n)).length;
  this.missedNotes+=remaining;
  this.position++;
  this.collected.clear();
  return remaining;
 }
 // Accept a simultaneous MIDI chord by processing each newly played pitch once.
 acceptChord(notes){let result=null;for(const n of [...new Set(notes)]){if(this.target===null)break;result=this.accept(n);}return result??{correct:false,...this.state()};}
}
