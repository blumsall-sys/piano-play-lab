// Continuous, canvas-based note highway. Uses the SAME event timeline as scoring.
// Rendering never advances a lesson or records a note; the lesson engine remains authoritative.
import {eventTimeline} from './rhythm.js';
import {eventNotes} from './lesson.js';
import {midiToName} from './music.js';

export function highwayPosition({timeline,position,anchorMs,nowMs}){
  if(anchorMs!==null&&Number.isFinite(anchorMs))return (nowMs-anchorMs)/timeline.beatMs;
  return timeline.events[Math.min(position,timeline.events.length-1)]?.startBeat ?? 0;
}
export class RhythmHighway {
  constructor(canvas,{getState,getSession,getTempo,isVisible}){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');
    this.getState=getState;this.getSession=getSession;this.getTempo=getTempo;this.isVisible=isVisible;
    this.active=true;this.frame=this.frame.bind(this);this.resize=()=>this.draw();
    this.observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(this.resize):null;
    this.observer?.observe(canvas);
    this.raf=requestAnimationFrame(this.frame);
  }
  frame(){if(!this.active)return;if(this.isVisible())this.draw();this.raf=requestAnimationFrame(this.frame);}
  draw(){
    const state=this.getState();if(!state?.lesson)return;
    const canvas=this.canvas,ctx=this.ctx;
    const width=Math.max(canvas.clientWidth,320),height=Math.max(canvas.clientHeight,130);
    const dpr=Math.min(devicePixelRatio||1,2);
    if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    ctx.fillStyle='#101d33';ctx.fillRect(0,0,width,height);
    const session=this.getSession(),{bpm,speed}=this.getTempo();
    let timeline;
    try{timeline=session?.timeline||eventTimeline(state.lesson,bpm,speed);}catch{return;}
    const currentBeat=highwayPosition({timeline,position:state.position,anchorMs:session?.anchorMs??null,nowMs:performance.now()});
    const pixelsPerBeat=Math.max(90,Math.min(142,width/5.8));
    const hitX=Math.min(224,width*.24),y0=34,blockY=55,blockH=height-73;
    // Beat grid follows the musical clock; only the key names move along the highway.
    const startBeat=Math.max(-4,Math.floor(currentBeat-hitX/pixelsPerBeat)-1);
    for(let beat=startBeat;beat<currentBeat+(width-hitX)/pixelsPerBeat+2;beat++){
      const x=hitX+(beat-currentBeat)*pixelsPerBeat;
      if(x<-3||x>width+3)continue;
      ctx.strokeStyle=beat%4===0?'#365376':'#243c58';ctx.lineWidth=beat%4===0?1.6:1;
      ctx.beginPath();ctx.moveTo(x,23);ctx.lineTo(x,height-12);ctx.stroke();
      ctx.fillStyle=beat%4===0?'#adc7e0':'#587392';ctx.font='11px system-ui';ctx.fillText(`BEAT ${beat+1}`,x+5,20);
    }
    const loop=session?.loopPractice;
    // Render successive complete copies of the score on one continuous clock.
    // The four-beat empty measures are visible between runs.
    const passes=loop?.passes??1;
    for(let pass=0;pass<passes;pass++){
      const base=loop?loop.startBeat(pass):0;
      if(loop&&pass>0){
        const restX=hitX+(loop.endBeat(pass-1)-currentBeat)*pixelsPerBeat;
        const restW=loop.restBeats*pixelsPerBeat;
        if(restX+restW>0&&restX<width){
          ctx.fillStyle='rgba(93,125,167,.14)';ctx.fillRect(restX,blockY,restW,blockH);
          ctx.fillStyle='#b5c8de';ctx.font='700 14px system-ui';ctx.textAlign='center';
          ctx.fillText('REST · 4 BEATS',restX+restW/2,blockY+blockH/2,restW-10);
        }
      }
    timeline.events.forEach(event=>{
      const x=hitX+(base+event.startBeat-currentBeat)*pixelsPerBeat;
      const w=Math.max(42,event.durationBeats*pixelsPerBeat-7);
      if(x+w<0||x>width)return;
      const passed=loop?(pass<loop.passIndex || (pass===loop.passIndex&&event.index<state.position)):event.index<state.position;
      const current=loop?(pass===loop.passIndex&&loop.phase==='playing'&&event.index===state.position):event.index===state.position;
      let color=passed?'#2c9d88':current?'#ffce6c':'#c9e0f1';
      ctx.globalAlpha=passed?.62:1;
      ctx.fillStyle=color;
      ctx.beginPath();ctx.roundRect(x,blockY,w,blockH,10);ctx.fill();
      ctx.fillStyle=passed?'#eafff8':'#16273d';
      const notes=eventNotes(state.lesson.notes[event.index]);
      ctx.font=`${notes.length>2?'700 13px':'800 16px'} system-ui`;
      ctx.textAlign='center';
      const title=notes.length===1?midiToName(notes[0]).replace('#','♯'):notes.map(n=>midiToName(n).replace('#','♯')).join(' + ');
      if(notes.length<=2||w>=128){
        const parts=notes.length>1?notes.map(n=>midiToName(n).replace('#','♯')):[title];
        const gap=Math.min(22,blockH/(parts.length+1));
        parts.forEach((part,i)=>ctx.fillText(part,x+w/2,blockY+blockH/2+(i-(parts.length-1)/2)*gap+5,w-8));
      }else{
        notes.forEach((m,i)=>ctx.fillText(midiToName(m).replace('#','♯'),x+w/2,blockY+19+i*17,w-8));
      }
      ctx.globalAlpha=1;
      if(current){ctx.strokeStyle='#fff6d4';ctx.lineWidth=2;ctx.stroke();}
    });
    }
    if(loop){
      ctx.fillStyle='#dceefd';ctx.font='800 12px system-ui';ctx.textAlign='right';
      ctx.fillText(`TRY ${loop.passIndex+1} / ${loop.passes}`,width-14,19);
    }
    const nowX=hitX;
    ctx.shadowColor='#5ce6ed';ctx.shadowBlur=12;ctx.strokeStyle='#65f0ee';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(nowX,25);ctx.lineTo(nowX,height-10);ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle='#65f0ee';ctx.beginPath();ctx.moveTo(nowX-9,31);ctx.lineTo(nowX+9,31);ctx.lineTo(nowX,41);ctx.closePath();ctx.fill();
    ctx.fillStyle='#d8faff';ctx.font='700 11px system-ui';ctx.textAlign='center';ctx.fillText('PLAY',nowX,13);
    if(session?.anchorMs&&performance.now()<session.anchorMs){
      const count=Math.max(1,Math.ceil((session.anchorMs-performance.now())/timeline.beatMs));
      ctx.fillStyle='rgba(12,24,43,.82)';ctx.fillRect(0,0,width,height);
      ctx.textAlign='center';ctx.fillStyle='#fff3cc';ctx.font='800 42px system-ui';ctx.fillText(String(count),width/2,height/2+14);
      ctx.fillStyle='#acbed4';ctx.font='600 13px system-ui';ctx.fillText('Get ready!',width/2,height/2+38);
    }
    ctx.textAlign='start';
  }
  destroy(){this.active=false;cancelAnimationFrame(this.raf);this.observer?.disconnect();}
}
