// Vertical falling notes: view-only; all scoring stays in the original lesson engine.
import {eventTimeline} from './rhythm.js';
import {eventNotes} from './lesson.js';
import {midiToName} from './music.js';
export function highwayPosition({timeline,position,anchorMs,nowMs}){
  return anchorMs!==null&&Number.isFinite(anchorMs)
    ?(nowMs-anchorMs)/timeline.beatMs
    :(timeline.events[Math.min(position,timeline.events.length-1)]?.startBeat??0);
}
export function fingerAssignment(lesson,index,noteIndex){
  const a=lesson?.handAssignments?.[index];
  const item=Array.isArray(a)?a[noteIndex]:a;
  const m=typeof item==='string'?/^(LH|RH)([1-5])$/i.exec(item.trim()):null;
  return m?{hand:m[1].toUpperCase(),finger:Number(m[2])}:null;
}
export function mapNoteX(svg,midi,width){
  if(!svg||!Number.isFinite(width))return null;
  const rect=[...svg.querySelectorAll('.key')].find(el=>Number(el.dataset.midi)===midi);
  const view=svg.viewBox?.baseVal;
  return !rect||!view?.width?null:(Number(rect.getAttribute('x'))+
    Number(rect.getAttribute('width'))/2-view.x)*width/view.width;
}
const HAND={LH:'#67b4ff',RH:'#ffab6e',neutral:'#e8cf89'};
export class RhythmHighway{
  constructor(canvas,{getState,getSession,getTempo,isVisible,getKeyboard}={}){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');
    this.getState=getState;this.getSession=getSession;this.getTempo=getTempo;
    this.isVisible=isVisible;this.getKeyboard=getKeyboard||(()=>document.querySelector('#keyboard'));
    this.active=true;this.frame=this.frame.bind(this);
    this.observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(()=>this.draw()):null;
    this.observer?.observe(canvas);this.raf=requestAnimationFrame(this.frame);
  }
  frame(){if(!this.active)return;if(this.isVisible())this.draw();this.raf=requestAnimationFrame(this.frame);}
  draw(){
    const state=this.getState?.();if(!state?.lesson)return;
    const canvas=this.canvas,ctx=this.ctx,width=Math.max(canvas.clientWidth||0,320),height=Math.max(canvas.clientHeight||0,160);
    const dpr=Math.min(typeof devicePixelRatio==='number'?devicePixelRatio:1,2);
    if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);ctx.fillStyle='#0c1729';ctx.fillRect(0,0,width,height);
    const session=this.getSession?.(),{bpm,speed}=this.getTempo?.()||{bpm:80,speed:1};
    let timeline;try{timeline=session?.timeline||eventTimeline(state.lesson,bpm,speed);}catch{return;}
    const loop=session?.loopPractice;
    const guided=loop?.guided?(loop.phase==='rest'?timeline.totalBeats:(timeline.events[Math.min(state.position,timeline.events.length-1)]?.startBeat??timeline.totalBeats)):null;
    const now=performance.now();
    const currentBeat=loop?.guided?loop.startBeat()+guided:highwayPosition({timeline,position:state.position,anchorMs:session?.anchorMs??null,nowMs:now});
    const lookahead=[6,8,12].includes(Number(this.getBeats?.()))?Number(this.getBeats()):8;
    const hitY=height-17,px=(height-42)/lookahead;
    for(let beat=Math.max(-4,Math.floor(currentBeat)-1);beat<currentBeat+lookahead+2;beat++){
      const y=hitY-(beat-currentBeat)*px;if(y<-3||y>height+3)continue;
      ctx.strokeStyle=beat%4===0?'#406080':'#213952';ctx.lineWidth=beat%4===0?1.5:1;
      ctx.beginPath();ctx.moveTo(12,y);ctx.lineTo(width-10,y);ctx.stroke();
      ctx.fillStyle=beat%4===0?'#d8e4f5':'#66829e';ctx.font='10px system-ui';ctx.textAlign='left';ctx.fillText(String(beat+1),5,Math.max(12,y-4));
    }
    const keyboard=this.getKeyboard(),passes=loop?.passes??1;
    for(let pass=0;pass<passes;pass++){
      const base=loop?loop.startBeat(pass):0;
      if(loop&&pass>0){
        const first=loop.endBeat(pass-1),yEnd=hitY-(first-currentBeat)*px,yStart=hitY-(first+loop.restBeats-currentBeat)*px;
        if(yEnd>0&&yStart<height){
          const top=Math.max(0,yStart),bottom=Math.min(height,yEnd);
          if(bottom>top){ctx.fillStyle='rgba(98,133,171,.23)';ctx.fillRect(0,top,width,bottom-top);}
          ctx.fillStyle='#cbdbee';ctx.font='800 13px system-ui';ctx.textAlign='center';ctx.fillText('REST · 1 BAR',width/2,Math.max(20,Math.min(height-9,(yEnd+yStart)/2)));
        }
      }
      for(const event of timeline.events){
        const yHead=hitY-(base+event.startBeat-currentBeat)*px,tail=Math.max(18,event.durationBeats*px-5);
        if(yHead<-tail||yHead>height+tail)continue;
        const notes=eventNotes(state.lesson.notes[event.index]);
        const passed=loop?(pass<loop.passIndex||(pass===loop.passIndex&&event.index<state.position)):event.index<state.position;
        const current=loop?(pass===loop.passIndex&&loop.phase==='playing'&&event.index===state.position):event.index===state.position;
        for(let n=0;n<notes.length;n++){
          const midi=notes[n],cx=mapNoteX(keyboard,midi,width);if(cx===null)continue;
          const assign=fingerAssignment(state.lesson,event.index,n);
          const whiteCount=keyboard?.querySelectorAll('.white-keys .key').length||15;
          const w=Math.max(21,Math.min(47,width/whiteCount*.80));
          const x=Math.max(1,Math.min(width-w-1,cx-w/2)),y=Math.max(0,yHead-tail),h=Math.min(tail,height-y);
          if(h<=0)continue;
          ctx.globalAlpha=passed?.32:1;ctx.fillStyle=current?'#f8d475':HAND[assign?.hand||'neutral'];
          ctx.shadowColor=current?'#ffdc85':'transparent';ctx.shadowBlur=current?10:0;
          ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(8,w/4));ctx.fill();ctx.shadowBlur=0;
          ctx.strokeStyle=passed?'#4a667d':'#effaff';ctx.lineWidth=current?1.5:.7;ctx.stroke();ctx.globalAlpha=1;
          const ty=Math.max(14,Math.min(height-9,yHead-10));
          if(ty>0&&ty<height-3){
            ctx.textAlign='center';ctx.fillStyle='#142338';ctx.font='800 12px system-ui';
            ctx.fillText(midiToName(midi).replace('#','♯'),x+w/2,ty,w-2);
            if(assign&&h>=45){ctx.font='800 10px system-ui';ctx.fillText((assign.hand==='LH'?'L':'R')+assign.finger,x+w/2,Math.max(10,ty-16),w-3);}
          }
        }
      }
    }
    ctx.globalAlpha=1;ctx.shadowColor='#6cf0ed';ctx.shadowBlur=10;ctx.strokeStyle='#63f4ee';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(0,hitY);ctx.lineTo(width,hitY);ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle='#d8ffff';ctx.textAlign='left';ctx.font='800 12px system-ui';ctx.fillText('PLAY ↓',12,height-29);
    if(loop){ctx.fillStyle='#dceefd';ctx.font='800 11px system-ui';ctx.textAlign='right';ctx.fillText('TRY '+Math.min(loop.passIndex+1,loop.passes)+' / '+loop.passes,width-12,17);}
    if(session?.anchorMs&&now<session.anchorMs){
      const count=Math.max(1,Math.ceil((session.anchorMs-now)/timeline.beatMs));
      ctx.fillStyle='rgba(12,24,43,.78)';ctx.fillRect(0,0,width,height);
      ctx.textAlign='center';ctx.fillStyle='#fff3cc';ctx.font='800 40px system-ui';ctx.fillText(String(count),width/2,height/2+14);
      ctx.fillStyle='#acbed4';ctx.font='600 13px system-ui';ctx.fillText('Get ready!',width/2,height/2+36);
    }
    ctx.textAlign='start';
  }
  destroy(){this.active=false;cancelAnimationFrame(this.raf);this.observer?.disconnect();}
}
