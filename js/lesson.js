import {MIN_MIDI,MAX_MIDI} from './music.js?v=1.8.1';
export function validateLessons(lessons) {
  if(!Array.isArray(lessons)||!lessons.length) throw new Error('Lesson file has no lessons.');
  const ids=new Set();
  for(const lesson of lessons) {
    if(typeof lesson.id!=='string'||!lesson.title||!lesson.description||!Array.isArray(lesson.notes)||!lesson.notes.length) throw new Error('Malformed lesson.');
    if(ids.has(lesson.id)) throw new Error('Duplicate lesson ID: '+lesson.id);
    ids.add(lesson.id);
    for(const midi of lesson.notes) if(!Number.isInteger(midi)||midi<MIN_MIDI||midi>MAX_MIDI) throw new Error(`Lesson ${lesson.id} has an out-of-range MIDI note: ${midi}`);
    if(lesson.melodyBeats!==undefined){
      if(!Array.isArray(lesson.melodyBeats)||lesson.melodyBeats.length!==lesson.notes.length||!lesson.melodyBeats.every(b=>Number.isFinite(b)&&b>0&&b<=8)) throw new Error(`Lesson ${lesson.id} has invalid melody beat values.`);
    }
    if(lesson.bpm!==undefined && (!Number.isFinite(lesson.bpm)||lesson.bpm<40||lesson.bpm>180)) throw new Error(`Lesson ${lesson.id} has invalid tempo.`);
  }
  return lessons;
}
export class LessonEngine {
  constructor(lessons){this.lessons=validateLessons(lessons);this.select(lessons[0].id);}
  select(id){
    const index=this.lessons.findIndex(l=>l.id===id);
    if(index<0) throw new Error('Unknown lesson: '+id);
    this.lessonIndex=index;
    this.lesson=this.lessons[index];
    this.position=0;
    this.attempts=0;
    this.correctPresses=0;
    return this.state();
  }
  restart(){
    this.position=0;
    this.attempts=0;
    this.correctPresses=0;
    return this.state();
  }
  get target(){return this.lesson.notes[this.position] ?? null;}
  get expectedPresses(){return this.lesson.notes.length;}
  nextLesson(){
    const nextIndex=Math.min(this.lessonIndex+1,this.lessons.length-1);
    return this.select(this.lessons[nextIndex].id);
  }
  nextLessonId(){return this.lessonIndex < this.lessons.length-1 ? this.lessons[this.lessonIndex+1].id : null;}
  summary(){
    const expected=this.expectedPresses;
    const attempts=this.attempts;
    const correct=this.correctPresses;
    const wrong=Math.max(0,attempts-correct);
    const accuracy=attempts?correct/attempts*100:0;
    return {expectedPresses:expected,attempts,correctPresses:correct,wrongPresses:wrong,accuracy,perfect:attempts===expected&&wrong===0};
  }
  state(){return {lesson:this.lesson,lessonIndex:this.lessonIndex,position:this.position,length:this.lesson.notes.length,done:this.position===this.lesson.notes.length,target:this.target,nextLessonId:this.nextLessonId(),summary:this.summary()};}
  accept(midi){
    if(this.target===null) return {correct:false,finished:true,expected:null,...this.state()};
    this.attempts++;
    const expected=this.target;
    const correct=expected===midi;
    if(correct){this.correctPresses++;this.position++;}
    return {correct,expected,finished:this.position===this.lesson.notes.length,...this.state()};
  }
}
