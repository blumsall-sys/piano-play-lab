import test from 'node:test';
import assert from 'node:assert/strict';
import {VoiceGuide,englishVoices,chooseEnglishVoice} from '../js/voice-guide.js';
import {readFileSync} from 'node:fs';
const lessons = JSON.parse(readFileSync(new URL('../lessons/lessons.json',import.meta.url), 'utf8'));
const voces = [
  {name:'Generic French',lang:'fr-FR',voiceURI:'fr'},
  {name:'Jenny English',lang:'en-US',voiceURI:'female'},
  {name:'Generic English',lang:'en-GB',voiceURI:'other'},
];
class FakeUtterance { constructor(text) { this.text=text; } }
function mockSpeech(){
  const synth={spoken:[],cancels:0,getVoices:()=>voces,cancel(){this.cancels++},speak(utterance){this.spoken.push(utterance)}};
  const counts={begin:0,finish:0,events:[]};
  const guide=new VoiceGuide({synth,Utterance:FakeUtterance,
    onState:s=>counts.events.push(s),onBegin:()=>counts.begin++,onFinish:()=>counts.finish++});
  return {guide,synth,counts};
}
test('All nine lessons have specific spoken instructions',()=>{
  assert.equal(lessons.length,9);
  for(const l of lessons){
    assert.ok(l.spokenInstructions && l.spokenInstructions.length>75,`${l.id} has no narration`);
    assert.ok(l.spokenInstructions.includes('!') || l.spokenInstructions.includes('.'));
  }
  assert.ok(lessons[0].spokenInstructions.includes('F three'));
  assert.ok(lessons[3].spokenInstructions.includes('F five'));
});
test('English voices filtered, automatic can choose feminine-name hint, explicit voice selection honored',()=>{
  assert.equal(englishVoices(voces).length,2);
  assert.equal(chooseEnglishVoice(voces).voiceURI,'female');
  assert.equal(chooseEnglishVoice(voces,'other').voiceURI,'other');
  assert.equal(chooseEnglishVoice([], 'missing'),null);
});
test('Saying instructions pauses scoring before starting speech and releases after end',()=>{
  const {guide,synth,counts}=mockSpeech();
  guide.setSpeed(.78);
  assert.equal(guide.speak(lessons[0].spokenInstructions),true);
  assert.equal(guide.isSpeaking,true);
  assert.equal(counts.begin,1);
  assert.equal(synth.spoken[0].rate,.78);
  assert.equal(synth.spoken[0].voice.voiceURI,'female');
  assert.equal(synth.spoken[0].lang,'en-US');
  synth.spoken[0].onend();
  assert.equal(guide.isSpeaking,false);
  assert.equal(counts.finish,1);
  assert.equal(counts.events.at(-1).type,'ready');
});
test('Stop/lesson change invalidates stale speech end events',()=>{
  const {guide,synth,counts}=mockSpeech();
  guide.speak('First lesson text.');
  const first=synth.spoken[0];
  guide.stop();
  assert.equal(counts.finish,1);
  guide.speak('New lesson text.');
  first.onend();
  assert.equal(guide.isSpeaking,true);
  assert.equal(counts.finish,1);
  synth.spoken.at(-1).onend();
  assert.equal(guide.isSpeaking,false);
  assert.equal(counts.finish,2);
});
test('Unsupported browser returns safely without blocking input',()=>{
  const guide=new VoiceGuide({synth:null,Utterance:null});
  assert.equal(guide.supported,false);
  assert.equal(guide.speak('Lesson'),false);
  assert.equal(guide.isSpeaking,false);
});
test('Empty narration is ignored',()=>{
  const {guide,counts}=mockSpeech();
  assert.equal(guide.speak(' '),false);
  assert.equal(counts.begin,0);
});
