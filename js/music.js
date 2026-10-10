// Pure music helpers. A4=440 Hz, MIDI 60=C4 (scientific pitch notation).
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const MIN_MIDI = 60; // C4 - toy piano low C
export const MAX_MIDI = 84; // C6 - toy piano high C
export const midiToName = midi => `${NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
export const midiToFrequency = midi => 440 * 2 ** ((midi - 69) / 12);
export const frequencyToMidi = hz => (hz > 0 ? Math.round(69 + 12 * Math.log2(hz / 440)) : null);
export const isBlackKey = midi => [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
export const range = (a = MIN_MIDI, b = MAX_MIDI) => Array.from({length:b-a+1},(_,i)=>a+i);
export const sanitizeNote = midi => (Number.isInteger(midi) && midi >= MIN_MIDI && midi <= MAX_MIDI ? midi : null);
