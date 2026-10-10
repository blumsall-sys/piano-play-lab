import {MIN_MIDI,MAX_MIDI,range,midiToName,isBlackKey} from './music.js';
const NS='http://www.w3.org/2000/svg';
function el(tag, attrs={}, text) {
  const n=document.createElementNS(NS,tag);
  for(const [k,v] of Object.entries(attrs)) n.setAttribute(k,String(v));
  if(text!==undefined) n.textContent=text;
  return n;
}
const TOP_BUTTONS_1=['Tempo+','Volume+','Record','Piano','Organ','Guitar','Mandolin','Violin','Music Box','Drum1','Drum2','Switch Drums','Demo','Compose'];
const TOP_BUTTONS_2=['Tempo−','Volume−','Play','Rumba','Waltz','Popular','Soft-rock','Samba','Disco','Drum3','Drum4','Smart Play','Teach','Pause'];
export class Keyboard {
  constructor(svg, onPlayed) {
    this.svg=svg;
    this.onPlayed=onPlayed;
    this.nodes=new Map();
    this.target=null;
    this.detected=null;
    this.labelMode='all';
    this.build();
  }
  build(){
    this.svg.replaceChildren();
    this.nodes.clear();
    const all=range();
    const white=all.filter(m=>!isBlackKey(m));
    const keyW=46, whiteH=154, blackW=28, blackH=92;
    const marginX=110, keyY=174;
    const keybedW=white.length*keyW;
    const width=marginX*2 + keybedW;
    const height=364;
    this.svg.setAttribute('viewBox',`0 0 ${width} ${height}`);

    // Body and panels
    this.svg.append(el('rect',{x:18,y:10,width:width-36,height:height-20,rx:18,class:'toy-body'}));
    this.svg.append(el('rect',{x:marginX-14,y:116,width:keybedW+28,height:206,rx:12,class:'toy-keybed'}));
    this.svg.append(el('rect',{x:30,y:36,width:70,height:286,rx:12,class:'toy-side'}));
    this.svg.append(el('rect',{x:width-100,y:36,width:70,height:286,rx:12,class:'toy-side'}));
    this.svg.append(el('text',{x:width/2,y:42,'text-anchor':'middle',class:'toy-brand'},'Toy Piano'));

    // Buttons
    const drawButtons=(labels,y)=>{
      const startX=120, bw=47, bh=21, gap=7;
      labels.forEach((label,i)=>{
        const x=startX+i*(bw+gap);
        this.svg.append(el('rect',{x,y,width:bw,height:bh,rx:7,class:'toy-btn'}));
        this.svg.append(el('text',{x:x+bw/2,y:y+bh+15,'text-anchor':'middle',class:'toy-btn-label'},label));
      });
    };
    drawButtons(TOP_BUTTONS_1,52);
    drawButtons(TOP_BUTTONS_2,90);
    this.svg.append(el('circle',{cx:width/2-160,cy:keyY+98,r:9,class:'toy-led'}));
    this.svg.append(el('text',{x:width-63,y:112,'text-anchor':'middle',class:'toy-power'},'ON'));
    this.svg.append(el('text',{x:width-63,y:145,'text-anchor':'middle',class:'toy-power'},'OFF'));
    this.svg.append(el('rect',{x:width-72,y:153,width:18,height:36,rx:9,class:'toy-switch'}));
    this.svg.append(el('circle',{cx:39+24,cy:214,r:9,class:'speaker-dot'}));
    this.svg.append(el('circle',{cx:39+24,cy:258,r:9,class:'speaker-dot'}));

    const whiteGroup=el('g'),blackGroup=el('g'),labelGroup=el('g');
    const attachKey=(midi,rect,label,noteName)=>{
      rect.classList.add('key',isBlackKey(midi)?'black':'white');
      rect.dataset.midi=String(midi);
      const group=el('g',{class:'key-group',role:'button',tabindex:0,'aria-label':`Play ${midiToName(midi)}`});
      group.append(rect);
      // Touchscreens need horizontal swiping to reach keys off screen.
      // Only trigger a note on pointer UP if no scrolling/dragging occurred.
      let start=null;
      group.addEventListener('pointerdown',event=>{
        if(event.button!==0)return;
        start={id:event.pointerId,x:event.clientX,y:event.clientY};
      });
      group.addEventListener('pointercancel',()=>{start=null;});
      group.addEventListener('pointerup',event=>{
        if(!start||start.id!==event.pointerId)return;
        const moved=Math.hypot(event.clientX-start.x,event.clientY-start.y);
        start=null;
        if(moved<=12){event.preventDefault();this.onPlayed(midi);}
      });
      group.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' ') {event.preventDefault();this.onPlayed(midi);} 
      });
      this.nodes.set(midi,{rect,group,label,noteName});
      return group;
    };

    for(const [i,midi] of white.entries()) {
      const x=marginX+i*keyW;
      const rect=el('rect',{x:x+.7,y:keyY,width:keyW-1.4,height:whiteH,rx:4});
      const noteName=midiToName(midi);
      const label=el('text',{x:x+keyW/2,y:keyY+whiteH-12,'text-anchor':'middle',class:'key-label'},noteName);
      whiteGroup.append(attachKey(midi,rect,label,noteName));
      labelGroup.append(label);
    }
    for(const midi of all.filter(isBlackKey)) {
      const earlier=white.filter(m=>m<midi).length;
      const x=marginX+earlier*keyW-(blackW/2);
      const rect=el('rect',{x,y:keyY,width:blackW,height:blackH,rx:4});
      const noteName=midiToName(midi).replace('#','♯');
      const label=el('text',{x:x+blackW/2,y:keyY+blackH-12,'text-anchor':'middle',class:'key-label dark'},noteName);
      blackGroup.append(attachKey(midi,rect,label,noteName));
      labelGroup.append(label);
    }
    this.svg.append(whiteGroup,blackGroup,labelGroup);
  }
  render(){
    for(const [midi,{rect,label,noteName}] of this.nodes) {
      rect.classList.toggle('target',midi===this.target);
      rect.classList.toggle('detected',midi===this.detected);
      const hide = this.labelMode==='none' || (this.labelMode==='c' && !noteName.startsWith('C'));
      label.style.display=hide?'none':'';
    }
  }
  setTarget(midi){
    const changed=this.target!==midi;
    this.target=midi;
    this.render();
    if(changed&&midi!==null) requestAnimationFrame(()=>this.revealTarget(midi));
  }
  revealTarget(midi){
    const area=this.svg.parentElement;
    const key=this.nodes.get(midi)?.rect;
    if(!key||area.scrollWidth<=area.clientWidth+1) return;
    const svgWidth=this.svg.getBoundingClientRect().width;
    const factor=svgWidth/this.svg.viewBox.baseVal.width;
    const center=(Number(key.getAttribute('x'))+Number(key.getAttribute('width'))/2)*factor;
    const left=Math.max(0,center-area.clientWidth/2);
    area.scrollTo({left,behavior:'smooth'});
  }
  setDetected(midi){this.detected=midi;this.render();}
  setLabels(mode){this.labelMode=mode;this.render();}
  pulse(midi){
    const found=this.nodes.get(midi);
    if(!found)return;
    found.rect.classList.add('pressed');
    clearTimeout(found.timer);
    found.timer=setTimeout(()=>found.rect.classList.remove('pressed'),320);
  }
}
