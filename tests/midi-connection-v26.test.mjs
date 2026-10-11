import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../js/main.js',import.meta.url),'utf8');
const shell=readFileSync(new URL('../js/game-ui.js',import.meta.url),'utf8');
const diagnostic=readFileSync(new URL('../midi-test.html',import.meta.url),'utf8');
test('MIDI discovery is triggered from keyboard selection and directly from the Practice button',()=>{
  assert.match(source,/selectedLayout===MAUDIO\)\{setMidiActivity\([^\n]+void connectMidi\(\)/);
  assert.match(source,/midiPractice\.addEventListener\('click',connectMidi\)/);
  assert.match(shell,/midi-practice-connect/);
});
test('MIDI setup includes explicit reconnect button and visible browser/device diagnostics',()=>{
  for(const id of ['midi-rescan','midi-connection-state','midi-browser-diagnostics','midi-last-event'])assert.ok(shell.includes(`id="${id}"`),id);
  assert.match(source,/midiRescan\.addEventListener\('click',connectMidi\)/);
  assert.match(source,/navigator\.requestMIDIAccess\(\{sysex:false\}\)/);
  assert.match(source,/await input\.open\(\)/);
});
test('replugging MIDI ports removes stale event listeners before rebinding',()=>{
  assert.match(source,/old\.removeEventListener\('midimessage',onMidiMessage\)/);
  assert.match(source,/input\.addEventListener\('midimessage',onMidiMessage\)/);
  assert.match(source,/midiAccess\.addEventListener\('statechange'/);
});
test('independent connection tester logs incoming MIDI messages and distinguishes empty device list',()=>{
  assert.match(diagnostic,/requestMIDIAccess\(\{sysex:false\}\)/);
  assert.match(diagnostic,/midimessage/);
  assert.match(diagnostic,/NO MIDI keyboard found/);
});
