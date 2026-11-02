// Top-down illustrated hand silhouettes. Finger numbers anchor to actual lesson keys.
// Visual guidance only; the app does not assess physical finger technique.
const NS='http://www.w3.org/2000/svg';
const el=(tag,attrs={},text)=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;};
const TIP={1:[20,103],2:[64,53],3:[95,36],4:[128,51],5:[153,84]};
export function parseFingerCode(s){const m=/^(LH|RH)([1-5])$/i.exec(String(s||'').trim());return m?{hand:m[1].toUpperCase(),finger:+m[2]}:null;}
function handArt(parent,hand){
  const g=el('g',{transform:hand==='LH'?'translate(180 0) scale(-1 1)':'','stroke-linecap':'round','stroke-linejoin':'round'});
  g.append(el('path',{d:'M70 168 Q76 155 76 145 L118 145 Q124 158 131 168 L134 181 L65 181 Z',fill:'#d99e79',stroke:'#925d45','stroke-width':3}));
  for(const [d,thick,thin] of [
    ['M55 137 Q37 121 20 103',18,15],
    ['M77 123 Q70 86 64 53',18,15],
    ['M98 118 Q96 80 95 36',19,16],
    ['M116 121 Q122 83 128 51',18,15],
    ['M133 135 Q146 105 153 84',16,13]
  ]){
    g.append(el('path',{d,fill:'none',stroke:'#8d5d46','stroke-width':thick+3}));
    g.append(el('path',{d,fill:'none',stroke:'#f2c69f','stroke-width':thin}));
  }
  g.append(el('path',{d:'M54 133 C59 113 78 104 95 104 C119 103 139 119 143 140 C149 162 133 170 117 173 C100 177 77 170 64 159 C58 153 55 145 54 133 Z',fill:'#f2c69f',stroke:'#93624d','stroke-width':3}));
  g.append(el('path',{d:'M64 171 Q100 181 134 171 L138 182 L62 182 Z',fill:hand==='LH'?'#6cace6':'#e8985c',stroke:'#92644e','stroke-width':2}));
  g.append(el('path',{d:'M61 133 Q76 143 83 157 M109 116 Q120 131 119 146',fill:'none',stroke:'#cb926d','stroke-width':2.2,'stroke-opacity':.8}));
  for(const [x,y] of Object.values(TIP))g.append(el('ellipse',{cx:x,cy:y+2,rx:5.2,ry:3.1,fill:'#fbe4d4',stroke:'#d6a286','stroke-width':1}));
  parent.append(g);
}
export function updateFingerGuides(svg,notes,assignments,enabled,opacity=.38){
  svg?.querySelector('.piano-hand-guides')?.remove();
  if(!enabled||!svg||!assignments)return;
  const pitches=Array.isArray(notes)?notes:notes==null?[]:[notes];
  const codes=Array.isArray(assignments)?assignments:[assignments];
  const keys=new Map([...svg.querySelectorAll('.key')].map(k=>[+k.dataset.midi,k]));
  const groups={LH:[],RH:[]};
  pitches.forEach((midi,i)=>{const a=parseFingerCode(codes[i]);if(a&&keys.has(midi))groups[a.hand].push({...a,midi});});
  const layer=el('g',{class:'piano-hand-guides','pointer-events':'none','aria-label':'Illustrated piano hand guides'});
  const white=svg.querySelector('.white-keys .key'),keyW=+(white?.getAttribute('width')||49);
  for(const hand of ['LH','RH']){
    const assigned=groups[hand];if(!assigned.length)continue;
    const flip=hand==='LH',local=f=>flip?180-TIP[f][0]:TIP[f][0];
    const centre=midi=>{const k=keys.get(midi);return +k.getAttribute('x')+(+k.getAttribute('width'))/2;};
    const x0=assigned.reduce((s,a)=>s+local(a.finger),0)/assigned.length;
    const targetX=assigned.reduce((s,a)=>s+centre(a.midi),0)/assigned.length;
    const baseScale=Math.min(1.55,Math.max(.9,keyW/37));let sx=baseScale;
    if(assigned.length>1){
      const den=assigned.reduce((s,a)=>s+(local(a.finger)-x0)**2,0);
      if(den>1){const fit=assigned.reduce((s,a)=>s+(local(a.finger)-x0)*(centre(a.midi)-targetX),0)/den;
        sx=Math.max(baseScale*.72,Math.min(baseScale*1.30,fit));}
    }
    const sy=.68,tx=targetX-x0*sx;
    const desiredY=assigned.reduce((s,a)=>s+(keys.get(a.midi).classList.contains('black')?79:135),0)/assigned.length;
    const localY=assigned.reduce((s,a)=>s+TIP[a.finger][1],0)/assigned.length;
    const ty=Math.min(135,Math.max(-20,desiredY-localY*sy));
    const picture=el('g',{transform:'translate('+tx.toFixed(3)+' '+ty.toFixed(3)+') scale('+sx.toFixed(3)+' '+sy+')',opacity:Math.min(1,Math.max(0,Number(opacity)||0))});
    handArt(picture,hand);layer.append(picture);
    for(const a of assigned){
      const x=centre(a.midi),y=keys.get(a.midi).classList.contains('black')?79:135;
      const b=el('g',{class:'finger-contact-badge'});
      b.append(el('circle',{cx:x,cy:y,r:12,fill:hand==='LH'?'#2e7fd0':'#db7438',stroke:'#fff','stroke-width':2.6}));
      b.append(el('text',{x,y:y+4.4,'text-anchor':'middle','font-weight':850,'font-size':13,fill:'#fff'},String(a.finger)));layer.append(b);
    }
  }
  svg.append(layer);
}
