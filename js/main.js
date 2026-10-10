import {Keyboard} from './keyboard.js?v=1.8.1';
import {MicrophoneDetector,levelPercent,runPitchSelfTest} from './audio-input.js?v=1.8.1';
import {LessonEngine} from './lesson.js?v=1.8.1';
import {MIN_MIDI,MAX_MIDI,midiToName,midiToFrequency} from './music.js?v=1.8.1';
import {soundNote,soundChime,soundCelebration,soundMelody} from './sound.js?v=1.8.1';
import {evaluateReference,compareReferences,centsBetween} from './calibration.js?v=1.8.1';
import {VoiceGuide} from './voice-guide.js?v=1.8.1';

const $=id=>document.getElementById(id);
const elements={
  lesson:$('lesson-select'),title:$('lesson-title'),description:$('lesson-description'),target:$('target-note'),hint:$('target-hint'),
  heard:$('heard-note'),heardDetails:$('heard-details'),progress:$('progress-count'),stars:$('stars-text'),fill:$('progress-fill'),bar:$('progress-track'),feedback:$('feedback'),
  micBtn:$('mic-button'),resumeAudio:$('resume-audio-button'),micText:$('mic-button-text'),micLed:$('mic-led'),micStatus:$('mic-status-text'),soundFill:$('sound-fill'),confidence:$('confidence-text'),
  micDevice:$('mic-device'),micRefresh:$('mic-refresh'),micSensitivity:$('mic-sensitivity'),micSelfTest:$('mic-self-test'),
  micLevel:$('mic-level-text'),micMeter:$('mic-meter'),micDebug:$('mic-debug-text'),
  rawReadout:$('mic-raw-text'),captureF3:$('capture-f3'),captureC4:$('capture-c4'),applyCal:$('apply-calibration'),resetCal:$('reset-calibration'),
  calibrationMessage:$('calibration-message'),f3Reference:$('f3-reference'),c4Reference:$('c4-reference'),correctionReadout:$('current-correction'),
  demo:$('demo-button'),reset:$('reset-button'),labels:$('label-mode'),camBtn:$('camera-button'),video:$('camera-video'),camPlaceholder:$('camera-placeholder'),flip:$('flip-camera'),
  results:$('results-screen'),resultAccuracy:$('result-accuracy'),resultAttempts:$('result-attempts'),resultIdeal:$('result-ideal'),resultWrong:$('result-wrong'),
  resultRestart:$('result-restart'),resultNext:$('result-next'),resultScoreCaption:$('result-score-caption'),
  voiceRead:$('voice-read'),voiceStop:$('voice-stop'),voiceStatus:$('voice-status'),voiceScript:$('voice-script'),voiceChoice:$('voice-choice'),voiceRate:$('voice-rate'),
  melodyButton:$('melody-button'),melodyStop:$('melody-stop'),melodyMessage:$('melody-message'),releaseStatus:$('release-status')
};
let engine;
let microphone;
let keyboard;
let voice;
let cameraStream=null;
let suppressUntil=0;
let lastWrongAt=0;
let micStartTime=0;
let maxInputLevel=0;
let micWarned=false;
let celebrationPlayed=false;
let previewActive=false;
let previewHandle=null;
let previewEpoch=0;
const references={53:null,60:null};
let pendingCalibration=null;
let calibrationResult=null;
let captureTimer=null;

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
function status(text,type=''){
  elements.feedback.textContent=text;
  elements.feedback.className='feedback'+(type?' '+type:'');
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
  if(!microphone?.running){calMessage('Start listening and select your microphone first.','warning');return;}
  if(pendingCalibration)return;
  suppressUntil=Date.now()+5000;
  if(midi===53){references[53]=null;references[60]=null;calibrationResult=null;}
  if(midi===60&&!references[53]?.ok){calMessage('Capture F3 before C4.','warning');return;}
  microphone.history=[];microphone.lastCandidate=null;microphone.hits=0;microphone.latched=null;
  pendingCalibration={midi,samples:[]};
  calMessage(`Capture active: play ONLY ${midiToName(midi)} now and hold for 2 seconds. Don't play a chord.`);
  updateCalibrationUI();
  clearTimeout(captureTimer);
  captureTimer=setTimeout(()=>{if(pendingCalibration?.midi===midi)finishReferenceCapture();},3800);
}
function applyReferenceCorrection(){
  if(!calibrationResult?.ok)return;
  microphone.setCorrection(calibrationResult.correction);
  const applied=Math.abs(calibrationResult.correction).toFixed(1);
  calMessage(`Applied measured software offset (${applied} cents). Check F3 and C4 again by ear. This does not tune the physical piano.${calibrationResult.large?' WARNING: A full-semitone offset often means the keyboard is transposed. Reset its transpose setting if possible.':''}`,'success');
  updateCalibrationUI();
}
function resetReferenceCorrection(){
  microphone.setCorrection(0);pendingCalibration=null;clearTimeout(captureTimer);captureTimer=null;
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
  elements.resultScoreCaption.textContent=summary.perfect?'Perfect lesson! Every key press was correct.':'Correct key presses out of total tries';
  elements.resultNext.disabled=!nextLessonId;
  elements.resultNext.textContent=nextLessonId?'Next lesson →':'No more lessons yet';
  elements.results.hidden=false;
  elements.results.scrollIntoView({behavior:'smooth',block:'start'});
}
function render(){
  const {lesson,position,length,done,target,summary}=engine.state();
  const hasMelody=Array.isArray(lesson.notes) && lesson.notes.length>0;
  elements.melodyButton.hidden=!hasMelody;
  elements.melodyStop.hidden=!hasMelody||!previewActive;
  elements.melodyButton.disabled=previewActive;
  elements.melodyMessage.hidden=!hasMelody;
  if(hasMelody&&!previewActive) elements.melodyMessage.textContent=Array.isArray(lesson.melodyBeats)?'Hear the rhythm of this melody, then play the golden keys one at a time.':'Listen to the full note sequence, then play the golden keys one at a time.';
  elements.voiceScript.textContent=lesson.spokenInstructions||lesson.description;
  elements.title.textContent=done?'Amazing work! ✨':lesson.title;
  elements.description.textContent=lesson.description;
  elements.target.textContent=done?'★':noteText(target);
  elements.hint.textContent=done?'You finished the lesson!':(position===0?lesson.hint:'Find the highlighted golden key');
  elements.progress.textContent=`${position} / ${length}`;
  elements.stars.textContent=done?`${Math.round(summary.accuracy)}% accuracy`:`${Math.round(position/length*100)}% complete`;
  const percent=position/length*100;
  elements.fill.style.width=percent+'%';
  elements.bar.setAttribute('aria-valuenow',String(percent));
  keyboard.setTarget(done?null:target);
  elements.demo.disabled=done;
  if(done){
    status('You did it! 🌟 Review your score below, restart this lesson, or move to the next one.','success');
    showResults();
  }else{
    hideResults();
  }
}
async function handleCorrectFeedback(done){
  suppressUntil=Math.max(suppressUntil,Date.now()+(done?900:380));
  try{ if(done) await soundCelebration(); else await soundChime(); }
  catch(error){ console.warn('Feedback sound unavailable',error); }
}
async function submitNote(midi,source){
  if(!engine)return;
  if(source==='mic'&&(previewActive || voice?.isSpeaking || Date.now()<suppressUntil || pendingCalibration))return;
  keyboard.pulse(midi);
  keyboard.setDetected(midi);
  if(source==='screen') {
    elements.heard.textContent=noteText(midi);
    elements.heardDetails.textContent='Played on screen (not microphone)';
  }
  const before=engine.state();
  if(before.done)return;
  const result=engine.accept(midi);
  if(result.correct){
    await handleCorrectFeedback(result.done);
    render();
    if(result.done){
      if(!celebrationPlayed){celebrationPlayed=true;}
    } else {
      status(`Great job! ${noteText(midi)} is right. Now try ${noteText(result.target)}!`,'success');
      if(result.target===midi&&source==='mic') status(`Great job! Release the key, then play ${noteText(midi)} again.`,'success');
    }
  } else if(Date.now()-lastWrongAt>650){
    status(`You played ${noteText(midi)}. Look for ${noteText(before.target)} (the golden key) and try again.`,'try-again');
    lastWrongAt=Date.now();
  }
}
async function playOnScreen(midi){
  stopMelodyPreview();
  suppressUntil=Date.now()+1100;
  await submitNote(midi,'screen');
  try {await soundNote(midi,{duration:.45});}
  catch(error){console.warn('Demo audio unavailable:',error);}
}
async function demonstrate(){
  if(!engine||engine.state().done)return;
  stopMelodyPreview();
  const target=engine.target;
  suppressUntil=Date.now()+1450;
  keyboard.pulse(target);
  status(`Listen to ${noteText(target)}. Now find and play it yourself!`);
  try{await soundNote(target,{duration:.75});}
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
    elements.melodyMessage.textContent='Your turn! Play the golden keys one note at a time.';
    status('Now it is your turn. Play the highlighted note!','success');
  };
  try{
    const handle=await soundMelody(lesson.notes,lesson.melodyBeats ?? lesson.notes.map(()=>1),lesson.bpm||90,{
      onNote:midi=>{
        if(token!==previewEpoch)return;
        keyboard.pulse(midi);
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
function onFrame({rms,peak,db,midi,rawMidi,frequency,rawFrequency,clarity,cents,correctionCents,reason,threshold,contextState,trackState,trackLabel,sampleRate}){
  elements.resumeAudio.hidden=reason!=='audio-suspended';
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
      if(pendingCalibration.samples.length>=14)finishReferenceCapture();
    }
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
  elements.micBtn.classList.toggle('on',on);
  elements.micText.textContent=on?'Stop listening':'Start listening';
  $('mic-icon').textContent=on?'■':'●';
  elements.micLed.classList.toggle('on',on);
  elements.micStatus.textContent=on?'Listening (live)':'Microphone off';
  if(!on){
    elements.resumeAudio.hidden=true;
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
  }catch(error){
    elements.micDebug.textContent=`Unable to list microphones: ${error.message}. Try clicking Start listening first.`;
  }
}
async function toggleMic(){
  elements.micBtn.disabled=true;
  try{
    if(microphone.running){
      await microphone.stop();
      pendingCalibration=null;clearTimeout(captureTimer);captureTimer=null;updateCalibrationUI();
      keyboard.setDetected(null);
      elements.heardDetails.textContent='Microphone stopped';
    } else {
      microphone.threshold=Number(elements.micSensitivity.value);
      microphone.lastError='';
      micStartTime=Date.now();maxInputLevel=0;micWarned=false;
      await microphone.start(elements.micDevice.value);
      status('Mic connected. Check the level meter by clapping or speaking, then play one piano key at a time.');
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
  }finally{elements.micBtn.disabled=false;updateMicButton();}
}
async function chooseMicDevice(){
  if(!microphone.running)return;
  await microphone.stop();
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
  keyboard.setDetected(null);
  engine.restart();
  render();
  status('Ready again! Find the golden key.');
}
function moveToNextLesson(){
  const nextId=engine.state().nextLessonId;
  if(!nextId)return;
  syncVoiceLesson();
  celebrationPlayed=false;
  keyboard.setDetected(null);
  engine.select(nextId);
  elements.lesson.value=nextId;
  render();
  status('New adventure! Play the golden key to start.');
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
  microphone=new MicrophoneDetector(onFrame,({midi})=>submitNote(midi,'mic'),error=>{microphone.lastError=error.message;status(error.message,'try-again');setTimeout(updateMicButton,80);});
  // Source of truth for this deployed build is embedded in index.html.
  // This prevents a stale, cached lessons.json from silently reverting to four lessons.
  // Refreshing microphone device names must not block lesson initialization.
  try {
    const catalogText=$('embedded-lessons')?.textContent;
    if(!catalogText)throw new Error('Embedded lesson catalog is missing. Upload the v1.8.1 index.html.');
    const catalog=JSON.parse(catalogText);
    if(catalog.length!==9)throw new Error(`Expected 9 lessons in v1.8.1, received ${catalog.length}.`);
    engine=new LessonEngine(catalog);
    elements.lesson.replaceChildren();
    engine.lessons.forEach((lesson,i)=>{
      const option=document.createElement('option');option.value=lesson.id;option.textContent=`${i+1} · ${lesson.title}`;
      elements.lesson.append(option);
    });
    elements.releaseStatus.textContent=`v1.8.1 READY · ${engine.lessons.length} lessons loaded · ${engine.lessons.filter(l=>Array.isArray(l.melodyBeats)).length} timed melodies`;
    render();
    status('Nine lessons ready. Select a melody, tap Hear whole melody, or play the golden key.');
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
  elements.lesson.addEventListener('change',()=>{
    syncVoiceLesson();
    celebrationPlayed=false;
    keyboard.setDetected(null);
    engine.select(elements.lesson.value);
    render();
    status('New adventure! Play the golden key to start.');
  });
  elements.reset.addEventListener('click',restartCurrentLesson);
  elements.resultRestart.addEventListener('click',restartCurrentLesson);
  elements.resultNext.addEventListener('click',moveToNextLesson);
  elements.demo.addEventListener('click',demonstrate);
  elements.melodyButton.addEventListener('click',hearWholeMelody);
  elements.melodyStop.addEventListener('click',()=>stopMelodyPreview());
  elements.micBtn.addEventListener('click',toggleMic);
  elements.resumeAudio.addEventListener('click',async()=>{
    try{
      const resumed=await microphone.resumeAudio();
      if(resumed){elements.resumeAudio.hidden=true;status('Microphone processing resumed. Play one note.','success');}
      else status('Audio could not resume. Stop listening, then Start listening again.','try-again');
    }catch(error){status('Could not resume microphone audio: '+error.message,'try-again');}
  });
  elements.micRefresh.addEventListener('click',refreshMicrophones);
  elements.micDevice.addEventListener('change',chooseMicDevice);
  elements.micSensitivity.addEventListener('change',()=>{microphone.threshold=Number(elements.micSensitivity.value);});
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
    stopMelodyPreview({quiet:true});
    stopVoice();
    stoppedForBackground=!!microphone?.running||!!cameraStream;
    if(microphone?.running){void microphone.stop().finally(updateMicButton);}
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
    }
  });
  window.addEventListener('pagehide',releaseBackgroundMedia);
}
boot();
