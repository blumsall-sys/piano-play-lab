import {range,midiToName,isBlackKey} from './music.js?v=1.8.1';
const NS='http://www.w3.org/2000/svg';
function el(tag, attrs={}, text){
  const node=document.createElementNS(NS,tag);
  for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));
  if(text!==undefined)node.textContent=text;
  return node;
}
export class Keyboard {
  constructor(svg,onPlayed){
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
    const keys=range();
    const white=keys.filter(m=>!isBlackKey(m));
    // Photo-matched 15 white + 10 black; 3+2+3+2 black grouping.
    const keyW=51, keyY=11, whiteHeight=202, blackW=31, blackHeight=119, margin=10;
    const width=margin*2+white.length*keyW;
    const height=keyY+whiteHeight+12;
    this.svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    this.svg.setAttribute('aria-label',`25 playable piano keys from F3 to F5`);
    const whites=el('g',{class:'white-keys'});
    const blacks=el('g',{class:'black-keys'});
    const labels=el('g',{class:'key-labels'});
    const makeKey=(midi,x,y,w,h)=>{
      const black=isBlackKey(midi);
      const noteName=midiToName(midi);
      const rect=el('rect',{x,y,width:w,height:h,rx:black?3:3.5});
      rect.classList.add('key',black?'black':'white');
      rect.dataset.midi=String(midi);
      const group=el('g',{class:'key-group',role:'button',tabindex:'0','aria-label':`Play ${noteName}`});
      group.append(rect);
      let pointer=null;
      // Tap triggers a note; dragging scrolls the piano on narrow devices.
      group.addEventListener('pointerdown',e=>{
        if(e.pointerType==='mouse'&&e.button!==0)return;
        pointer={id:e.pointerId,x:e.clientX,y:e.clientY};
      });
      group.addEventListener('pointercancel',()=>{pointer=null;});
      group.addEventListener('pointerup',e=>{
        if(!pointer||pointer.id!==e.pointerId)return;
        const moved=Math.hypot(pointer.x-e.clientX,pointer.y-e.clientY);
        pointer=null;
        if(moved<=12){e.preventDefault();this.onPlayed(midi);}
      });
      group.addEventListener('keydown',e=>{
        if(e.key==='Enter'||e.key===' '){e.preventDefault();this.onPlayed(midi);}
      });
      const label=el('text',{
        x:x+w/2,y:y+h-(black?13:15),'text-anchor':'middle',
        class:`key-label${black?' dark':''}`
      },noteName);
      this.nodes.set(midi,{rect,group,label,noteName});
      return {group,label};
    };
    for(const [index,midi] of white.entries()){
      const x=margin+index*keyW+0.65;
      const {group,label}=makeKey(midi,x,keyY,keyW-1.3,whiteHeight);
      whites.append(group);labels.append(label);
    }
    for(const midi of keys.filter(isBlackKey)){
      const earlier=white.filter(n=>n<midi).length;
      const x=margin+earlier*keyW-blackW/2;
      const {group,label}=makeKey(midi,x,keyY,blackW,blackHeight);
      blacks.append(group);labels.append(label);
    }
    this.svg.append(whites,blacks,labels);
    this.render();
  }
  render(){
    for(const [midi,{rect,label,noteName}] of this.nodes){
      rect.classList.toggle('target',midi===this.target);
      rect.classList.toggle('detected',midi===this.detected);
      label.style.display=this.labelMode==='none'||(this.labelMode==='f'&&!noteName.startsWith('F'))?'none':'';
    }
  }
  setTarget(midi){
    const changed=this.target!==midi;
    this.target=midi;
    this.render();
    if(changed&&midi!==null)requestAnimationFrame(()=>this.revealTarget(midi));
  }
  revealTarget(midi){
    const area=this.svg.parentElement;
    const key=this.nodes.get(midi)?.rect;
    if(!key||area.scrollWidth<=area.clientWidth+1)return;
    const factor=this.svg.getBoundingClientRect().width/this.svg.viewBox.baseVal.width;
    const centre=(Number(key.getAttribute('x'))+Number(key.getAttribute('width'))/2)*factor;
    area.scrollTo({left:Math.max(0,centre-area.clientWidth/2),behavior:'smooth'});
  }
  setDetected(midi){this.detected=midi;this.render();}
  setLabels(mode){this.labelMode=mode;this.render();}
  pulse(midi){
    const key=this.nodes.get(midi);
    if(!key)return;
    key.rect.classList.add('pressed');
    clearTimeout(key.timer);
    key.timer=setTimeout(()=>key.rect.classList.remove('pressed'),320);
  }
}
