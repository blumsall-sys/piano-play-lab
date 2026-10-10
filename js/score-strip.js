import {eventNotes} from './lesson.js?v=2.2';
import {midiToName} from './music.js?v=2.2';
import {lessonBeats} from './rhythm.js?v=2.2';
export function noteLabel(midi){
  // Default to flat spellings for the toy piano's F-major material.
  if(midi%12===10)return `B♭${Math.floor(midi/12)-1}`;
  if(midi%12===8)return `A♭${Math.floor(midi/12)-1}`;
  return midiToName(midi).replace('#','♯');
}
export function durationName(beats){
  if(beats===.5)return 'eighth';if(beats===1)return 'quarter';if(beats===1.5)return 'dotted quarter';
  if(beats===2)return 'half';if(beats===3)return 'dotted half';if(beats===4)return 'whole';return `${beats} beats`;
}
// A deliberately labelled teaching score strip, NOT MusicXML engraving.
export function buildScoreStrip(node,lesson,position,grades=[]){
  const beats=lessonBeats(lesson);node.replaceChildren();
  let beat=0;
  lesson.notes.forEach((event,index)=>{
    const card=document.createElement('div');card.className='score-event';card.dataset.index=index;
    card.classList.toggle('completed',index<position);card.classList.toggle('current',index===position);
    const evaluation=grades.find(g=>g.index===index);
    if(evaluation)card.classList.add(evaluation.label);
    const name=document.createElement('strong');name.textContent=eventNotes(event).map(noteLabel).join(' + ');
    const rhythm=document.createElement('span');rhythm.className='score-rhythm';
    rhythm.textContent=(beats[index]===.5?'♪':beats[index]>=2?'𝅗𝅥':'♩')+' '+durationName(beats[index]);
    const timing=document.createElement('small');timing.textContent=`Beat ${Number((beat+1).toFixed(2))}`;
    card.append(name,rhythm,timing);node.append(card);beat+=beats[index];
  });
  const current=node.querySelector('.current');
  if(current){
    const left=current.offsetLeft+current.offsetWidth/2-node.clientWidth*.28;
    node.scrollTo({left:Math.max(0,left),behavior:'smooth'});
  }
}
