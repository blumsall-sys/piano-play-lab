import {buildMelodyTimeline} from './melody.js?v=1.8';
import {midiToFrequency} from './music.js?v=1.8';
let ctx;
async function ensureContext(){
  ctx ??= new (window.AudioContext||window.webkitAudioContext)();
  if(ctx.state==='suspended') await ctx.resume();
  return ctx;
}
function playTone(freq,{type='sine',when=0,duration=.3,volume=.12,attack=.01,release=.18,detune=0}={}){
  const osc=ctx.createOscillator();
  const gain=ctx.createGain();
  osc.type=type;
  osc.frequency.value=freq;
  osc.detune.value=detune;
  gain.gain.setValueAtTime(0.0001,when);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001,volume),when+attack);
  gain.gain.exponentialRampToValueAtTime(0.0001,when+duration+release);
  osc.connect(gain).connect(ctx.destination);
  osc.start(when);
  osc.stop(when+duration+release+.02);
  return {osc,gain};
}
export async function soundNote(midi,{duration=0.62,volume=0.11}={}){
  await ensureContext();
  const when=ctx.currentTime;
  const fundamental=midiToFrequency(midi);
  [1,2,3].forEach((ratio,i)=>{
    playTone(fundamental*ratio,{when,duration,volume:volume*[1,0.17,0.06][i],type:'sine',attack:.025,release:.04});
  });
}
export async function soundChime(){
  await ensureContext();
  const when=ctx.currentTime;
  [0,4,7].forEach((step,i)=>{
    playTone(midiToFrequency(84+step),{when:when+i*.05,duration:.18,volume:.08,type:'triangle',attack:.008,release:.22});
    playTone(midiToFrequency(96+step),{when:when+i*.05,duration:.12,volume:.028,type:'sine',attack:.006,release:.18});
  });
}
export async function soundCelebration(){
  await ensureContext();
  const when=ctx.currentTime;
  [72,76,79,84].forEach((midi,i)=>{
    playTone(midiToFrequency(midi),{when:when+i*.11,duration:.26,volume:.1,type:'triangle',attack:.008,release:.28});
    playTone(midiToFrequency(midi+12),{when:when+i*.11,duration:.16,volume:.03,type:'sine',attack:.008,release:.22});
  });
}

// Schedule all notes on Web Audio's clock for consistent rhythm even if the
// Android browser's UI thread has brief delays. Playback is not score input.
export async function soundMelody(notes, melodyBeats, bpm, {onNote=()=>{}, onEnd=()=>{}}={}) {
  await ensureContext();
  const timeline=buildMelodyTimeline(notes,melodyBeats,bpm);
  const zero=ctx.currentTime;
  const oscillators=[];
  const timers=[];
  let stopped=false;
  for(const event of timeline.events){
    const fundamental=midiToFrequency(event.midi);
    const duration=Math.max(.10,event.duration*.86);
    [1,2,3].forEach((harmonic,i)=>{
      oscillators.push(playTone(fundamental*harmonic,{
        when:zero+event.start,
        duration,
        volume:[.09,.018,.006][i],
        attack:.012,
        release:.06
      }));
    });
    timers.push(setTimeout(()=>{if(!stopped)onNote(event.midi);},Math.round(event.start*1000)));
  }
  const cleanup=()=>{for(const timer of timers)clearTimeout(timer);};
  const finishTimer=setTimeout(()=>{
    if(stopped)return;
    stopped=true;
    cleanup();
    onEnd();
  },Math.round((timeline.totalSeconds+.26)*1000));
  return {
    get isPlaying(){return !stopped;},
    cancel(){
      if(stopped)return;
      stopped=true;
      cleanup();
      clearTimeout(finishTimer);
      const now=ctx.currentTime;
      for(const {osc,gain} of oscillators){
        // Mute scheduled sound immediately, including notes not played yet.
        try{
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(.0001,now);
          osc.stop(now+.03);
        }catch{/* Oscillator already finished */}
      }
    }
  };
}
