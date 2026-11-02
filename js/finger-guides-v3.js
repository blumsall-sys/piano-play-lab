// Illustrated 2D piano hand guide. Fingering comes only from lesson assignments.
const NS='http://www.w3.org/2000/svg';
const el=(tag,attrs={},label)=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(label!==undefined)n.textContent=label;return n;};
const TIPS={1:[20,103],2:[64,53],3:[95,36],4:[128,51],5:[153,84]};
export function parseFingerCode(v){const m=/^(LH|RH)([1-5])$/i.exec(String(v||'').trim());return m?{hand:m[1].toUpperCase(),finger:Number(m[2])}:null;}
function drawHand(g,hand){
 const root=el('g',{transform:hand==='LH'?'translate(180 0) scale(-1 1)':'','stroke-linecap':'round','stroke-linejoin':'round'});
 root.append(el('path',{d:'M70 168 Q76 155 76 145 L118 145 Q124 158 131 168 L134 181 L65 181 Z',fill:'#d99e79',stroke:'#925d45','stroke-width':3}));
 const fingers=[
 ['M55 137 Q37 121 20 103',18,15],
 ['M77 123 Q70 86 64 53',18,15],
 ['M98 118 Q96 80 95 36',19,16],
 ['M116 121 Q122 83 128 51',18,15],
 ['M133 135 Q146 105 153 84',16,13]
 ];
 for(const [d,outer,inner] of fingers){root.append(el('path',{d,fill:'none',stroke:'#8d5d46','stroke-width':outer+3}));root.append(el('path',{d,fill:'none',stroke:'#f2c69f','stroke-width':inner}));}
 root.append(el('path',{d:'M54 133 C59 113 78 104 95 104 C119 103 139 119 143 140 C149 162 133 170 117 173 C100 177 77 170 64 159 C58 153 55 145 54 133 Z',fill:'#f2c69f',stroke:'#93624d','stroke-width':3}));
 root.append(el('path',{d:'M64 171 Q100 181 134 171 L138 182 L62 182 Z',fill:hand==='LH'?'#6cace6':'#e8985c',stroke:'#92644e','stroke-width':2}));
 root.append(el('path',{d:'M61 133 Q76 143 83 157 M109 116 Q120 131 119 146',fill:'none',stroke:'#cb926d','stroke-width':2.2,'stroke-opacity':.8}));
 for(const [x,y] of Object.values(TIPS))root.append(el('ellipse',{cx:x,cy:y+2,rx:5.2,ry:3.1,fill:'#fbe4d4',stroke:'#d6a286','stroke-width':1}));
 g.append(root);
}
export function updateFingerGuides(svg,notes,assignments,enabled,opacity=.38){
 svg?.querySelector('.piano-hand-guides')?.remove();
 if(!enabled||!svg||!assignments)return;
 const pitches=Array.isArray(notes)?notes:notes==null?[]:[notes];
 const codes=Array.isArray(assignments)?assignments:[assignments];
 const keys=new Map([...svg.querySelectorAll('.key')].map(k=>[Number(k.dataset.midi),k]));
 const grouped={LH:[],RH:[]};
 pitches.forEach((midi,i)=>{const f=parseFingerCode(codes[i]);if(f&&keys.has(midi))grouped[f.hand].push({...f,midi});});
 const layer=el('g',{class:'piano-hand-guides','pointer-events':'none','aria-label':'Cartoon piano fingering guides',opacity:Math.max(0,Math.min(1,Number(opacity)||0))});
 const firstWhite=svg.querySelector('.white-keys .key'),keyWidth=Number(firstWhite?.getAttribute('width'))||49;
 for(const hand of ['LH','RH']){
  const entries=grouped[hand];if(!entries.length)continue;
  const local=finger=>hand==='LH'?180-TIPS[finger][0]:TIPS[finger][0];
  const xFor=midi=>{const r=keys.get(midi);return Number(r.getAttribute('x'))+Number(r.getAttribute('width'))/2;};
  const avgLocal=entries.reduce((s,n)=>s+local(n.finger),0)/entries.length;
  const avgX=entries.reduce((s,n)=>s+xFor(n.midi),0)/entries.length;
  const defaultScale=Math.max(.9,Math.min(1.55,keyWidth/37));
  let sx=defaultScale;
  if(entries.length>1){const den=entries.reduce((s,n)=>s+(local(n.finger)-avgLocal)**2,0);if(den>1){const slope=entries.reduce((s,n)=>s+(local(n.finger)-avgLocal)*(xFor(n.midi)-avgX),0)/den;sx=Math.max(defaultScale*.72,Math.min(defaultScale*1.3,slope));}}
  const sy=.68,tx=avgX-avgLocal*sx;
  const tipY=entries.reduce((s,n)=>s+(keys.get(n.midi).classList.contains('black')?79:135),0)/entries.length;
  const localY=entries.reduce((s,n)=>s+TIPS[n.finger][1],0)/entries.length;
  const ty=Math.max(-20,Math.min(135,tipY-localY*sy));
  const group=el('g',{transform:'translate('+tx.toFixed(2)+' '+ty.toFixed(2)+') scale('+sx.toFixed(3)+' '+sy+')'});
  drawHand(group,hand);layer.append(group);
  for(const item of entries){const key=keys.get(item.midi),x=xFor(item.midi),y=key.classList.contains('black')?79:135;
   const badge=el('g',{class:'finger-contact-badge'});
   badge.append(el('circle',{cx:x,cy:y,r:12,fill:hand==='LH'?'#2e7fd0':'#db7438',stroke:'#fff','stroke-width':2.6}));
   badge.append(el('text',{x,y:y+4.4,'text-anchor':'middle','font-weight':850,'font-size':13,fill:'#fff'},String(item.finger)));layer.append(badge);
  }
 }
 svg.append(layer);
}
