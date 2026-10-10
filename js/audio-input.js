import {pitchYin,rmsOf} from './pitch.js?v=2.2';
import {spectralNotes,ChordFrameStabilizer} from './chord-audio.js?v=2.2';
import {frequencyToMidi,MIN_MIDI,MAX_MIDI} from './music.js?v=2.2';
import {applyCorrection,centsBetween,median} from './calibration.js?v=2.2';

// Audio-fix 1.2: analyse the ORIGINAL sample stream (no lossy 4x averaging),
// apply stable-frame median filtering, and expose raw + corrected pitches.
const AudioContextCtor = () => window.AudioContext || window.webkitAudioContext;
export const dbFromRms = rms => rms > 0 ? 20*Math.log10(rms) : -120;
export const levelPercent = rms => Math.max(0,Math.min(100,(dbFromRms(rms)+75)*100/60));
export function runPitchSelfTest() {
  const fs=48000, frequencies=[174.614116,220,261.625565,349.228231,523.251131,698.456463];
  const results=frequencies.map(hz=>{
    const samples=Float32Array.from({length:8192},(_,i)=>0.11*(Math.sin(2*Math.PI*hz*i/fs)+0.35*Math.sin(4*Math.PI*hz*i/fs)+.12*Math.sin(6*Math.PI*hz*i/fs)));
    const result=pitchYin(samples,fs,{minHz:145,maxHz:850,threshold:.20});
    return {hz:result?.frequency??null,clarity:result?.clarity??0,expected:hz,ok:!!result&&Math.abs(centsBetween(result.frequency,hz))<8};
  });
  return {passed:results.every(x=>x.ok),frequency:results[0].hz,midi:results[0].hz?frequencyToMidi(results[0].hz):null,clarity:results[0].clarity,results};
}
export class MicrophoneDetector {
  constructor(onFrame,onNote,onError){
    this.onFrame=onFrame;this.onNote=onNote;this.onError=onError;
    this.running=false;this.mic=null;this.context=null;this.analyser=null;
    this.source=null;this.silentSink=null;this.timer=null;
    this.threshold=.0025;this.deviceId='';this.correctionCents=0;
    this.lastCandidate=null;this.hits=0;this.latched=null;this.quietFrames=0;
    this.track=null;this.trackLabel='';this.lastError='';this.history=[];
    this.chordRecognition=false;this.onChord=()=>{};this.chordStability=new ChordFrameStabilizer(3);this.chordTick=0;
  }
  static async devices(){
    if(!navigator.mediaDevices?.enumerateDevices)return [];
    const all=await navigator.mediaDevices.enumerateDevices();
    return all.filter(d=>d.kind==='audioinput').map(d=>({deviceId:d.deviceId,label:d.label}));
  }
  setCorrection(cents){
    if(!Number.isFinite(cents)||Math.abs(cents)>125)throw new RangeError('Unsafe pitch correction');
    this.correctionCents=cents;
    this.history=[];this.lastCandidate=null;this.hits=0;this.latched=null;this.chordStability.reset();
  }
  async start(deviceId=''){
    if(this.running)return;
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('Microphone requires localhost/HTTPS and permission.');
    const AudioCtor=AudioContextCtor();
    if(!AudioCtor)throw new Error('The Web Audio API is not available.');
    this.deviceId=deviceId||'';
    const constraints={echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:{ideal:1}};
    if(this.deviceId)constraints.deviceId={exact:this.deviceId};
    let stream=null,context=null;
    try{
      // Create/resume an AudioContext during the actual user gesture on mobile.
      // Some Android browsers restrict audio that starts after the permission prompt.
      context=new AudioCtor();
      // Do not await this here: some mobile browsers defer resume until a later tap.
      void context.resume().catch(()=>{});
      try{stream=await navigator.mediaDevices.getUserMedia({audio:constraints,video:false});}
      catch(e){
        if(['OverconstrainedError','TypeError','NotSupportedError'].includes(e.name)){
          const fallback=this.deviceId?{deviceId:{ideal:this.deviceId}}:true;
          stream=await navigator.mediaDevices.getUserMedia({audio:fallback,video:false});
        } else throw e;
      }
      if(context.state!=='running')void context.resume().catch(()=>{});
      const analyser=context.createAnalyser();analyser.fftSize=8192;analyser.smoothingTimeConstant=0;
      const source=context.createMediaStreamSource(stream);
      const silentSink=context.createGain();silentSink.gain.value=0;
      source.connect(analyser);analyser.connect(silentSink);silentSink.connect(context.destination);
      this.context=context;this.mic=stream;this.track=stream.getAudioTracks()[0];
      this.trackLabel=this.track?.label||'Microphone';this.source=source;this.silentSink=silentSink;this.analyser=analyser;
      this.samples=new Float32Array(analyser.fftSize);
      this.history=[];this.lastCandidate=null;this.hits=0;this.latched=null;this.quietFrames=0;this.chordStability.reset();
      this.track.addEventListener('ended',()=>{this.onError(new Error('Microphone stopped or disconnected.'));void this.stop();},{once:true});
      this.running=true;this.tick();this.timer=setInterval(()=>this.tick(),100);
      if(context.state!=='running')this.onError(new Error('Audio context is not running ('+context.state+').'));
    }catch(error){
      stream?.getTracks().forEach(track=>track.stop());
      if(context){try{await context.close();}catch{}}
      this.context=null;this.mic=null;this.track=null;this.source=null;this.silentSink=null;this.analyser=null;
      throw error;
    }
  }
  async resumeAudio(){
    if(!this.context||!this.running)return false;
    await this.context.resume();
    return this.context.state==='running';
  }
  tick(){
    if(!this.running)return;
    // Android may suspend audio on tab/app switch; never score silent or stale buffers.
    if(this.context?.state!=='running'){
      this.latched=null;this.history=[];this.hits=0;
      this.onFrame({rms:0,peak:0,db:-120,midi:null,rawMidi:null,frequency:null,
        rawFrequency:null,clarity:0,reason:'audio-suspended',cents:NaN,
        correctionCents:this.correctionCents,threshold:this.threshold,
        contextState:this.context?.state||'closed',trackState:this.track?.readyState||'unknown',
        trackLabel:this.trackLabel,sampleRate:this.context?.sampleRate});
      return;
    }
    try {
      this.analyser.getFloatTimeDomainData(this.samples);
      const rms=rmsOf(this.samples);
      let peak=0;for(let i=0;i<this.samples.length;i++)peak=Math.max(peak,Math.abs(this.samples[i]));
      let reason='silence',rawFrequency=null,rawMidi=null,correctedFrequency=null,midi=null,clarity=0,cents=NaN;
      if(rms>=this.threshold){
        const pitch=pitchYin(this.samples,this.context.sampleRate,{minHz:145,maxHz:850,threshold:.20});
        if(pitch){
          rawFrequency=pitch.frequency;clarity=pitch.clarity;
          rawMidi=frequencyToMidi(rawFrequency);
          correctedFrequency=applyCorrection(rawFrequency,this.correctionCents);
          cents=centsBetween(correctedFrequency,440*2**((Math.round(69+12*Math.log2(correctedFrequency/440))-69)/12));
          const adjustedMidi=frequencyToMidi(correctedFrequency);
          if(clarity>=.76&&adjustedMidi>=MIN_MIDI&&adjustedMidi<=MAX_MIDI){
            this.history.push({rawFrequency,clarity});if(this.history.length>5)this.history.shift();
            // Suppress one-frame pitch errors. Keep history in Hz so calibration
            // sees the unmodified pitch even while a correction is active.
            const stable=median(this.history.map(v=>v.rawFrequency));
            const spread=median(this.history.map(v=>Math.abs(centsBetween(v.rawFrequency,stable))));
            if(this.history.length>=2 && spread<19){
              rawFrequency=stable;rawMidi=frequencyToMidi(stable);
              correctedFrequency=applyCorrection(stable,this.correctionCents);
              midi=frequencyToMidi(correctedFrequency);reason='valid';
              cents=centsBetween(correctedFrequency,440*2**((midi-69)/12));
            }else reason='stabilizing';
          }else{reason=adjustedMidi<MIN_MIDI||adjustedMidi>MAX_MIDI?'out-of-range':'uncertain';this.history=[];}
        }else{reason='unclear-pitch';this.history=[];}
      }else{this.history=[];}
      let chordCandidates=[];
      if(this.chordRecognition&&++this.chordTick%2===0&&rms>=this.threshold){
        chordCandidates=spectralNotes(this.samples,this.context.sampleRate,{correctionCents:-this.correctionCents});
        const stable=this.chordStability.accept(chordCandidates);
        if(stable?.length>=2)this.onChord(stable);
      }
      if(rms<this.threshold)this.chordStability.accept([]);
      this.onFrame({rms,peak,db:dbFromRms(rms),chordCandidates,midi,rawMidi,frequency:correctedFrequency,
        rawFrequency,clarity,reason,cents,correctionCents:this.correctionCents,
        threshold:this.threshold,contextState:this.context?.state||'closed',trackState:this.track?.readyState||'unknown',
        trackLabel:this.trackLabel,sampleRate:this.context?.sampleRate});
      if(midi===null){this.lastCandidate=null;this.hits=0;this.quietFrames++;
        if(this.quietFrames>=3)this.latched=null;return;}
      this.quietFrames=0;
      if(this.lastCandidate===midi)this.hits++;else{this.lastCandidate=midi;this.hits=1;}
      if(this.hits>=2 && this.latched!==midi){this.latched=midi;this.onNote({midi,frequency:correctedFrequency,rawFrequency,clarity});}
    }catch(error){this.lastError=error.message;this.onError(error);void this.stop();}
  }
  async stop(){
    this.running=false;clearInterval(this.timer);this.timer=null;
    for(const node of [this.source,this.analyser,this.silentSink])if(node){try{node.disconnect();}catch{}}
    this.mic?.getTracks().forEach(t=>t.stop());this.mic=null;
    if(this.context){try{await this.context.close();}catch{}}
    this.context=null;this.track=null;this.analyser=null;this.source=null;this.silentSink=null;
    this.lastCandidate=null;this.hits=0;this.latched=null;this.history=[];
  }
}
