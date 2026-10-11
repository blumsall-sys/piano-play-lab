import {buildMelodyTimeline} from './melody.js?v=2.2';
import {midiToFrequency} from './music.js?v=2.2';
let ctx;
// Separate, persistent mix levels: MIDI instrument and correct-note feedback.
// These are linear gain ratios, not percentages of system/master volume.
export const DEFAULT_MIDI_VOLUME=0.9;
export const DEFAULT_CHIME_VOLUME=0.25;
let midiVolume=DEFAULT_MIDI_VOLUME;
let chimeVolume=DEFAULT_CHIME_VOLUME;
let midiBus=null,feedbackBus=null;
export const clampVolume=value=>Math.max(0,Math.min(1,Number.isFinite(Number(value))?Number(value):0));
export function getAudioMix(){return {midi:midiVolume,chime:chimeVolume};}
export function setMidiVolume(value){midiVolume=clampVolume(value);if(midiBus&&ctx)midiBus.gain.setTargetAtTime(midiVolume,ctx.currentTime,.012);return midiVolume;}
export function setChimeVolume(value){chimeVolume=clampVolume(value);if(feedbackBus&&ctx)feedbackBus.gain.setTargetAtTime(chimeVolume,ctx.currentTime,.012);return chimeVolume;}
async function ensureContext(){
  ctx ??= new (window.AudioContext||window.webkitAudioContext)();
  if(!midiBus){midiBus=ctx.createGain();midiBus.gain.value=midiVolume;midiBus.connect(ctx.destination);}
  if(!feedbackBus){feedbackBus=ctx.createGain();feedbackBus.gain.value=chimeVolume;feedbackBus.connect(ctx.destination);}
  if(ctx.state==='suspended') await ctx.resume();
  return ctx;
}
function playTone(freq,{type='sine',when=0,duration=.3,volume=.12,attack=.01,release=.18,detune=0,destination=null}={}){
  const osc=ctx.createOscillator();
  const gain=ctx.createGain();
  osc.type=type;
  osc.frequency.value=freq;
  osc.detune.value=detune;
  gain.gain.setValueAtTime(0.0001,when);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001,volume),when+attack);
  gain.gain.exponentialRampToValueAtTime(0.0001,when+duration+release);
  osc.connect(gain).connect(destination||ctx.destination);
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
    playTone(midiToFrequency(84+step),{when:when+i*.05,duration:.18,volume:.08,type:'triangle',attack:.008,release:.22,destination:feedbackBus});
    playTone(midiToFrequency(96+step),{when:when+i*.05,duration:.12,volume:.028,type:'sine',attack:.006,release:.18,destination:feedbackBus});
  });
}
export async function soundCelebration(){
  await ensureContext();
  const when=ctx.currentTime;
  [72,76,79,84].forEach((midi,i)=>{
    playTone(midiToFrequency(midi),{when:when+i*.11,duration:.26,volume:.1,type:'triangle',attack:.008,release:.28,destination:feedbackBus});
    playTone(midiToFrequency(midi+12),{when:when+i*.11,duration:.16,volume:.03,type:'sine',attack:.008,release:.22,destination:feedbackBus});
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
    const duration=Math.max(.10,event.duration*.86);
    for(const note of event.notes){
      const fundamental=midiToFrequency(note);
      [1,2,3].forEach((harmonic,i)=>{
        oscillators.push(playTone(fundamental*harmonic,{
          when:zero+event.start,duration,volume:[.09,.018,.006][i]/Math.sqrt(event.notes.length),attack:.012,release:.06
        }));
      });
    }
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

// Built-in mini-piano synthesizer for soundless USB MIDI controllers.
export async function prepareMidiAudio(){await ensureContext();}
const midiVoices=new Map();
export async function midiSoundOn(note,velocity=96){
  await ensureContext();
  midiSoundOff(note);
  const now=ctx.currentTime;
  const voices=[];
  const loud=Math.max(.005,Math.min(.13,(velocity/127)*.13));
  for(const [harmonic,amount] of [[1,1],[2,.18],[3,.045]]){
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type='sine';osc.frequency.value=midiToFrequency(note)*harmonic;
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001,loud*amount),now+.012);
    gain.gain.setTargetAtTime(Math.max(.0001,loud*amount*.42),now+.14,.22);
    osc.connect(gain).connect(midiBus);osc.start(now);
    voices.push({osc,gain});
  }
  midiVoices.set(note,voices);
}
export function midiSoundOff(note){
  const voices=midiVoices.get(note);
  if(!voices||!ctx)return;
  midiVoices.delete(note);
  const now=ctx.currentTime;
  for(const {osc,gain} of voices){
    try{gain.gain.cancelScheduledValues(now);gain.gain.setTargetAtTime(.0001,now,.045);osc.stop(now+.24);}catch{}
  }
}
export function midiSoundAllOff(){for(const note of [...midiVoices.keys()])midiSoundOff(note);}

// Short, gentle optional tick for the four-beat practice break in untimed Learn Mode.
// Not routed through the note/chime gain, so the chime-volume slider stays independent.
export async function soundRestTick(accent=false){
  await ensureContext();
  const at=ctx.currentTime;
  playTone(accent?1120:850,{when:at,duration:.025,release:.018,attack:.003,volume:.025,type:'sine'});
}
