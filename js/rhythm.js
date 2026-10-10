// Score-following and timing calculations independent of browser/audio APIs.
export const SPEEDS = [0.25, 0.5, 1, 1.5, 2];
export function lessonBeats(lesson){
  const beats=lesson.melodyBeats ?? lesson.notes.map(()=>1);
  if(beats.length!==lesson.notes.length || beats.some(b=>!Number.isFinite(b)||b<=0))throw Error('Invalid lesson rhythm');
  return beats;
}
export function eventTimeline(lesson,bpm,multiplier=1){
  if(!Number.isFinite(bpm)||bpm<30||bpm>220||!SPEEDS.includes(multiplier))throw Error('Invalid practice tempo');
  const beatMs=60000/(bpm*multiplier);
  let beat=0;
  const events=lessonBeats(lesson).map((length,index)=>{
    const result={index,startBeat:beat,durationBeats:length,onsetMs:beat*beatMs,durationMs:length*beatMs};
    beat+=length;return result;
  });
  return {events,beatMs,totalBeats:beat,totalMs:beat*beatMs,effectiveBpm:bpm*multiplier};
}
export function gradeTiming(deltaMs,beatMs){
  const tolerance=Math.min(420,Math.max(85,beatMs*.27));
  return {deltaMs:Math.round(deltaMs),toleranceMs:Math.round(tolerance),label:deltaMs<-tolerance?'early':deltaMs>tolerance?'late':'on-time',onTime:Math.abs(deltaMs)<=tolerance};
}
export function gradeHold(actualMs,expectedMs){
  if(!Number.isFinite(actualMs)||actualMs<0)return null;
  const ratio=actualMs/expectedMs;
  return {durationMs:Math.round(actualMs),expectedMs:Math.round(expectedMs),ratio:Math.round(ratio*100)/100,label:ratio<.6?'short':ratio>1.45?'long':'good'};
}
export class RhythmSession{
  constructor(lesson,bpm,multiplier=1,countIn=4){
    this.lesson=lesson;this.timeline=eventTimeline(lesson,bpm,multiplier);this.countIn=countIn;
    this.anchorMs=null;this.grades=new Map();this.holds=new Map();
  }
  start(nowMs){this.anchorMs=nowMs+this.countIn*this.timeline.beatMs;return this.anchorMs;}
  isCountingIn(nowMs){return this.anchorMs!==null&&nowMs<this.anchorMs;}
  observe(index,onsetMs,source){
    if(this.anchorMs===null||this.grades.has(index)||!this.timeline.events[index])return null;
    const target=this.anchorMs+this.timeline.events[index].onsetMs;
    const result={index,source,...gradeTiming(onsetMs-target,this.timeline.beatMs),onsetMs:Math.round(onsetMs),targetMs:Math.round(target)};
    this.grades.set(index,result);return result;
  }
  recordHold(index,actualMs,source){
    if(!this.timeline.events[index]||!['midi','screen'].includes(source))return null;
    const result={index,source,...gradeHold(actualMs,this.timeline.events[index].durationMs)};
    this.holds.set(index,result);return result;
  }
  report(){
    const values=[...this.grades.values()];
    const onTime=values.filter(g=>g.onTime).length;
    const holds=[...this.holds.values()];
    return {assessed:values.length,onTime,early:values.filter(g=>g.label==='early').length,late:values.filter(g=>g.label==='late').length,
      timingAccuracy:values.length?Math.round(1000*onTime/values.length)/10:null,
      holdsMeasured:holds.length,holdsGood:holds.filter(h=>h.label==='good').length,
      events:values,holds};
  }
}
