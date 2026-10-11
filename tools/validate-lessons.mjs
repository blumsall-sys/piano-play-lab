// Usage: node tools/validate-lessons.mjs
// Check live JSON independently of the static 50-lesson fallback in index.html.
import {readFileSync} from 'node:fs';
import {validateLessons,eventNotes} from '../js/lesson.js';
const catalog=JSON.parse(readFileSync(new URL('../lessons/lessons.json',import.meta.url),'utf8'));
const lessons=validateLessons(catalog);
if(lessons.length<50)throw Error(`Catalog is missing lessons: expected at least 50, found ${lessons.length}`);
let totalEvents=0,totalNotes=0;
for(const lesson of lessons){
  if(lesson.spokenInstructions&&!lesson.spokenInstructions.startsWith('Hey Cleo, for this lesson we are going to '))throw Error('Lesson '+lesson.id+' has incorrect narrator introduction');
  totalEvents+=lesson.notes.length;totalNotes+=lesson.notes.reduce((n,event)=>n+eventNotes(event).length,0);
}
console.log(`VALID · ${lessons.length} lessons · ${totalEvents} musical events · ${totalNotes} expected key presses`);
console.log('First:',lessons[0].title,'\nLast:',lessons.at(-1).title);
