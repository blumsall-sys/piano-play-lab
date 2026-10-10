import {range,midiToFrequency} from './music.js?v=2.2';
// Experimental, local-only polyphonic piano recognition. This is not a
// substitute for MIDI. FFT magnitude salience with harmonic ghost rejection.
export function spectralNotes(samples,sampleRate,{correctionCents=0,relativeFloor=.22}={}){
 const n=samples.length;if(!Number.isInteger(n)||n<2048||(n&(n-1))!==0)return [];
 const re=new Float64Array(n),im=new Float64Array(n);
 for(let i=0;i<n;i++)re[i]=samples[i]*(.5-.5*Math.cos(2*Math.PI*i/(n-1)));
 for(let i=1,j=0;i<n;i++){
  let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;
  if(i<j){const t=re[i];re[i]=re[j];re[j]=t;}
 }
 for(let len=2;len<=n;len*=2){
  const phase=-2*Math.PI/len,cr=Math.cos(phase),ci=Math.sin(phase);
  for(let i=0;i<n;i+=len){let wr=1,wi=0;
   for(let j=0;j<len/2;j++){
    const a=i+j,b=a+len/2,tr=wr*re[b]-wi*im[b],ti=wr*im[b]+wi*re[b];
    re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;
    const w=wr*cr-wi*ci;wi=wr*ci+wi*cr;wr=w;
   }
  }
 }
 const mag=new Float64Array(n/2);
 for(let i=1;i<n/2;i++)mag[i]=Math.hypot(re[i],im[i]);
 const at=(hz)=>{
  const bin=hz*n/sampleRate,k=Math.round(bin),reach=Math.max(1,Math.ceil(hz*.009*n/sampleRate));
  if(k+reach>=mag.length||k-reach<1)return 0;
  let max=0;for(let j=k-reach;j<=k+reach;j++)if(mag[j]>max)max=mag[j];
  return max;
 };
 const candidates=range().map(midi=>{
  const hz=midiToFrequency(midi)*2**(correctionCents/1200);
  return {midi,hz,power:at(hz)};
 });
 const maximum=Math.max(...candidates.map(c=>c.power));
 if(maximum<.015)return [];
 const possible=candidates.filter(c=>{
  if(c.power<maximum*relativeFloor)return false;
  // Reject harmonic ghosts of lower active keys, primarily octaves and twelfths.
  for(const factor of [2,3,4]){
   const lower=c.hz/factor;
   if(lower<140)continue;
   if(at(lower)>c.power*(factor===2?1.4:1.8))return false;
  }
  return true;
 });
 // Adjacent semitones often share FFT energy in the short input window.
 // All included chord exercises use intervals larger than one semitone.
 const picked=[];
 for(const c of [...possible].sort((a,b)=>b.power-a.power)){
  if(!picked.some(other=>Math.abs(other.midi-c.midi)<=1))picked.push(c);
 }
 return picked.map(c=>c.midi).sort((a,b)=>a-b);
}
export class ChordFrameStabilizer{
 constructor(frames=3){this.frames=frames;this.last='';this.hits=0;this.latched='';this.silent=0;}
 reset(){this.last='';this.hits=0;this.latched='';this.silent=0;}
 accept(notes){
  const normalized=[...new Set(notes)].sort((a,b)=>a-b),key=normalized.join(',');
  if(!key){this.silent++;if(this.silent>=3)this.reset();return null;}
  this.silent=0;
  if(this.last===key)this.hits++;else{this.last=key;this.hits=1;}
  if(this.hits>=this.frames && this.latched!==key){this.latched=key;return normalized;}
  return null;
 }
}
