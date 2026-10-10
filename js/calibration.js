import {midiToFrequency} from './music.js?v=1.6';

export const centsBetween = (measured, reference) =>
  measured > 0 && reference > 0 ? 1200 * Math.log2(measured / reference) : NaN;
export const applyCorrection = (frequency, cents = 0) =>
  frequency * 2 ** (-cents / 1200);
export function median(values) {
  if (!values.length) return NaN;
  const data=[...values].sort((a,b)=>a-b);
  const middle=Math.floor(data.length/2);
  return data.length%2 ? data[middle] : (data[middle-1]+data[middle])/2;
}
// All samples must be readings made while playing a known reference note.
// This is a measurement offset, not piano tuning or a verification of fingering.
export function evaluateReference(midi, samples) {
  const expected=midiToFrequency(midi);
  const candidates=samples.filter(f=>Number.isFinite(f)&&f>0);
  if (candidates.length<7) return {ok:false,message:'Not enough stable readings. Hold the key for 2 seconds and try again.'};
  const cents=candidates.map(f=>centsBetween(f,expected));
  const central=median(cents);
  const variation=median(cents.map(c=>Math.abs(c-central)));
  if(!Number.isFinite(central)||Math.abs(central)>150)
    return {ok:false,message:'This sounds more than 1½ semitones away. Check which key you pressed and try again.'};
  if(variation>15)
    return {ok:false,message:`Pitch is unstable (±${variation.toFixed(0)} cents). Try a longer single note away from other sounds.`};
  return {ok:true,midi,measured:median(candidates),expected,cents:central,variation,count:candidates.length};
}
export function compareReferences(firstNote,secondNote) {
  if(!firstNote?.ok || !secondNote?.ok) return {ok:false,message:'Capture both reference notes before applying a correction.'};
  const difference=Math.abs(firstNote.cents-secondNote.cents);
  if(difference>28) return {ok:false,message:`F3 and C4 disagree by ${difference.toFixed(0)} cents. This suggests an inconsistent pitch estimate, not a simple tuning offset. Leave correction OFF and investigate microphone/audio effects.`};
  const correction=median([firstNote.cents,secondNote.cents]);
  if(Math.abs(correction)>125) return {ok:false,message:'Offset is too large to compensate safely. Check piano transpose and tuning settings.'};
  const large=Math.abs(correction)>40;
  return {ok:true,correction,large,message:large
    ? `Both notes are consistently ${correction>0?'sharp':'flat'} by about ${Math.abs(correction).toFixed(0)} cents. If near 100 cents, check the digital piano TRANSPOSE setting (possibly +1/-1). Software compensation is optional; it does NOT retune the instrument.`
    : `Both reference notes agree: approximately ${correction>=0?'+':''}${correction.toFixed(1)} cents. A small software reference adjustment is available.`};
}
