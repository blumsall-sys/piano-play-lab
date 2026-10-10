// Piano geometry and MIDI view mappings. MIDI numbers are never artificially transposed.
export const HAPE = 'hape';
export const MAUDIO = 'maudio';
export const DEFAULT_MAUDIO_FIRST_C = 48; // Display assumption only; use Learn first C to confirm.
export const profiles = Object.freeze({
  hape:{id:HAPE, label:'Hape toy piano (25 keys)', first:53, last:77, count:25, anchor:'F'},
  maudio:{id:MAUDIO,label:'M-Audio Keystation Mini 32 MK3 (32 keys)',first:DEFAULT_MAUDIO_FIRST_C,last:79,count:32,anchor:'C'}
});
export function validateFirstC(midi){return Number.isInteger(midi)&&midi>=0&&midi<=96&&midi%12===0;}
export function profileFor(id,firstC=DEFAULT_MAUDIO_FIRST_C){
  if(id!==MAUDIO)return profiles.hape;
  const start=validateFirstC(firstC)?firstC:DEFAULT_MAUDIO_FIRST_C;
  return {...profiles.maudio,first:start,last:start+31};
}
export function midiMessage(data){
  if(!data||data.length<3)return null;
  const status=data[0]&0xf0,note=data[1],velocity=data[2];
  if((status===0x90||status===0x80)&&Number.isInteger(note)&&note>=0&&note<=127){
    return {type:status===0x80||velocity===0?'off':'on',note,velocity};
  }
  return null;
}
