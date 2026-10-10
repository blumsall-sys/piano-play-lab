// Dependency-free real-time monophonic pitch estimator based on YIN's
// cumulative mean normalized difference function (CMNDF).
// Limitations: one sounding note at a time; chords / loud harmonics / noisy
// environments may give ambiguous results. This is NOT chord detection.
export function pitchYin(samples, sampleRate, {minHz=115, maxHz=570, threshold=0.19} = {}) {
  if (!samples || samples.length < 1024 || sampleRate <= 0) return null;
  const minTau = Math.max(2, Math.floor(sampleRate / maxHz));
  const maxTau = Math.min(Math.floor(sampleRate / minHz), Math.floor(samples.length / 3));
  if (maxTau <= minTau) return null;
  const windowSize = Math.min(Math.floor(samples.length / 2), 1500);
  const difference = new Float64Array(maxTau+1);
  const cmnd = new Float64Array(maxTau+1);
  for (let tau=1; tau<=maxTau; tau++) {
    let sum=0;
    for (let i=0; i<windowSize; i++) {
      const d = samples[i]-samples[i+tau];
      sum += d*d;
    }
    difference[tau] = sum;
  }
  let cumulative=0;
  cmnd[0]=1;
  for(let tau=1;tau<=maxTau;tau++) {
    cumulative+=difference[tau];
    cmnd[tau]=cumulative>0?difference[tau]*tau/cumulative:1;
  }
  let bestTau = -1;
  for (let tau=minTau; tau<maxTau; tau++) {
    if (cmnd[tau] < threshold) {
      while(tau+1 <= maxTau && cmnd[tau+1] < cmnd[tau]) tau++;
      bestTau=tau;
      break;
    }
  }
  if(bestTau < 0) {
    let best=Infinity;
    for(let tau=minTau; tau<=maxTau; tau++) {
      if(cmnd[tau] < best) {best=cmnd[tau];bestTau=tau;}
    }
    if(best > 0.30) return null;
  }
  const left=cmnd[bestTau-1] ?? cmnd[bestTau];
  const mid=cmnd[bestTau];
  const right=cmnd[bestTau+1] ?? mid;
  const denom=left-2*mid+right;
  let refined=bestTau;
  if(Math.abs(denom)>1e-10) refined+=Math.max(-1,Math.min(1,0.5*(left-right)/denom));
  const frequency=sampleRate/refined;
  const clarity=Math.max(0,Math.min(1,1-mid));
  if(!Number.isFinite(frequency)||frequency<minHz||frequency>maxHz) return null;
  return {frequency, clarity};
}

// Average adjacent input samples to reduce noise/aliasing when downsampling.
export function downsample(samples, factor=4) {
  const result=new Float32Array(Math.floor(samples.length/factor));
  for(let i=0;i<result.length;i++) {
    let total=0;
    for(let j=0;j<factor;j++) total+=samples[i*factor+j];
    result[i]=total/factor;
  }
  return result;
}
export function rmsOf(samples) {
  let sum=0;
  for(const value of samples) sum+=value*value;
  return Math.sqrt(sum/samples.length);
}
