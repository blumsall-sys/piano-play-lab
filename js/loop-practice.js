// Deterministic three-pass music practice: no browser APIs and no timers here.
// The metronome and score-following canvas read the SAME beat clock.
import {eventTimeline} from './rhythm.js';

export class LoopPractice {
  constructor(lesson,bpm,speed,{passes=3,restBeats=4,needOnTime=false}={}){
    if(!Number.isInteger(passes)||passes<1||passes>9)throw Error('Invalid number of passes');
    if(!Number.isInteger(restBeats)||restBeats<0||restBeats>16)throw Error('Invalid rest duration');
    this.timeline=eventTimeline(lesson,bpm,speed);
    this.passes=passes;this.restBeats=restBeats;this.needOnTime=needOnTime;
    this.passIndex=0;this.phase='playing';this.results=[];this.finished=false;this.passed=false;
    this.completionReason='';this.best=null;
  }
  startBeat(pass=this.passIndex){return pass*(this.timeline.totalBeats+this.restBeats);}
  endBeat(pass=this.passIndex){return this.startBeat(pass)+this.timeline.totalBeats;}
  totalBeats(){return this.endBeat(this.passes-1);}
  // A note may be played slightly before the guide reaches the PLAY line.
  isAllowed(index,absoluteBeat){
    if(this.finished||this.phase!=='playing')return false;
    const event=this.timeline.events[index];if(!event)return false;
    const relative=absoluteBeat-this.startBeat();
    const earlyGrace=Math.min(.4,event.durationBeats*.36);
    return relative>=event.startBeat-earlyGrace && relative<event.startBeat+event.durationBeats;
  }
  recordPass(engine,session){
    const summary=engine.summary();
    const report=session?.reportPass(this.passIndex)??null;
    const notesComplete=engine.state().done && summary.missedNotes===0;
    const timingGood=!this.needOnTime||!report||
      (report.assessed===engine.lesson.notes.length&&report.onTime/report.assessed>=.7);
    const pass=notesComplete&&summary.accuracy>=70&&timingGood;
    const result={pass:this.passIndex+1,passed:pass,accuracy:summary.accuracy,
      correct:summary.correctPresses,attempts:summary.attempts,missed:summary.missedNotes,
      wrong:summary.wrongPresses,expected:summary.expectedPresses,
      onTime:report?.onTime??0,assessed:report?.assessed??0};
    this.results.push(result);
    if(!this.best||result.accuracy>this.best.accuracy ||
       (result.accuracy===this.best.accuracy&&result.missed<this.best.missed))this.best={...result};
    if(pass){this.passed=true;this.finished=true;this.phase='finished';this.completionReason='success';}
    else if(this.passIndex===this.passes-1){this.finished=true;this.phase='finished';this.completionReason='out-of-tries';}
    else this.phase='rest';
    return result;
  }
  // Called frequently, including on missed notes. Emits transitions so the UI can react.
  advance(absoluteBeat,engine,session){
    if(this.finished)return {phase:'finished',passIndex:this.passIndex};
    const transition={phase:this.phase,passIndex:this.passIndex,skipped:0,reset:false,result:null,finished:false};
    if(this.phase==='rest'){
      const nextStart=this.startBeat(this.passIndex+1);
      if(absoluteBeat<nextStart){transition.restRemaining=Math.max(0,Math.ceil(nextStart-absoluteBeat));return transition;}
      this.passIndex++;
      engine.restart();
      this.phase='playing';transition.reset=true;transition.passIndex=this.passIndex;
    }
    const relative=absoluteBeat-this.startBeat();
    while(engine.position<engine.lesson.notes.length){
      const event=this.timeline.events[engine.position];
      if(relative<event.startBeat+event.durationBeats)break;
      engine.skipEvent();transition.skipped++;
    }
    if(absoluteBeat>=this.endBeat()){
      transition.result=this.recordPass(engine,session);
      transition.finished=this.finished;
    }
    transition.phase=this.phase;
    if(this.phase==='rest')transition.restRemaining=this.restBeats;
    return transition;
  }
  report(){return {passes:this.passes,attempts:this.results,passed:this.passed,best:this.best,finished:this.finished,reason:this.completionReason};}
}
