import {eventNotes} from './lesson.js?v=2.2';
// Pure timeline builder, including simultaneous chord events.
export function buildMelodyTimeline(notes,beats,bpm,lead=0.12){
 if(!Array.isArray(notes)||!notes.length||!Array.isArray(beats)||beats.length!==notes.length)throw new Error('Invalid preview notes and beats');
 if(!Number.isFinite(bpm)||bpm<=0)throw new Error('Invalid tempo');
 let t=lead;const events=notes.map((event,i)=>{const duration=beats[i]*60/bpm;if(!Number.isFinite(duration)||duration<=0)throw new Error('Invalid duration');const pitches=eventNotes(event);if(!pitches.length)throw new Error('Empty chord');const e={midi:pitches.length===1?pitches[0]:pitches,notes:pitches,start:t,duration};t+=duration;return e;});
 return {events,totalSeconds:t};
}
