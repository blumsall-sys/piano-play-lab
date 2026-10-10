// Browser metronome: schedule short ticks on AudioContext clock.
export class Metronome{
  constructor(onBeat=()=>{}){this.onBeat=onBeat;this.context=null;this.timer=null;this.nextBeat=-4;this.running=false;this.scheduled=[];}
  async start(session,{audible=true}={}){
    this.stop();
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context)throw Error('Web Audio is unavailable on this device');
    this.context=new Context();
    if(this.context.state==='suspended')await this.context.resume();
    if(this.context.state!=='running')throw Error('Audio could not start. Tap Start rhythm again.');
    this.session=session;this.audible=audible;this.nextBeat=-session.countIn;
    session.start(performance.now()+150);
    this.running=true;this.pump();this.timer=setInterval(()=>this.pump(),35);
  }
  setAudible(on){this.audible=!!on;}
  pump(){
    if(!this.running)return;
    const {anchorMs,timeline}=this.session;
    const now=performance.now(),ahead=110;
    while(anchorMs+this.nextBeat*timeline.beatMs<=now+ahead){
      const beat=this.nextBeat++;
      const at=anchorMs+beat*timeline.beatMs;
      if(at<now-200)continue;
      if(this.audible)this.tick(Math.max(this.context.currentTime+.006,this.context.currentTime+(at-now)/1000),beat%4===0);
      const delay=Math.max(0,at-now);
      const timeout=setTimeout(()=>{if(this.running)this.onBeat(beat);},delay);
      this.scheduled.push(timeout);
      if(this.scheduled.length>32)this.scheduled.splice(0,16);
    }
  }
  tick(at,accent){
    const oscillator=this.context.createOscillator(),gain=this.context.createGain();
    oscillator.type='sine';oscillator.frequency.value=accent?1350:920;
    gain.gain.setValueAtTime(.0001,at);
    gain.gain.exponentialRampToValueAtTime(accent?.10:.062,at+.003);
    gain.gain.exponentialRampToValueAtTime(.0001,at+.035);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(at);oscillator.stop(at+.047);
  }
  stop(){
    this.running=false;
    if(this.timer!==null)clearInterval(this.timer);
    this.timer=null;this.scheduled.forEach(clearTimeout);this.scheduled=[];
    if(this.context){void this.context.close().catch(()=>{});this.context=null;}
  }
}
