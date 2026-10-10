import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HAPE,MAUDIO,profileFor,validateFirstC,midiMessage} from '../js/keyboard-profiles.js';
const file=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const ui=file('js/game-ui.js'),keyboard=file('js/keyboard.js'),main=file('js/main.js'),styles=file('css/game-v22.css');
test('Hape default remains exactly 25 keys F3-F5',()=>{
 const profile=profileFor(HAPE);assert.equal(profile.count,25);assert.equal(profile.first,53);assert.equal(profile.last,77);assert.equal(profile.anchor,'F');
});
test('M-Audio keybed displays 32 chromatic notes C3-G5 with selectable octave',()=>{
 const profile=profileFor(MAUDIO);assert.equal(profile.count,32);assert.equal(profile.first,48);assert.equal(profile.last,79);assert.equal(profile.anchor,'C');
 assert.equal(profileFor(MAUDIO,60).last,91);assert.equal(profileFor(MAUDIO,36).first,36);
 assert.equal(validateFirstC(60),true);assert.equal(validateFirstC(53),false);
});
test('raw USB MIDI note-on/off and velocity-zero note-off are correctly parsed',()=>{
 assert.deepEqual(midiMessage(new Uint8Array([0x90,53,88])),{type:'on',note:53,velocity:88});
 assert.deepEqual(midiMessage(new Uint8Array([0x90,53,0])),{type:'off',note:53,velocity:0});
 assert.deepEqual(midiMessage(new Uint8Array([0x80,53,64])),{type:'off',note:53,velocity:64});
 assert.equal(midiMessage(new Uint8Array([0xb0,7,127])),null);
});
test('voice button moves as the first item in piano controls, not header',()=>{
 assert.match(ui,/piano\.querySelector\('\.controls-row'\)\.prepend\(play\.querySelector\('#game-narrate'\)\)/);
 assert.match(styles,/#mic-button\.mic-required/);
 assert.match(styles,/#mic-button\.mic-listening/);
});
test('settings provides instrument, device, learn first C and MIDI sound toggles',()=>{
 for(const id of ['instrument-layout','midi-setup-options','midi-input-device','midi-learn-first-c','midi-first-c','midi-enable-sound'])assert.ok(ui.includes(`id="${id}"`));
 assert.match(main,/setupInstrumentUI\(\)/);assert.match(main,/setInstrumentLayout\(layout/);
 assert.match(keyboard,/this\.profile=profile/);
});
test('MIDI messages score directly and key releases measure sustain',()=>{
 assert.match(main,/midiHeld\.add\(note\)/);assert.match(main,/midiHeld\.delete\(note\)/);
 assert.match(main,/recordHoldForStep\(original\.index/);
 assert.match(main,/midiSoundOn\(note,velocity\)/);assert.match(main,/midiSoundOff\(note\)/);
 assert.match(main,/if\(selectedLayout!==MAUDIO\)return/);
});
test('selected keyboard layout and MIDI audio preference persist locally',()=>{
 assert.match(main,/INSTRUMENT_STORAGE_KEY='cleos-piano-instrument-v2\.4'/);
 assert.match(main,/localStorage\.setItem\(INSTRUMENT_STORAGE_KEY/);
 assert.match(main,/midiAudioEnabled=instrumentControls\.audio\.checked/);
});
