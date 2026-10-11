import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setMidiVolume,setChimeVolume,getAudioMix,soundChime,soundCelebration,midiSoundOn,midiSoundOff,midiSoundAllOff,clampVolume} from '../js/sound.js';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('volume setters are independent and clamp inputs',()=>{
  setMidiVolume(.8);setChimeVolume(.2);
  assert.deepEqual(getAudioMix(),{midi:.8,chime:.2});
  setChimeVolume(-1);assert.equal(getAudioMix().chime,0);assert.equal(getAudioMix().midi,.8);
  setMidiVolume(300);assert.equal(getAudioMix().midi,1);
  assert.equal(clampVolume('not a volume'),0);
});

test('MIDI voice and feedback tones use independent output buses, with live adjustment',async()=>{
  let contexts=[];
  class Param{value=1;setValueAtTime(v){this.value=v;}exponentialRampToValueAtTime(v){this.value=v;}setTargetAtTime(v){this.value=v;}cancelScheduledValues(){} }
  class FakeNode{
    constructor(type){this.type=type;this.to=[];this.gain=new Param();this.frequency={value:0};this.detune={value:0};}
    connect(node){this.to.push(node);return node;}
    start(){}stop(){}
  }
  class FakeAudioContext{
    constructor(){this.destination={type:'destination'};this.currentTime=10;this.state='running';this.gains=[];this.oscs=[];contexts.push(this);}
    createGain(){const n=new FakeNode('gain');this.gains.push(n);return n;}
    createOscillator(){const n=new FakeNode('oscillator');this.oscs.push(n);return n;}
    resume(){return Promise.resolve();}
  }
  globalThis.window={AudioContext:FakeAudioContext};
  setMidiVolume(.9);setChimeVolume(.2);
  await midiSoundOn(53,100);
  const ctx=contexts[0];
  assert.ok(ctx);assert.equal(ctx.gains.length,5); // 2 buses + three per-note voices
  const [midiBus,feedbackBus]=ctx.gains;
  assert.equal(midiBus.gain.value,.9);assert.equal(feedbackBus.gain.value,.2);
  assert.equal(ctx.gains[2].to[0],midiBus);
  await soundChime();
  assert.ok(ctx.gains.slice(5).every(node=>node.to[0]===feedbackBus));
  const before=ctx.gains.length;
  await soundCelebration();
  assert.ok(ctx.gains.slice(before).every(node=>node.to[0]===feedbackBus));
  setMidiVolume(.5);setChimeVolume(0);
  assert.equal(midiBus.gain.value,.5);
  assert.equal(feedbackBus.gain.value,0);
  midiSoundOff(53);midiSoundAllOff();
  delete globalThis.window;
});

test('control row and highway precede keyboard while redundant music-room title is removed',()=>{
  const ui=source('js/game-ui.js');
  const main=source('js/main.js');
  const css=source('css/game-v22.css');
  assert.match(ui,/play\.append\(lesson,rhythm,highwayBox,piano\)/);
  assert.match(ui,/redundantHeading\?\.remove\(\)/);
  assert.match(ui,/highwayBox\.querySelector\('\.highway-key'\)\.append\(keyLegend\)/);
  assert.match(ui,/settings-mix-sliders/);
  assert.match(ui,/quick-mix-sliders/);
  assert.match(main,/setupAudioMixUI\(\)/);
  assert.match(main,/cleos-piano-audio-mix-v2\.7/);
  assert.match(css,/\.mix-volume-control/);
});
