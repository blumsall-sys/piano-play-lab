import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=file('index.html'),main=file('js/main.js'),ui=file('js/game-ui.js');
test('Settings contains independently accessible live microphone and resume buttons',()=>{
 for(const id of ['settings-mic-button','settings-mic-button-text','settings-mic-state','settings-mic-feedback','settings-resume-audio','mic-device','mic-refresh','mic-sensitivity','mic-self-test'])
  assert.match(html,new RegExp(`id="${id}"`),id);
 assert.match(main,/settingsMicBtn\.addEventListener\('click',toggleMic\)/);
 assert.match(main,/settingsResumeAudio\.addEventListener\('click'/);
 assert.match(main,/settingsMicState\.textContent=/);
});
test('Settings navigation preserves active mic and excludes settings pitches from scoring',()=>{
 assert.match(main,/onNavigate:\(\)=>\{stopRhythm/);
 assert.doesNotMatch(main,/onNavigate:[^\n]*microphone\.stop/);
 assert.match(main,/function scoringAllowed\(\)/);
 assert.match(main,/if\(!engine\|\|!scoringAllowed\(\)\)return;/);
 assert.match(main,/if\(name==='settings'\)/);
 assert.match(main,/microphone\.chordRecognition=false/);
 assert.match(ui,/this\.onPageChange\?\.\(name\)/);
});
test('F3 and C4 calibration can be applied, saved, restored and cleared',()=>{
 for(const id of ['capture-f3','capture-c4','apply-calibration','reset-calibration','f3-reference','c4-reference','current-correction','mic-raw-text'])
  assert.match(html,new RegExp(`id="${id}"`),id);
 assert.match(main,/CAL_STORAGE_KEY='cleos-piano-calibration-v2\.3'/);
 assert.match(main,/microphone\.setCorrection\(storedCorrection\)/);
 assert.match(main,/localStorage\.setItem\(CAL_STORAGE_KEY/);
 assert.match(main,/localStorage\.removeItem\(CAL_STORAGE_KEY\)/);
 assert.match(main,/pendingCalibration\.samples\.push\(rawFrequency\)/);
 assert.match(main,/elements\.applyCal\.addEventListener\('click',applyReferenceCorrection\)/);
});
test('Other settings actions remain wired to UI',()=>{
 for(const [id,fragment] of [
 ['unlock-all-lessons','unlock-all-lessons'],['voice-read','voiceRead.addEventListener'],
 ['voice-stop','voiceStop.addEventListener'],['voice-choice','voiceChoice.addEventListener'],
 ['voice-rate','voiceRate.addEventListener'],['chord-mode','chordMode.addEventListener'],
 ['chord-self-test','chordTest.addEventListener'],['midi-button','midiButton.addEventListener'],
 ['camera-button','camBtn.addEventListener'],['flip-camera','flip.addEventListener'],
 ['mic-timing-offset','mic-timing-offset']]){
  assert.match(html+ui,new RegExp(`id="${id}"`),id);
  assert.ok((main+ui).includes(fragment),fragment);
 }
});
