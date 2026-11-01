// Schematic, optional real-time hand-position diagram (not a camera technique assessment).
const NS='http://www.w3.org/2000/svg';
const el=(tag,attrs={},label)=>{const x=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))x.setAttribute(k,String(v));if(label!==undefined)x.textContent=label;return x;};
export function updateFingerGuides(svg,notes,assignments,enabled){
  svg?.querySelector('.piano-hand-guides')?.remove();
  if(!enabled||!svg||!assignments)return;
  const pitches=Array.isArray(notes)?notes:notes==null?[]:[notes];
  const codes=Array.isArray(assignments)?assignments:[assignments];
  const keys=new Map([...svg.querySelectorAll('.key')].map(k=>[Number(k.dataset.midi),k]));
  const groups={LH:[],RH:[]};
  pitches.forEach((midi,i)=>{const m=/^(LH|RH)([1-5])$/i.exec(String(codes[i]||'').trim());if(m&&keys.has(midi))groups[m[1].toUpperCase()].push({midi,finger:Number(m[2])});});
  const layer=el('g',{class:'piano-hand-guides','pointer-events':'none','aria-label':'Illustrated fingering guidance'});
  const cx=midi=>{const r=keys.get(midi);return Number(r.getAttribute('x'))+Number(r.getAttribute('width'))/2;};
  const white=svg.querySelector('.white-keys .key');const keyW=white?Number(white.getAttribute('width')):48;
  for(const hand of ['LH','RH']){
    const list=groups[hand];if(!list.length)continue;
    const order=hand==='RH'?[1,2,3,4,5]:[5,4,3,2,1],points=new Map();
    const anchor=list[0],rank=order.indexOf(anchor.finger);
    order.forEach((finger,i)=>points.set(finger,cx(anchor.midi)+(i-rank)*keyW*.79));
    list.forEach(o=>points.set(o.finger,cx(o.midi)));
    const centre=[...points.values()].reduce((a,b)=>a+b,0)/5;
    const colour=hand==='LH'?'#77b8ff':'#ffb67d';
    layer.append(el('ellipse',{cx:centre,cy:178,rx:keyW*1.95,ry:28,fill:'#efc19e','fill-opacity':.74,stroke:colour,'stroke-width':2}));
    layer.append(el('rect',{x:centre-keyW*.74,y:192,width:keyW*1.48,height:19,rx:9,fill:'#e9b790','fill-opacity':.8,stroke:colour}));
    order.forEach((finger,i)=>{
      const active=list.find(t=>t.finger===finger),tx=points.get(finger);
      const black=active&&keys.get(active.midi).classList.contains('black');
      const ty=active?(black?66:112):[132,102,91,103,129][i];
      const base=centre+(i-2)*keyW*.55;
      const path=`M ${base} 169 Q ${(base+tx)/2} ${(169+ty)/2-8} ${tx} ${ty}`;
      layer.append(el('path',{d:path,fill:'none',stroke:'#997264','stroke-opacity':.52,'stroke-width':15,'stroke-linecap':'round'}));
      layer.append(el('path',{d:path,fill:'none',stroke:active?colour:'#f2cbaa','stroke-width':active?12:11,'stroke-linecap':'round'}));
      if(active){layer.append(el('circle',{cx:tx,cy:ty,r:13,fill:hand==='LH'?'#317be1':'#e77b40',stroke:'#fff','stroke-width':2}));layer.append(el('text',{x:tx,y:ty+4,'text-anchor':'middle',fill:'white','font-size':12,'font-weight':850},String(finger)));}
    });
    layer.append(el('text',{x:centre,y:205,'text-anchor':'middle',fill:'#263b52','font-size':11,'font-weight':850},hand==='LH'?'LEFT':'RIGHT'));
  }
  svg.append(layer);
}
