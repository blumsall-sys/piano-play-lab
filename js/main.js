import {GameUI,restoreActive} from './game-ui.js?v=2.4';
import {Keyboard} from './keyboard.js?v=2.4';
import {profileFor,validateFirstC,MAUDIO,HAPE,midiMessage} from './keyboard-profiles.js?v=2.4';
import {MicrophoneDetector,levelPercent,runPitchSelfTest} from './audio-input.js?v=2.4';
import {LessonEngine,eventNotes} from './lesson.js?v=2.4';
import {MIN_MIDI,MAX_MIDI,midiToName,midiToFrequency} from './music.js?v=2.4';
import {soundNote,soundChime,soundCelebration,soundMelody,midiSoundOn,midiSoundOff,midiSoundAllOff,prepareMidiAudio} from './sound.js?v=2.4';
import {evaluateReference,compareReferences,centsBetween} from './calibration.js?v=2.4';
import {VoiceGuide} from './voice-guide.js?v=2.4';
import {spectralNotes} from './chord-audio.js?v=2.4';
import {RhythmSession,eventTimeline,lessonBeats} from './rhythm.js?v=2.4';
import {Metronome} from './metronome.js?v=2.4';
import {buildScoreStrip} from './score-strip.js?v=2.4';
import {loadHistory,saveSession,exportHistory,updateSessionRhythm} from './progress-store.js?v=2.4';

const $=id=>document.getElementById(id);
const elements={
  lesson:$('lesson-select'),title:$('lesson-title'),description:$('lesson-description'),target:$('target-note'),hint:$('target-hint'),
  heard:$('heard-note'),heardDetails:$('heard-details'),progress:$('progress-count'),stars:$('stars-text'),fill:$('progress-fill'),bar:$('progress-track'),feedback:$('feedback'),
  micBtn:$('mic-button'),settingsMicBtn:$('settings-mic-button'),settingsMicText:$('settings-mic-button-text'),settingsMicState:$('settings-mic-state'),settingsMicFeedback:$('settings-mic-feedback'),settingsResumeAudio:$('settings-resume-audio'),resumeAudio:$('resume-audio-button'),micText:$('mic-button-text'),micLed:$('mic-led'),micStatus:$('mic-status-text'),soundFill:$('sound-fill'),confidence:$('confidence-text'),
  micDevice:$('mic-device'),micRefresh:$('mic-refresh'),micSensitivity:$('mic-sensitivity'),micSelfTest:$('mic-self-test'),
  micLevel:$('mic-level-text'),micMeter:$('mic-meter'),micDebug:$('mic-debug-text'),
  rawReadout:$('mic-raw-text'),captureF3:$('capture-f3'),captureC4:$('capture-c4'),applyCal:$('apply-calibration'),resetCal:$('reset-calibration'),
  calibrationMessage:$('calibration-message'),f3Reference:$('f3-reference'),c4Reference:$('c4-reference'),correctionReadout:$('current-correction'),
  demo:$('demo-button'),reset:$('reset-button'),labels:$('label-mode'),camBtn:$('camera-button'),video:$('camera-video'),camPlaceholder:$('camera-placeholder'),flip:$('flip-camera'),
  results:$('results-screen'),resultAccuracy:$('result-accuracy'),resultAttempts:$('result-attempts'),resultIdeal:$('result-ideal'),resultWrong:$('result-wrong'),
  resultRestart:$('result-restart'),resultNext:$('result-next'),resultScoreCaption:$('result-score-caption'),
  voiceRead:$('voice-read'),voiceStop:$('voice-stop'),voiceStatus:$('voice-status'),voiceScript:$('voice-script'),voiceChoice:$('voice-choice'),voiceRate:$('voice-rate'),
  melodyButton:$('melody-button'),melodyStop:$('melody-stop'),melodyMessage:$('melody-message'),releaseStatus:$('release-status'),
  chordMode:$('chord-mode'),chordHelp:$('chord-help'),chordProgress:$('chord-progress'),midiButton:$('midi-button'),midiStatus:$('midi-status'),chordTest:$('chord-self-test'),
  rhythmGrade:$('rhythm-grade'),metronomeAudible:$('metronome-audible'),rhythmBpm:$('rhythm-bpm'),rhythmSpeed:$('rhythm-speed'),micTimingOffset:$('mic-timing-offset'),
  rhythmStart:$('rhythm-start'),rhythmStop:$('rhythm-stop'),rhythmBeat:$('rhythm-beat'),rhythmTempo:$('rhythm-tempo'),rhythmFeedback:$('rhythm-feedback'),scoreStrip:$('score-strip'),
  resultTiming:$('result-timing'),resultHolds:$('result-holds'),historyList:$('history-list'),historyExport:$('history-export')
};
let gameUI=null;
let engine;
let microphone;
let keyboard;
let voice;
let cameraStream=null;
let midiAccess=null;let midiHeld=new Set();let midiHandlers=new Map();let lastMidiAt=0;let midiOnsets=new Map();let midiChordHolds=new Map();
const INSTRUMENT_STORAGE_KEY='cleos-piano-instrument-v2.4';
let selectedLayout=HAPE,midiFirstC=48, selectedMidiDevice='', midiAudioEnabled=true,midiLearningC=false;
let instrumentControls=null;
try{
  const data=JSON.parse(localStorage.getItem(INSTRUMENT_STORAGE_KEY)||'null');
  if(data?.layout===MAUDIO)selectedLayout=MAUDIO;
  if(validateFirstC(data?.firstC))midiFirstC=data.firstC;
  if(typeof data?.device==='string')selectedMidiDevice=data.device;
  if(typeof data?.audio==='boolean')midiAudioEnabled=data.audio;
}catch{}
function saveInstrument(){try{localStorage.setItem(INSTRUMENT_STORAGE_KEY,JSON.stringify({layout:selectedLayout,firstC:midiFirstC,device:selectedMidiDevice,audio:midiAudioEnabled}));}catch{}}
function displayProfile(){return profileFor(selectedLayout,midiFirstC);}
function setMidiActivity(text){if(instrumentControls)instrumentControls.status.textContent=text;}
function setInstrumentLayout(layout,{save=true}={}){
  selectedLayout=layout===MAUDIO?MAUDIO:HAPE;
  midiLearningC=false;
  if(microphone?.running&&selectedLayout===MAUDIO){void microphone.stop().then(updateMicButton).catch(console.warn);}
  midiHeld.clear();midiOnsets.clear();midiChordHolds.clear();midiSoundAllOff();
  const profile=displayProfile();
  keyboard?.setProfile(profile);
  if(engine){keyboard.setTarget(engine.state().done?null:engine.target);keyboard.setCollected(engine.state().collected);}
  $('piano-title').textContent=selectedLayout===MAUDIO?'Your M-Audio MIDI keyboard':'Your interactive Hape toy piano';
  const footer=document.querySelector('.keyboard-footer');
  if(footer){footer.children[0].textContent=`← ${midiToName(profile.first)}`;footer.children[1].textContent=`${profile.count} keys · ${selectedLayout===MAUDIO?'USB MIDI controller':'Hape toy piano'}`;footer.children[2].textContent=`${midiToName(profile.last)} →`;}
  keyboard?.svg.closest('.piano-panel')?.setAttribute('data-layout',selectedLayout);
  if(instrumentControls){instrumentControls.layout.value=selectedLayout;instrumentControls.options.hidden=selectedLayout!==MAUDIO;instrumentControls.firstC.value=String(midiFirstC);instrumentControls.audio.checked=midiAudioEnabled;}
  const labelsOption=elements.labels?.querySelector('option[value="f"]');
  if(labelsOption)labelsOption.textContent=profile.anchor==='C'?'C anchors':'F anchors';
  const activity=$('piano-input-status');
  if(activity){activity.textContent=selectedLayout===MAUDIO?(midiAccess?.inputs?.size?'USB MIDI connected · play your keyboard':'MIDI mode · connect in Settings'):(microphone?.running?'Microphone listening':'Microphone is OFF · tap Start listening');}
  if(engine&&selectedLayout===MAUDIO){
    const missing=engine.lesson.notes.flatMap(eventNotes).filter(n=>n<profile.first||n>profile.last);
    if(missing.length)setMidiActivity(`Octave warning: ${[...new Set(missing)].map(noteText).join(', ')} cannot be played at ${midiToName(profile.first)}–${midiToName(profile.last)}. Use the hardware octave buttons until they fit, then Identify leftmost C.`);
  }
  updateMicButton();
  if(save)saveInstrument();
}
function setupInstrumentUI(){
  instrumentControls={
    layout:$('instrument-layout'),options:$('midi-setup-options'),firstC:$('midi-first-c'),learn:$('midi-learn-first-c'),
    device:$('midi-input-device'),audio:$('midi-enable-sound'),status:$('midi-live-status')
  };
  instrumentControls.layout.addEventListener('change',()=>{
    setInstrumentLayout(instrumentControls.layout.value);
    if(selectedLayout===MAUDIO){setMidiActivity('M-Audio mode selected. Connect your USB MIDI keyboard below, then press its leftmost C.');}
  });
  instrumentControls.firstC.addEventListener('change',()=>{
    midiFirstC=Number(instrumentControls.firstC.value);midiLearningC=false;
    setInstrumentLayout(selectedLayout);
    setMidiActivity(`Display mapped to ${midiToName(midiFirstC)}–${midiToName(midiFirstC+31)}. Match the device’s octave setting.`);
  });
  instrumentControls.learn.addEventListener('click',()=>{
    if(!midiAccess){setMidiActivity('Connect USB MIDI first, then press Identify leftmost C.');return;}
    midiLearningC=true;
    setMidiActivity('Ready: press the LEFTMOST white C key on the physical M-Audio once.');
  });
  instrumentControls.device.addEventListener('change',()=>{
    selectedMidiDevice=instrumentControls.device.value;saveInstrument();midiSoundAllOff();
    setMidiActivity('Selected MIDI input updated. Play one key to confirm.');
  });
  instrumentControls.audio.addEventListener('change',()=>{midiAudioEnabled=instrumentControls.audio.checked;saveInstrument();if(!midiAudioEnabled)midiSoundAllOff();});
  setInstrumentLayout(selectedLayout,{save:false});
  if(!navigator.requestMIDIAccess&&selectedLayout===MAUDIO)setMidiActivity('Web MIDI is unavailable in this browser. Try Chrome on Windows, using HTTPS or localhost.');
}

let suppressUntil=0;
let lastWrongAt=0;
let micStartTime=0;
let maxInputLevel=0;
let micWarned=false;
let celebrationPlayed=false;
let previewActive=false;
let previewHandle=null;
let previewEpoch=0;
let chordModeCache='';
let rhythmSession=null;
let metronome=null;
let completedSaved=false;
let attemptLog=[];
let currentSessionId='';
let lastOnsetResult=null;
const speedForLesson=new Map();
try{
  const prior=JSON.parse(localStorage.getItem('pianoplay-tempos-v2.1')||'{}');
  for(const [id,setting] of Object.entries(prior))if(Number.isFinite(setting.bpm)&&Number.isFinite(setting.speed))speedForLesson.set(id,setting);
}catch{/* Private mode may disable storage. */}

const references={53:null,60:null};
let pendingCalibration=null;
let calibrationResult=null;
let captureTimer=null;
const CAL_STORAGE_KEY='cleos-piano-calibration-v2.3';
const SENSITIVITY_STORAGE_KEY='cleos-piano-mic-sensitivity-v2.3';
let storedCorrection=0;
try{const data=JSON.parse(localStorage.getItem(CAL_STORAGE_KEY)||'null');if(data&&Number.isFinite(data.cents)&&Math.abs(data.cents)<=125)storedCorrection=data.cents;}catch{}
function settingsFeedback(message,kind=''){
  elements.settingsMicFeedback.textContent=message;
  elements.settingsMicFeedback.className='settings-mic-feedback'+(kind?' '+kind:'');
}
function isSettings(){return gameUI?.view==='settings';}
function scoringAllowed(){return !gameUI || gameUI.view==='play';}
function cancelCapture(message='Calibration cancelled. You can start again whenever you are ready.'){
  if(!pendingCalibration)return;
  pendingCalibration=null;clearTimeout(captureTimer);captureTimer=null;
  calMessage(message,'warning');updateCalibrationUI();
}


function selectedBpm(){return Math.min(220,Math.max(30,Number(elements.rhythmBpm.value)||80));}
function selectedMultiplier(){return Number(elements.rhythmSpeed.value)||1;}
function updateTempoHUD(){
  elements.rhythmTempo.textContent=`${Math.round(selectedBpm()*selectedMultiplier()*10)/10} BPM (${selectedBpm()} × ${selectedMultiplier()})`;
}
function stopRhythm({message=true}={}){
  metronome?.stop();metronome=null;rhythmSession=null;
  elements.rhythmStart.disabled=false;elements.rhythmStop.disabled=true;
  elements.rhythmBeat.textContent='Beat stopped';
  elements.scoreStrip?.querySelectorAll('.beat-now').forEach(n=>n.classList.remove('beat-now'));
  if(message)elements.rhythmFeedback.textContent='Timing paused. Start a fresh count-in when ready.';
}
function onMetronomeBeat(beat){
  elements.rhythmBeat.textContent=beat<0?`Count-in: ${-beat}`:`Beat ${beat+1} · ${beat%4+1}/4`;
  if(!rhythmSession||beat<0)return;
  const events=rhythmSession.timeline.events;
  let active=0;
  for(const event of events){if(event.startBeat<=beat)active=event.index;else break;}
  elements.scoreStrip.querySelectorAll('.score-event').forEach(n=>n.classList.toggle('beat-now',Number(n.dataset.index)===active));
}
async function startRhythm(){
  if(!engine||engine.state().done)return;
  if(voice?.isSpeaking)stopVoice();
  stopMelodyPreview({quiet:true});
  stopRhythm({message:false});
  const bpm=selectedBpm(),speed=selectedMultiplier();
  elements.rhythmBpm.value=String(bpm);
  updateTempoHUD();
  const instance=new RhythmSession(engine.lesson,bpm,speed,4);
  const tick=new Metronome(onMetronomeBeat);
  try{
    await tick.start(instance,{audible:elements.metronomeAudible.checked});
    rhythmSession=instance;metronome=tick;
    elements.rhythmStart.disabled=true;elements.rhythmStop.disabled=false;
    elements.rhythmFeedback.textContent=elements.rhythmGrade.checked?'Listen for four beats, then play in time!':'Metronome-only practice. Timing grades are off.';
    status('Four-beat count-in started. Listen, then play the score from left to right.');
  }catch(error){tick.stop();stopRhythm({message:false});status(`Could not start beat: ${error.message}`,'try-again');}
}
function changeRhythmSettings(){
  speedForLesson.set(engine?.lesson?.id||'',{bpm:selectedBpm(),speed:selectedMultiplier()});
  try{localStorage.setItem('pianoplay-tempos-v2.1',JSON.stringify(Object.fromEntries(speedForLesson)));}catch{}
  updateTempoHUD();
  if(rhythmSession){stopRhythm();status('Tempo changed. Tap Start with 4-beat count-in to restart the timeline.');}
}
function syncRhythmLesson(){
  stopRhythm({message:false});
  const settings=speedForLesson.get(engine.lesson.id);
  elements.rhythmBpm.value=String(settings?.bpm??engine.lesson.bpm??80);
  elements.rhythmSpeed.value=String(settings?.speed??1);
  updateTempoHUD();
  elements.rhythmFeedback.textContent='Preview the upcoming notes, then start the beat when ready.';
  refreshScore();
}
function refreshScore(){
  if(!engine)return;
  buildScoreStrip(elements.scoreStrip,engine.lesson,engine.position,rhythmSession?.report().events||[]);
}
function recordAttempt(midi,source,index,correct,onsetMs,grade=null){
  attemptLog.push({index,midi,source,correct,timeMs:Math.round(onsetMs),beatGrade:grade?.label||null,offsetMs:grade?.deltaMs??null});
}
function timingForStep(index,onsetMs,source){
  if(!rhythmSession||!elements.rhythmGrade.checked)return null;
  // A built microphone chord has no meaningful simultaneous onset. Don't invent a rhythm score.
  if(source==='mic-build'||source==='screen-build')return null;
  const grade=rhythmSession.observe(index,onsetMs,source);
  if(grade){
    lastOnsetResult=grade;
    const signed=grade.deltaMs>0?'+':'';
    elements.rhythmFeedback.textContent=`${grade.label==='on-time'?'✓ On time!':grade.label==='early'?'◀ A little early':'▶ A little late'} · ${signed}${grade.deltaMs} ms`;
  }
  return grade;
}
function recordHoldForStep(index,holdMs,source){
  if(!rhythmSession||!elements.rhythmGrade.checked)return;
  const info=rhythmSession.recordHold(index,holdMs,source);
  if(info){
    elements.rhythmFeedback.textContent+=` · ${info.label==='good'?'Good hold':info.label==='short'?'Short press':'Long hold'} (${info.durationMs} ms)`;
    if(completedSaved&&currentSessionId){
      const report=rhythmSession.report();
      updateSessionRhythm(currentSessionId,report);buildHistoryUI();
      elements.resultHolds.textContent=report.holdsMeasured?`${report.holdsGood} / ${report.holdsMeasured}`:'Not measured';
    }
  }
}
function buildHistoryUI(){
  const history=loadHistory();
  elements.historyList.replaceChildren();
  if(!history.length){elements.historyList.textContent='No completed lessons recorded on this device yet.';return;}
  for(const h of history.slice(0,8)){
    const item=document.createElement('div');item.className='history-item';
    const heading=document.createElement('strong');heading.textContent=h.title;
    const details=document.createElement('small');
    const rhythm=h.rhythm?.assessed?` · On beat ${h.rhythm.onTime}/${h.rhythm.assessed}`:'';
    details.textContent=`${new Date(h.finishedAt).toLocaleString()} · Keys ${Math.round(h.keyAccuracy)}% · ${h.correct}/${h.attempts} presses${rhythm}`;
    item.append(heading,details);elements.historyList.append(item);
  }
}
function saveCompleted(){
  if(completedSaved)return;
  completedSaved=true;
  const {summary,lesson}=engine.state();
  const report=rhythmSession?.report()??null;
  const record={id:crypto?.randomUUID?.()??`${Date.now()}-${Math.random()}`,lessonId:lesson.id,title:lesson.title,
    finishedAt:new Date().toISOString(),keyAccuracy:summary.accuracy,correct:summary.correctPresses,attempts:summary.attempts,
    expected:summary.expectedPresses,wrong:summary.wrongPresses,
    rhythm:elements.rhythmGrade.checked?report:null,tempo:rhythmSession?.timeline.effectiveBpm??null,attemptLog};
  currentSessionId=record.id;
  saveSession(record);buildHistoryUI();
}
function resetPerformance(){
  stopRhythm({message:false});midiChordHolds.clear();completedSaved=false;attemptLog=[];lastOnsetResult=null;currentSessionId='';
  elements.rhythmFeedback.textContent='Timing not started.';
}
function exportPracticeHistory(){
  const blob=new Blob([exportHistory()],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download='pianoplay-practice-history.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function clearMicLatch(){
  if(!microphone)return;
  microphone.latched=null;
  microphone.lastCandidate=null;
  microphone.hits=0;
  microphone.quietFrames=0;
  microphone.history=[];
}
function voiceState({type,message}){
  elements.voiceStatus.textContent=message;
  elements.voiceStatus.dataset.state=type;
  const speaking=type==='speaking';
  elements.voiceStop.disabled=!speaking;
  elements.voiceRead.textContent=speaking?'↻ Replay instructions':'▶ Read instructions';
}
function refreshVoiceChoices(){
  if(!voice?.supported)return;
  const selected=elements.voiceChoice.value;
  const voices=voice.refreshVoices();
  elements.voiceChoice.replaceChildren(new Option('Automatic English voice',''));
  for(const v of voices){
    elements.voiceChoice.add(new Option(`${v.name} (${v.lang})`,v.voiceURI));
  }
  if(voices.some(v=>v.voiceURI===selected))elements.voiceChoice.value=selected;
  else if(voices.some(v=>v.voiceURI===voice.preferredURI))elements.voiceChoice.value=voice.preferredURI;
  else elements.voiceChoice.value='';
}
function readInstructions(){
  if(!engine||!voice)return;
  if(rhythmSession)stopRhythm({message:true});
  stopMelodyPreview();
  if(pendingCalibration){
    status('Finish the piano reference capture before playing voice instructions.','try-again');
    return;
  }
  voice.speak(engine.lesson.spokenInstructions || `${engine.lesson.title}. ${engine.lesson.description} ${engine.lesson.hint}`);
}
function stopVoice(){voice?.stop();}
function syncVoiceLesson(){
  stopMelodyPreview();
  stopVoice();
  if(engine) elements.voiceScript.textContent=engine.lesson.spokenInstructions || engine.lesson.description;
}

function noteText(midi){return midiToName(midi).replace('#','♯');}
function noteList(event){return event===null?'—':eventNotes(event).map(noteText).join(' + ');}
function chordLesson(){return !!engine && Array.isArray(engine.target);}
function setChordMode(){if(!microphone)return;const mode=elements.chordMode.value+':'+(chordLesson()?'chord':'note');microphone.chordRecognition=elements.chordMode.value==='together'&&chordLesson();if(mode!==chordModeCache){chordModeCache=mode;microphone.chordStability.reset();clearMicLatch();}}
function status(text,type=''){
  elements.feedback.textContent=text;
  elements.feedback.className='feedback'+(type?' '+type:'');
  if(isSettings())settingsFeedback(text,type==='try-again'?'warning':type);
}
function calMessage(message,cls=''){
  elements.calibrationMessage.textContent=message;
  elements.calibrationMessage.className='calibration-message'+(cls?' '+cls:'');
}
function updateCalibrationUI(){
  elements.f3Reference.textContent='F3: '+(references[53]?.ok ? `${references[53].measured.toFixed(1)} Hz (${references[53].cents>=0?'+':''}${references[53].cents.toFixed(0)} cents)`:'not captured');
  elements.c4Reference.textContent='C4: '+(references[60]?.ok ? `${references[60].measured.toFixed(1)} Hz (${references[60].cents>=0?'+':''}${references[60].cents.toFixed(0)} cents)`:'not captured');
  elements.correctionReadout.textContent=`Correction: ${Math.abs(microphone?.correctionCents||0)<.05?'OFF':`${microphone.correctionCents>0?'-':'+'}${Math.abs(microphone.correctionCents).toFixed(1)} cents applied`}`;
  elements.captureF3.disabled=!!pendingCalibration;
  elements.captureC4.disabled=!!pendingCalibration||!references[53]?.ok;
  elements.applyCal.disabled=!!pendingCalibration||!calibrationResult?.ok;
}
function finishReferenceCapture(){
  if(!pendingCalibration)return;
  const {midi,samples}=pendingCalibration;
  pendingCalibration=null;
  clearTimeout(captureTimer);captureTimer=null;
  suppressUntil=Date.now()+1500;
  const result=evaluateReference(midi,samples);
  if(isSettings())settingsFeedback(result.ok?`${midiToName(midi)} captured successfully.`:result.message,result.ok?'success':'warning');
  if(!result.ok){calMessage(result.message,'warning');updateCalibrationUI();return;}
  references[midi]=result;
  if(midi===53){
    references[60]=null;calibrationResult=null;
    calMessage(`F3 captured at ${result.measured.toFixed(1)} Hz. Next, press Capture C4 and hold the C4 key (the fifth white key).`,'success');
  }else{
    calibrationResult=compareReferences(references[53],references[60]);
    calMessage(calibrationResult.message,calibrationResult.ok?(calibrationResult.large?'warning':'success'):'warning');
  }
  updateCalibrationUI();
}
function startReferenceCapture(midi){
  if(voice?.isSpeaking){calMessage('Stop voice narration before capturing a piano reference note.','warning');return;}
  if(!microphone?.running){calMessage('Start listening using the green button in Microphone setup above, then try again.','warning');settingsFeedback('Microphone is off. Tap Start listening above.','warning');return;}
  if(pendingCalibration)return;
  suppressUntil=Date.now()+5000;
  if(midi===53){references[53]=null;references[60]=null;calibrationResult=null;}
  if(midi===60&&!references[53]?.ok){calMessage('Capture F3 before C4.','warning');return;}
  // Reference capture must always be monophonic even if a chord lesson was previously selected.
  microphone.chordRecognition=false;microphone.chordStability.reset();
  microphone.history=[];microphone.lastCandidate=null;microphone.hits=0;microphone.latched=null;
  pendingCalibration={midi,samples:[]};
  calMessage(`Listening for ${midiToName(midi)}… press and hold ONLY that key for about 2 seconds. Keep other sounds quiet.`);
  settingsFeedback(`Capturing ${midiToName(midi)} · play and hold the reference key now.`);
  updateCalibrationUI();
  clearTimeout(captureTimer);
  captureTimer=setTimeout(()=>{if(pendingCalibration?.midi===midi)finishReferenceCapture();},3800);
}
function applyReferenceCorrection(){
  if(!calibrationResult?.ok)return;
  microphone.setCorrection(calibrationResult.correction);
  storedCorrection=calibrationResult.correction;
  try{localStorage.setItem(CAL_STORAGE_KEY,JSON.stringify({cents:storedCorrection,updatedAt:new Date().toISOString()}));}catch{}
  settingsFeedback(`Correction saved: ${storedCorrection>=0?'+':''}${storedCorrection.toFixed(1)} cents. It will apply during lessons.`,'success');
  const applied=Math.abs(calibrationResult.correction).toFixed(1);
  calMessage(`Applied measured software offset (${applied} cents). Check F3 and C4 again by ear. This does not tune the physical piano.${calibrationResult.large?' WARNING: A full-semitone offset often means the keyboard is transposed. Reset its transpose setting if possible.':''}`,'success');
  updateCalibrationUI();
}
function resetReferenceCorrection(){
  microphone.setCorrection(0);storedCorrection=0;try{localStorage.removeItem(CAL_STORAGE_KEY);}catch{}
  settingsFeedback('Reference correction cleared and saved.','success');pendingCalibration=null;clearTimeout(captureTimer);captureTimer=null;
  references[53]=null;references[60]=null;calibrationResult=null;
  calMessage('Correction cleared. The detector is using standard A4 = 440 Hz.');
  updateCalibrationUI();
}
function hideResults(){elements.results.hidden=true;}
function showResults(){
  const {summary,nextLessonId}=engine.state();
  const accuracy=Math.round(summary.accuracy*10)/10;
  elements.resultAccuracy.textContent=`${accuracy}%`;
  elements.resultAttempts.textContent=String(summary.attempts);
  elements.resultIdeal.textContent=String(summary.expectedPresses);
  elements.resultWrong.textContent=String(summary.wrongPresses);
  elements.resultScoreCaption.textContent=summary.perfect?'Perfect playing! Every key press was right.':'Correct detected keys ÷ all key attempts (not rhythm accuracy)';
  const report=rhythmSession?.report();
  elements.resultTiming.textContent=elements.rhythmGrade.checked&&report?.assessed?`${report.onTime} / ${report.assessed}`:'Not graded';
  elements.resultHolds.textContent=elements.rhythmGrade.checked&&report?.holdsMeasured?`${report.holdsGood} / ${report.holdsMeasured}`:'Not measured';
  elements.resultNext.disabled=!nextLessonId;
  elements.resultNext.textContent=nextLessonId?'Next lesson →':'No more lessons yet';
  saveCompleted();
  metronome?.stop();metronome=null;
  elements.rhythmStart.disabled=false;elements.rhythmStop.disabled=true;
  elements.results.hidden=false;
  if(gameUI)gameUI.onComplete();
  else elements.results.scrollIntoView({behavior:'smooth',block:'start'});
}
function render(){
  const {lesson,position,length,done,target,summary}=engine.state();
  const hasMelody=Array.isArray(lesson.notes) && lesson.notes.length>0;
  const required=eventNotes(target??[]);
  const chord=required.length>1;
  elements.chordHelp.hidden=!chord;
  elements.chordHelp.textContent=chord?(elements.chordMode.value==='together'?'Play every gold key together. For reliable chords, connect a USB MIDI keyboard. Microphone polyphony is experimental.':'Build the chord: play each gold note. The app will collect the notes until the full chord is complete.'):'Single-note lesson: one key at a time.';
  elements.chordProgress.textContent=chord?`Chord: ${engine.state().collected.length} / ${required.length} notes found`:(done?'Lesson completed':'Single-note practice');
  keyboard.setCollected(engine.state().collected);
  setChordMode();
  elements.melodyButton.hidden=!hasMelody;
  elements.melodyStop.hidden=!hasMelody||!previewActive;
  elements.melodyButton.disabled=previewActive;
  elements.melodyMessage.hidden=!hasMelody;
  if(hasMelody&&!previewActive) elements.melodyMessage.textContent=Array.isArray(lesson.melodyBeats)?'Hear the rhythm of this melody, then play the golden keys one at a time.':'Listen to the full note sequence, then play the golden keys one at a time.';
  elements.voiceScript.textContent=lesson.spokenInstructions||lesson.description;
  elements.title.textContent=done?'Amazing work! ✨':lesson.title;
  elements.description.textContent=lesson.description;
  elements.target.textContent=done?'★':noteList(target);
  elements.hint.textContent=done?'You finished the lesson!':(position===0?lesson.hint:(chord?'Find every golden key':'Find the highlighted golden key'));
  elements.progress.textContent=`${position} / ${length}`;
  elements.stars.textContent=done?`${Math.round(summary.accuracy)}% accuracy`:`${Math.round(position/length*100)}% complete`;
  const percent=position/length*100;
  elements.fill.style.width=percent+'%';
  elements.bar.setAttribute('aria-valuenow',String(percent));
  keyboard.setTarget(done?null:target);
  if(selectedLayout===MAUDIO&&!done){
    const layout=displayProfile();
    if(eventNotes(target).some(n=>n<layout.first||n>layout.last)){
      const activity=$('piano-input-status');
      if(activity)activity.textContent=`Octave shift needed · ${noteList(target)} is outside ${midiToName(layout.first)}–${midiToName(layout.last)}`;
    }
  }
  refreshScore();
  elements.demo.disabled=done;
  if(done){
    status('You did it! 🌟 Review your score below, restart this lesson, or move to the next one.','success');
    showResults();
  }else{
    hideResults();
  }
  gameUI?.sync(engine.state());
}
async function handleCorrectFeedback(done){
  suppressUntil=Math.max(suppressUntil,Date.now()+(done?900:(rhythmSession?.anchorMs&&elements.rhythmGrade.checked?120:380)));
  try{ if(done) await soundCelebration(); else await soundChime(); }
  catch(error){ console.warn('Feedback sound unavailable',error); }
}
async function submitNote(midi,source,press={}){
  if(!engine||!scoringAllowed())return;
  if(source==='mic'&&selectedLayout===MAUDIO)return;
  if(source==='midi'&&selectedLayout!==MAUDIO)return;
  if((source==='mic'||source==='midi')&&(previewActive||voice?.isSpeaking||Date.now()<suppressUntil||pendingCalibration))return;
  if(source==='mic'&&Date.now()-lastMidiAt<1300)return;
  if(engine.state().done)return;
  if(elements.rhythmGrade.checked&&rhythmSession?.isCountingIn(performance.now())){status('Wait for the four-beat count-in to finish.');return;}
  keyboard.pulse(midi);keyboard.setDetected(midi);
  if(source==='screen'||source==='midi'){
    elements.heard.textContent=noteText(midi);
    elements.heardDetails.textContent=source==='midi'?'Played via USB MIDI':'Played on screen';
  }
  const before=engine.state();
  const onsetMs=press.onsetMs??performance.now();
  const compensatedOnsetMs=source==='mic'?onsetMs-Math.min(450,Math.max(0,Number(elements.micTimingOffset.value)||0)):onsetMs;
  const result=engine.accept(midi);
  const timingSource=Array.isArray(before.target)&&(source==='mic'||source==='screen')?source+'-build':source;
  const grade=result.correct&&result.eventComplete?timingForStep(before.position,compensatedOnsetMs,timingSource):null;
  recordAttempt(midi,source,before.position,result.correct,onsetMs,grade);
  if(result.correct&&result.eventComplete&&Number.isFinite(press.holdMs))recordHoldForStep(before.position,press.holdMs,source);
  if(result.correct){
    if(result.eventComplete){
      await handleCorrectFeedback(result.done);
      render();
      if(!result.done){
        status(`Great! ${noteList(before.target)} complete. Next: ${noteList(result.target)}.`,'success');
        if(!Array.isArray(before.target)&&result.target===midi&&source==='mic')status('Release the key and play the same note again.','success');
      }
    }else{
      render();
      status(`Good! ${noteText(midi)} found. Add: ${result.remaining.map(noteText).join(' + ')}.`,'success');
    }
  }else if(Date.now()-lastWrongAt>350){
    status(`You played ${noteText(midi)}. Look for ${noteList(before.target)} (the golden keys).`,'try-again');
    lastWrongAt=Date.now();
  }
}
async function submitMidiChord(notes,onsetMs=performance.now()){
 if(selectedLayout!==MAUDIO||!engine||!scoringAllowed()||previewActive||voice?.isSpeaking||Date.now()<suppressUntil||pendingCalibration)return;
 if(rhythmSession?.isCountingIn(performance.now()))return;
 const before=engine.state();
 const result=engine.acceptChord(notes);
 const grade=result?.eventComplete?timingForStep(before.position,onsetMs,'midi'):null;
 for(const n of notes)recordAttempt(n,'midi',before.position,true,onsetMs,grade);
 keyboard.setDetected(notes);notes.forEach(n=>keyboard.pulse(n));
 if(result?.eventComplete){await handleCorrectFeedback(result.done);render();if(!result.done)status(`Excellent chord! Next: ${noteList(result.target)}.`,'success');}
}
async function submitMicChord(notes){
  if(selectedLayout===MAUDIO||!engine||!scoringAllowed()||!chordLesson()||elements.chordMode.value!=='together')return;
  if(previewActive||voice?.isSpeaking||Date.now()<suppressUntil||pendingCalibration||Date.now()-lastMidiAt<1300)return;
  const expected=eventNotes(engine.target);
  const distinct=[...new Set(notes)].sort((a,b)=>a-b);
  if(expected.length!==distinct.length||!expected.every(x=>distinct.includes(x))){
    elements.chordProgress.textContent=`Heard ${distinct.map(noteText).join(' + ')} · try holding ${noteList(expected)} together`;
    return;
  }
  keyboard.setDetected(distinct);
  if(rhythmSession?.isCountingIn(performance.now()))return;
  const before=engine.state();
  const onset=performance.now();
  const result=engine.acceptChord(expected);
  const compensated=onset-Math.min(450,Math.max(0,Number(elements.micTimingOffset.value)||0));
  const grade=result.eventComplete?timingForStep(before.position,compensated,'mic-together'):null;
  expected.forEach(n=>{recordAttempt(n,'mic-together',before.position,true,onset,grade);keyboard.pulse(n);});
  if(result?.eventComplete){await handleCorrectFeedback(result.done);render();if(!result.done)status(`Great chord! Next: ${noteList(result.target)}.`,'success');}
}
async function playOnScreen(midi,press={}){
  stopMelodyPreview();
  suppressUntil=Date.now()+1100;
  await submitNote(midi,'screen',press);
  try {await soundNote(midi,{duration:.45});}
  catch(error){console.warn('Demo audio unavailable:',error);}
}
async function demonstrate(){
  if(!engine||engine.state().done)return;
  stopMelodyPreview();
  const target=engine.target;
  suppressUntil=Date.now()+1450;
  keyboard.pulse(target);
  status(`Listen to ${noteList(target)}. Now find and play it yourself!`);
  try{await Promise.all(eventNotes(target).map(n=>soundNote(n,{duration:.75,volume:.06})));}
  catch(error){status('Browser audio is unavailable. You can still use the toy piano keyboard.');}
}
function stopMelodyPreview({quiet=false}={}) {
  const wasPlaying=previewActive;
  previewEpoch++;
  previewActive=false;
  previewHandle?.cancel();
  previewHandle=null;
  if(elements.melodyButton)elements.melodyButton.disabled=false;
  if(elements.melodyStop)elements.melodyStop.hidden=true;
  if(wasPlaying){
    keyboard?.setDetected(null);
    clearMicLatch();
    suppressUntil=Date.now()+950;
    if(!quiet){
      elements.melodyMessage.textContent='Melody stopped. Now try playing the gold notes!';
      status('Melody stopped. Now play the highlighted note.');
    }
  }
}
async function hearWholeMelody(){
  if(!engine || previewActive || pendingCalibration)return;
  if(rhythmSession)stopRhythm({message:true});
  const lesson=engine.lesson;
  if(!Array.isArray(lesson.notes)||!lesson.notes.length)return;
  if(voice?.isSpeaking)stopVoice();
  const token=++previewEpoch;
  previewActive=true;
  suppressUntil=Infinity;
  clearMicLatch();
  elements.melodyButton.disabled=true;
  elements.melodyStop.hidden=false;
  elements.melodyMessage.textContent=`Playing ${lesson.title}. Watch the keys light up!`;
  status('Listen first! Lesson scoring is paused during the melody preview.');
  const finish=()=>{
    if(token!==previewEpoch)return;
    previewActive=false;
    previewHandle=null;
    suppressUntil=Date.now()+1100;
    clearMicLatch();
    keyboard.setDetected(null);
    elements.melodyButton.disabled=false;
    elements.melodyStop.hidden=true;
    elements.melodyMessage.textContent='Your turn! Play all the gold keys for each step.';
    status('Your turn! Follow the golden keys!','success');
  };
  try{
    const handle=await soundMelody(lesson.notes,lesson.melodyBeats ?? lesson.notes.map(()=>1),(selectedBpm()*selectedMultiplier()),{
      onNote:midi=>{
        if(token!==previewEpoch)return;
        eventNotes(midi).forEach(n=>keyboard.pulse(n));
        keyboard.setDetected(midi);
      },
      onEnd:finish
    });
    if(token!==previewEpoch){handle.cancel();return;}
    previewHandle=handle;
  }catch(error){
    if(token!==previewEpoch)return;
    stopMelodyPreview({quiet:true});
    elements.melodyMessage.textContent='Could not play the melody: '+error.message;
    status('Audio playback could not start. You can still practice one note at a time.','try-again');
  }
}
function onFrame({rms,peak,db,midi,rawMidi,frequency,rawFrequency,chordCandidates=[],clarity,cents,correctionCents,reason,threshold,contextState,trackState,trackLabel,sampleRate}){
  elements.resumeAudio.hidden=reason!=='audio-suspended';
  elements.settingsResumeAudio.hidden=reason!=='audio-suspended';
  const amount=levelPercent(rms);
  elements.soundFill.style.width=amount.toFixed(1)+'%';
  elements.micMeter.setAttribute('aria-valuenow',String(Math.round(amount)));
  elements.micLevel.textContent=Number.isFinite(db)?`${Math.max(-120,db).toFixed(1)} dBFS`:'— dBFS';
  maxInputLevel=Math.max(maxInputLevel,rms);
  const deviceLabel=trackLabel||'Unknown microphone';
  elements.micDebug.textContent=`Input: ${deviceLabel} · ${contextState} audio context · ${trackState} track · ${sampleRate||'?'} Hz · RMS ${rms.toFixed(5)} · Peak ${(peak||0).toFixed(4)} · Gate ${threshold}`;
  if(voice?.isSpeaking || previewActive){
    elements.heard.textContent='—';
    elements.heardDetails.textContent=previewActive?'Melody demonstration is playing':'Voice instructions are playing';
    elements.confidence.textContent=previewActive?'Lesson scoring paused for demonstration':'Lesson note scoring is paused for narration';
    keyboard.setDetected(null);
    return;
  }
  if(rawFrequency){
    const measuredCents=centsBetween(rawFrequency,midiToFrequency(rawMidi));
    elements.rawReadout.textContent=`Raw microphone reading: ${rawFrequency.toFixed(2)} Hz · ${noteText(rawMidi)} · ${measuredCents>=0?'+':''}${measuredCents.toFixed(1)} cents from that note; reference adjustment ${correctionCents>=0?'+':''}${correctionCents.toFixed(1)} cents`;
  } else elements.rawReadout.textContent='Raw pitch: no stable musical frequency available yet.';
  if(pendingCalibration && rawFrequency && clarity>=.76 && reason==='valid'){
    const deviation=centsBetween(rawFrequency,midiToFrequency(pendingCalibration.midi));
    if(Math.abs(deviation)<=150){
      pendingCalibration.samples.push(rawFrequency);
      if(pendingCalibration.samples.length%3===0){
        calMessage(`${midiToName(pendingCalibration.midi)}: ${pendingCalibration.samples.length}/14 stable readings · ${rawFrequency.toFixed(1)} Hz. Keep holding.`);
      }
      if(pendingCalibration.samples.length>=14)finishReferenceCapture();
    }
  }

  if(chordLesson()&&elements.chordMode.value==='together'&&chordCandidates.length>=2){
    elements.heard.textContent=noteList(chordCandidates);
    elements.heardDetails.textContent='Experimental microphone multi-pitch estimate';
    elements.confidence.textContent='Chord candidate · verify with MIDI if uncertain';
    keyboard.setDetected(chordCandidates);
    return;
  }
  if(midi!==null){
    elements.heard.textContent=noteText(midi);
    elements.heardDetails.textContent=`${frequency.toFixed(1)} Hz · ${Math.round(clarity*100)}% clarity · ${cents>=0?'+':''}${cents.toFixed(0)} cents`;
    elements.confidence.textContent=`Detected: ${noteText(midi)} · ${Math.round(clarity*100)}% confidence`;
    keyboard.setDetected(midi);
  } else {
    elements.heard.textContent='—';
    if(reason==='audio-suspended'){
      elements.heardDetails.textContent='Browser paused audio · tap Resume microphone audio';
      elements.confidence.textContent='Audio paused by device or browser';
    } else if(reason==='silence'){
      elements.heardDetails.textContent='Below sensitivity threshold';
      elements.confidence.textContent=rms>0.00005?'Some input · raise sensitivity if quiet':'Waiting for sound';
    } else if(reason==='out-of-range'){
      elements.heardDetails.textContent=`Heard ${Math.round(frequency)} Hz (${rawMidi===null?'unknown':noteText(rawMidi)}), outside ${noteText(MIN_MIDI)}–${noteText(MAX_MIDI)}`;
      elements.confidence.textContent='Pitch outside the visible toy piano range';
    } else {
      elements.heardDetails.textContent=`Sound heard · ${reason.replaceAll('-',' ')}`;
      elements.confidence.textContent=`Input active · no stable single note (${Math.round(clarity*100)}% clarity)`;
    }
    keyboard.setDetected(null);
  }
  if(!micWarned && microphone?.running && Date.now()-micStartTime>4500 && maxInputLevel<0.0001){
    micWarned=true;
    status('No measurable microphone signal so far. Clap near your laptop, then select a different microphone or check Windows input settings.','try-again');
  }
}
function updateMicButton(){
  const on=!!microphone?.running;
  const midiMode=selectedLayout===MAUDIO;
  elements.micBtn.disabled=midiMode;
  elements.micBtn.classList.toggle('mic-midi',midiMode);
  elements.micBtn.classList.toggle('mic-required',!on&&!midiMode);
  elements.micBtn.classList.toggle('mic-listening',on&&!midiMode);
  elements.settingsMicBtn.classList.toggle('mic-required',!on);
  elements.settingsMicBtn.classList.toggle('mic-listening',on);
  elements.micBtn.setAttribute('aria-label',midiMode?'USB MIDI selected; connect your keyboard in Settings':on?'Stop microphone':'Start microphone to hear the toy piano');
  elements.micBtn.classList.toggle('on',on);
  elements.settingsMicBtn.classList.toggle('on',on);
  elements.settingsMicText.textContent=on?'■ Stop listening':'● Start listening';
  elements.settingsMicState.textContent=on?`● Listening: ${microphone.trackLabel||'microphone'}`:'● Microphone off';
  elements.settingsMicState.classList.toggle('active',on);
  elements.micText.textContent=midiMode?'USB MIDI mode':on?'Stop listening':'Start listening';
  $('mic-icon').textContent=on?'■':'●';
  elements.micLed.classList.toggle('on',on);
  elements.micStatus.textContent=on?'Listening (live)':'Microphone off';
  const activity=$('piano-input-status');
  if(activity)activity.textContent=midiMode?(midiAccess?.inputs?.size?'USB MIDI connected · play your keyboard':'USB MIDI mode · connect in Settings'):(on?'Microphone listening':'Microphone OFF · tap Start listening');
  if(!on){
    elements.resumeAudio.hidden=true;
    elements.settingsResumeAudio.hidden=true;
    elements.micDebug.textContent=microphone?.lastError ? `Last microphone error: ${microphone.lastError}` : 'Input: disconnected. Click Start listening to show live input information.';
    elements.soundFill.style.width='0%';
    elements.micMeter.setAttribute('aria-valuenow','0');
    elements.micLevel.textContent='-- dBFS';
  }
}
async function refreshMicrophones(){
  const preferred=elements.micDevice.value;
  try{
    const devices=await MicrophoneDetector.devices();
    elements.micDevice.replaceChildren(new Option('System default microphone',''));
    devices.forEach((device,i)=>{
      if(!device.deviceId)return;
      const option=new Option(device.label||`Microphone ${i+1} (permission needed for name)`,device.deviceId);
      elements.micDevice.add(option);
    });
    if([...elements.micDevice.options].some(option=>option.value===preferred))elements.micDevice.value=preferred;
    if(isSettings())settingsFeedback(`Found ${devices.length} microphone input${devices.length===1?'':'s'}. Select one above to switch devices.`,'success');
  }catch(error){
    elements.micDebug.textContent=`Unable to list microphones: ${error.message}. Try clicking Start listening first.`;
  }
}
async function toggleMic(){
  elements.micBtn.disabled=true;
  elements.settingsMicBtn.disabled=true;
  try{
    if(microphone.running){
      await microphone.stop();
      cancelCapture('Capture cancelled because microphone was stopped.');updateCalibrationUI();
      keyboard.setDetected(null);
      elements.heardDetails.textContent='Microphone stopped';
      settingsFeedback('Microphone stopped. Press Start listening whenever you want to calibrate.');
    } else {
      microphone.threshold=Number(elements.micSensitivity.value);
      microphone.lastError='';
      micStartTime=Date.now();maxInputLevel=0;micWarned=false;
      await microphone.start(elements.micDevice.value);
      if(isSettings())microphone.chordRecognition=false;
      settingsFeedback('Microphone connected. Watch the meter, then tap Capture F3 below.','success');
      status('Mic connected. For chords, choose Build chord or experimental Together mode. For reliable chord recognition, connect USB MIDI.');
      await refreshMicrophones();
    }
  }catch(error){
    console.error('Mic start:',error);
    const detail=error.name==='NotAllowedError'?'Microphone access was blocked. On Android, open Chrome site settings and allow Microphone, then retry. On Windows, check browser and system permissions.':
      error.name==='NotFoundError'?'No input device found. Check the microphone connection and refresh devices.':
      error.name==='NotReadableError'?'Microphone unavailable or busy in another program. Close other recording apps.':error.message;
    microphone.lastError=`${error.name||'Error'}: ${detail}`;
    status(`Microphone unavailable: ${detail}`,'try-again');
    elements.micDebug.textContent=`Error ${error.name||'unknown'}: ${error.message}`;
    settingsFeedback(`Microphone unavailable: ${detail}`,'warning');
  }finally{elements.micBtn.disabled=false;elements.settingsMicBtn.disabled=false;updateMicButton();}
}
async function chooseMicDevice(){
  if(!microphone.running)return;
  cancelCapture('Microphone changed. Please capture F3 and C4 again.');
  references[53]=null;references[60]=null;calibrationResult=null;updateCalibrationUI();
  await microphone.stop();
  updateMicButton();
  await toggleMic();
}
function checkNoteDetector(){
  const test=runPitchSelfTest();
  if(test.passed){
    status(`Pitch algorithm PASS: generated F3 (${Math.round(test.frequency)} Hz) recognized correctly. This does NOT confirm the physical microphone is receiving sound.`,'success');
  }else{
    status('Pitch algorithm FAILED on the known F3 test signal. Please report this test result so we can fix the note detector.','try-again');
  }
}
async function toggleCamera(){
  elements.camBtn.disabled=true;
  try{
    if(cameraStream){
      cameraStream.getTracks().forEach(track=>track.stop());cameraStream=null;
      elements.video.srcObject=null;elements.video.classList.remove('visible');elements.camPlaceholder.hidden=false;
      elements.camBtn.textContent='Turn on camera preview';
    } else {
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera access requires localhost or HTTPS.');
      cameraStream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:960},height:{ideal:540}},audio:false});
      elements.video.srcObject=cameraStream;
      await elements.video.play();
      elements.video.classList.add('visible');elements.camPlaceholder.hidden=true;
      elements.camBtn.textContent='Turn off camera';
    }
  }catch(error){
    if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null;}
    status(`Camera unavailable: ${error.message}. The piano lessons still work without it.`,'try-again');
  }finally{elements.camBtn.disabled=false;}
}
function restartCurrentLesson(){
  syncVoiceLesson();
  celebrationPlayed=false;
  midiHeld.clear();midiOnsets.clear();midiSoundAllOff();
  resetPerformance();
  keyboard.setDetected(null);
  engine.restart();
  syncRhythmLesson();render();
  status('Ready again! Find the golden key.');
  gameUI?.show('play');
}
function moveToNextLesson(){
  const nextId=engine.state().nextLessonId;
  if(!nextId)return;
  syncVoiceLesson();
  celebrationPlayed=false;
  midiHeld.clear();midiOnsets.clear();midiSoundAllOff();
  resetPerformance();
  keyboard.setDetected(null);
  engine.select(nextId);
  elements.lesson.value=nextId;
  syncRhythmLesson();render();
  status('New adventure! Play the golden key to start.');
  gameUI?.show('play');
}
async function connectMidi(){
  // Open the audio engine while the click still counts as a user gesture.
  if(midiAudioEnabled)void prepareMidiAudio().catch(console.warn);
  if(!navigator.requestMIDIAccess){elements.midiStatus.textContent='Web MIDI unavailable: try Chrome on Windows via localhost or HTTPS.';setMidiActivity('This device/browser does not expose Web MIDI. Use Chrome on Windows or compatible Android Chrome.');return;}
  try{
    if(!midiAccess){midiAccess=await navigator.requestMIDIAccess({sysex:false});midiAccess.addEventListener('statechange',bindMidiInputs);}
    bindMidiInputs();
  }catch(error){elements.midiStatus.textContent='Could not connect MIDI: '+error.message;setMidiActivity('MIDI error: '+error.message);}
}
function bindMidiInputs(){
  if(!midiAccess)return;
  for(const input of midiAccess.inputs.values()){
    if(midiHandlers.has(input.id))continue;
    input.addEventListener('midimessage',onMidiMessage);
    midiHandlers.set(input.id,input);
  }
  const devices=[...midiAccess.inputs.values()].filter(d=>d.state!=='disconnected');
  updateMicButton();
  elements.midiStatus.textContent=devices.length?'MIDI inputs: '+devices.map(d=>d.name).join(', '):'No USB MIDI keyboard detected. Check its USB cable.';
  if(instrumentControls){
    const select=instrumentControls.device;
    select.replaceChildren(new Option('Auto-select M-Audio',''));
    for(const input of devices)select.add(new Option(input.name||'USB MIDI device',input.id));
    if(selectedMidiDevice&&devices.some(d=>d.id===selectedMidiDevice))select.value=selectedMidiDevice;
    else if(selectedMidiDevice){selectedMidiDevice='';saveInstrument();}
    setMidiActivity(devices.length?`Connected: ${devices.map(d=>d.name).join(', ')}. Press the leftmost C key to check its octave.`:'Waiting for MIDI controller. Plug it in, then tap Connect USB MIDI keyboard.');
  }
}
function onMidiMessage(event){
  const parsed=midiMessage(event.data);
  if(!parsed)return;
  const {type,note,velocity}=parsed;
  const sourceId=event.currentTarget?.id||event.target?.id||'';
  if(selectedMidiDevice&&sourceId&&sourceId!==selectedMidiDevice)return;
  if(selectedLayout!==MAUDIO)return;
  if(type==='off'){
    midiSoundOff(note);
    midiHeld.delete(note);
    keyboard.setDetected([...midiHeld]);
    const original=midiOnsets.get(note);midiOnsets.delete(note);
    if(original?.accepted&&rhythmSession){
      const chordHold=midiChordHolds.get(original.index);
      if(chordHold){
        if(!chordHold.finished){
          chordHold.finished=true;
          recordHoldForStep(original.index,performance.now()-chordHold.started,'midi');
        }
      }else recordHoldForStep(original.index,performance.now()-original.time,'midi');
    }
    return;
  }
  setMidiActivity(`MIDI received: ${noteText(note)} · note ${note} · velocity ${velocity}. ${midiLearningC?'Learning leftmost C…':''}`);
  if(midiLearningC){
    if(!validateFirstC(note)){
      setMidiActivity(`Received ${noteText(note)} (MIDI ${note}), which isn't a C. Press the LEFTMOST WHITE C key.`);
      return;
    }
    midiLearningC=false;
    midiFirstC=note;
    if(![...instrumentControls.firstC.options].some(o=>Number(o.value)===note))instrumentControls.firstC.add(new Option(midiToName(note),String(note)));
    setInstrumentLayout(MAUDIO);
    setMidiActivity(`Mapped! Your leftmost key sends MIDI ${note} (${noteText(note)}); display ends at ${noteText(note+31)}. No note transposition was applied.`);
    return;
  }
  if(midiHeld.has(note))return;
  if(midiAudioEnabled)void midiSoundOn(note,velocity).catch(error=>setMidiActivity('MIDI received, but audio could not play: '+error.message));
  midiHeld.add(note);
  midiOnsets.set(note,{time:performance.now(),index:engine?.position??0,accepted:false});
  lastMidiAt=Date.now();
  keyboard.setDetected([...midiHeld]);
  if(!engine||engine.state().done||!scoringAllowed())return;
  const required=eventNotes(engine.target);
  if(required.length>1){
    if(required.every(n=>midiHeld.has(n))){
      const onset=Math.min(...required.map(n=>midiOnsets.get(n)?.time??performance.now()));
      for(const n of required){const entry=midiOnsets.get(n);if(entry)entry.accepted=true;}
      midiChordHolds.set(engine.position,{started:Math.max(...required.map(n=>midiOnsets.get(n)?.time??onset)),finished:false});
      void submitMidiChord(required,onset);
    }else if(!required.includes(note))void submitNote(note,'midi');
  }else{
    const entry=midiOnsets.get(note);
    if(entry)entry.accepted=required.includes(note);
    void submitNote(note,'midi',{onsetMs:entry?.time});
  }
}

async function boot(){
  keyboard=new Keyboard($('keyboard'),playOnScreen);
  voice=new VoiceGuide({
    onState:voiceState,
    onBegin:()=>{suppressUntil=Infinity;clearMicLatch();},
    onFinish:()=>{suppressUntil=Date.now()+1100;clearMicLatch();}
  });
  if(!voice.supported){
    elements.voiceRead.disabled=true;
    elements.voiceChoice.disabled=true;
    elements.voiceRate.disabled=true;
    voiceState({type:'unsupported',message:'Speech synthesis is not supported by this browser.'});
  }else{
    refreshVoiceChoices();
    if(typeof voice.synth.addEventListener==='function')voice.synth.addEventListener('voiceschanged',refreshVoiceChoices);
    else voice.synth.onvoiceschanged=refreshVoiceChoices;
  }
  elements.voiceRead.addEventListener('click',readInstructions);
  elements.voiceStop.addEventListener('click',stopVoice);
  elements.voiceChoice.addEventListener('change',()=>voice.setVoice(elements.voiceChoice.value));
  elements.voiceRate.addEventListener('change',()=>voice.setSpeed(Number(elements.voiceRate.value)));
  microphone=new MicrophoneDetector(onFrame,({midi})=>{if(!chordLesson()||elements.chordMode.value==='build')void submitNote(midi,'mic');},error=>{microphone.lastError=error.message;status(error.message,'try-again');setTimeout(updateMicButton,80);});
  microphone.onChord=notes=>{void submitMicChord(notes);};
  microphone.setCorrection(storedCorrection);
  try{const threshold=localStorage.getItem(SENSITIVITY_STORAGE_KEY);if(threshold&&[...elements.micSensitivity.options].some(o=>o.value===threshold))elements.micSensitivity.value=threshold;}catch{}
  updateMicButton();
  // Source of truth for this deployed build is embedded in index.html.
  // This prevents a stale, cached lessons.json from silently reverting to four lessons.
  // Refreshing microphone device names must not block lesson initialization.
  try {
    const catalogText=$('embedded-lessons')?.textContent;
    if(!catalogText)throw new Error('Embedded catalog missing. Upload all v2.0 files.');
    const catalog=JSON.parse(catalogText);
    if(catalog.length!==20)throw new Error(`Expected 20 lessons in v2.0, received ${catalog.length}.`);
    engine=new LessonEngine(catalog);
    restoreActive(engine);
    gameUI=new GameUI({
      engine,
      chooseLesson:id=>{elements.lesson.value=id;elements.lesson.dispatchEvent(new Event('change',{bubbles:true}));},
      onModeChange:mode=>{
        if(rhythmSession)stopRhythm({message:false});
        elements.rhythmGrade.checked=mode==='perform';
        elements.rhythmFeedback.textContent=mode==='perform'?'Press Start with 4-beat count-in. Play when notes reach the line.':'Learn mode: take your time, the highway waits for you.';
      },
      onNavigate:()=>{stopRhythm({message:false});stopMelodyPreview({quiet:true});stopVoice();},
      onPageChange:name=>{
        if(name==='settings'){
          // Keep the mic running across navigation; disable experimental chord detection
          // so F3/C4 calibration always receives a single-note frequency estimate.
          if(microphone)microphone.chordRecognition=false;
          updateMicButton();updateCalibrationUI();
        } else {
          if(pendingCalibration)cancelCapture('Settings closed. Calibration was cancelled.');
          if(name==='play')setChordMode();
        }
      },
      getSession:()=>rhythmSession,
      getTempo:()=>({bpm:selectedBpm(),speed:selectedMultiplier()}),
      onNarrate:()=>elements.voiceRead.click()
    });
    setupInstrumentUI();
    elements.lesson.replaceChildren();
    engine.lessons.forEach((lesson,i)=>{
      const option=document.createElement('option');option.value=lesson.id;option.textContent=`${i+1} · ${lesson.title}`;
      elements.lesson.append(option);
    });
    elements.lesson.value=engine.lesson.id;
    elements.releaseStatus.textContent=`v2.4 READY · ${engine.lessons.length} lessons · ${engine.lessons.filter(l=>l.notes.some(Array.isArray)).length} chord lessons`;
    syncRhythmLesson();
    buildHistoryUI();
    render();
    status('Ready, Cleo! Choose a lesson to start your musical adventure.');
    if(!window.isSecureContext)status('Microphone and camera require HTTPS (GitHub Pages) or localhost. This page is not in a secure context.','try-again');
  }catch(error){
    console.error('Piano Play bootstrap error:',error);
    elements.releaseStatus.textContent='VERSION ERROR: '+error.message;
    status('Could not initialize lesson engine. '+error.message,'try-again');
    elements.micBtn.disabled=true;
    elements.demo.disabled=true;
    return;
  }
  // Best effort: listing device labels can be slow or fail on Android.
  void refreshMicrophones();
  elements.rhythmStart.addEventListener('click',startRhythm);
  elements.rhythmStop.addEventListener('click',()=>stopRhythm());
  elements.rhythmBpm.addEventListener('change',changeRhythmSettings);
  elements.rhythmSpeed.addEventListener('change',changeRhythmSettings);
  elements.metronomeAudible.addEventListener('change',()=>metronome?.setAudible(elements.metronomeAudible.checked));
  elements.rhythmGrade.addEventListener('change',()=>{
    if(rhythmSession)stopRhythm();
    elements.rhythmFeedback.textContent=elements.rhythmGrade.checked?'Rhythm grades enabled. Start the count-in.':'Free practice: beat can run without grades.';
  });
  elements.historyExport.addEventListener('click',exportPracticeHistory);
  elements.chordMode.addEventListener('change',()=>{setChordMode();render();status(elements.chordMode.value==='build'?'Build each chord one note at a time.':'Experimental simultaneous microphone detection; MIDI recommended.');});
  elements.midiButton.addEventListener('click',connectMidi);
  elements.chordTest.addEventListener('click',()=>{
    const sampleRate=48000,N=8192,notes=[53,57,60];
    const samples=Float32Array.from({length:N},(_,i)=>notes.reduce((sum,n)=>sum+.07*Math.sin(2*Math.PI*midiToFrequency(n)*i/sampleRate)+.014*Math.sin(4*Math.PI*midiToFrequency(n)*i/sampleRate),0));
    const found=spectralNotes(samples,sampleRate);
    status(notes.every(n=>found.includes(n))&&found.length===3?`Chord algorithm PASS: simulated F major recognized as ${noteList(found)}. This does not test the microphone.`:`Chord algorithm test failed: ${noteList(found)}. Please report this result.`,notes.every(n=>found.includes(n))&&found.length===3?'success':'try-again');
  });
  elements.lesson.addEventListener('change',()=>{
    if(gameUI&&!gameUI.canOpenLesson(elements.lesson.value)){
      elements.lesson.value=engine.lesson.id;
      status('This lesson is locked. Pass earlier lessons or enable testing mode in Settings.','try-again');
      return;
    }
    syncVoiceLesson();
    celebrationPlayed=false;
    midiHeld.clear();midiOnsets.clear();
    resetPerformance();
    keyboard.setDetected(null);
    engine.select(elements.lesson.value);
    syncRhythmLesson();render();
    status('New adventure! Play the golden key to start.');
    gameUI?.show('play');
  });
  elements.reset.addEventListener('click',restartCurrentLesson);
  elements.resultRestart.addEventListener('click',restartCurrentLesson);
  elements.resultNext.addEventListener('click',moveToNextLesson);
  elements.demo.addEventListener('click',demonstrate);
  elements.melodyButton.addEventListener('click',hearWholeMelody);
  elements.melodyStop.addEventListener('click',()=>stopMelodyPreview());
  elements.micBtn.addEventListener('click',toggleMic);
  elements.settingsMicBtn.addEventListener('click',toggleMic);
  elements.settingsResumeAudio.addEventListener('click',()=>elements.resumeAudio.click());
  elements.resumeAudio.addEventListener('click',async()=>{
    try{
      const resumed=await microphone.resumeAudio();
      if(resumed){elements.resumeAudio.hidden=true;elements.settingsResumeAudio.hidden=true;status('Microphone processing resumed. Play one note.','success');}
      else status('Audio could not resume. Stop listening, then Start listening again.','try-again');
    }catch(error){status('Could not resume microphone audio: '+error.message,'try-again');}
  });
  elements.micRefresh.addEventListener('click',refreshMicrophones);
  elements.micDevice.addEventListener('change',chooseMicDevice);
  elements.micSensitivity.addEventListener('change',()=>{microphone.threshold=Number(elements.micSensitivity.value);try{localStorage.setItem(SENSITIVITY_STORAGE_KEY,elements.micSensitivity.value);}catch{}settingsFeedback('Input sensitivity updated.','success');});
  elements.micSelfTest.addEventListener('click',checkNoteDetector);
  elements.captureF3.addEventListener('click',()=>startReferenceCapture(53));
  elements.captureC4.addEventListener('click',()=>startReferenceCapture(60));
  elements.applyCal.addEventListener('click',applyReferenceCorrection);
  elements.resetCal.addEventListener('click',resetReferenceCorrection);
  updateCalibrationUI();
  elements.labels.addEventListener('change',()=>keyboard.setLabels(elements.labels.value));
  elements.camBtn.addEventListener('click',toggleCamera);
  elements.flip.addEventListener('change',()=>elements.video.classList.toggle('mirrored',elements.flip.checked));
  // Stop capture on tab switch/app background. Android frequently suspends AudioContext
  // and camera streams while hidden. Explicit restart avoids stale audio and unwanted capture.
  let stoppedForBackground=false;
  const releaseBackgroundMedia=()=>{
    stopMelodyPreview({quiet:true});midiSoundAllOff();midiHeld.clear();midiOnsets.clear();
    stopRhythm({message:false});
    stopVoice();
    stoppedForBackground=!!microphone?.running||!!cameraStream;
    if(microphone?.running){cancelCapture('Calibration cancelled because the app went into the background.');void microphone.stop().finally(updateMicButton);}
    if(cameraStream){
      cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null;
      elements.video.srcObject=null;elements.video.classList.remove('visible');
      elements.camPlaceholder.hidden=false;elements.camBtn.textContent='Turn on camera preview';
    }
  };
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){releaseBackgroundMedia();}
    else if(stoppedForBackground){
      stoppedForBackground=false;
      updateMicButton();
      status('Welcome back! Android paused your microphone/camera. Tap Start listening to continue.');
      settingsFeedback('Android paused your microphone. Tap Start listening here to reconnect.','warning');
    }
  });
  window.addEventListener('pagehide',releaseBackgroundMedia);
}
boot();
