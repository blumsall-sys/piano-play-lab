// Isolated focus UI: uses existing lesson, MIDI, microphone and scoring handlers.
const STORE='cleos-piano-display-v31';
const el=(tag,cls='',str='')=>{const e=document.createElement(tag);e.className=cls;if(str)e.textContent=str;return e;};
export const clampLaneHeight=h=>Math.min(900,Math.max(180,Math.round(h)));
export const visibleBeatCount=n=>[6,8,12].includes(+n)?+n:8;
export function installFocusMode(ui){
  const play=ui.play,stage=play.querySelector('.falling-stage'),canvas=stage.querySelector('canvas'),keyboard=stage.querySelector('#keyboard');
  let prefs={beats:8,height:390,opacity:38};
  try{Object.assign(prefs,JSON.parse(localStorage.getItem(STORE)||'{}'));}catch{}
  prefs.beats=visibleBeatCount(prefs.beats);prefs.height=clampLaneHeight(prefs.height);
  prefs.opacity=Math.min(100,Math.max(0,Number(prefs.opacity)||0));
  const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(prefs));}catch{}};
  ui.handGuideOpacity=prefs.opacity/100;ui.highway.getBeats=()=>prefs.beats;
  const height=h=>{prefs.height=clampLaneHeight(h);play.style.setProperty('--lane-height',prefs.height+'px');save();};
  height(prefs.height);
  const controls=el('div','practice-view-controls');
  controls.innerHTML='<label class="finger-opacity-control">Hand opacity <input id="finger-opacity" type="range" min="0" max="100" step="5" value="'+prefs.opacity+'" aria-label="Hand guide opacity"><output id="finger-opacity-value">'+prefs.opacity+'%</output></label>'+
    '<label class="beats-control">Look ahead <select id="beats-visible" aria-label="Beats visible"><option value="6">6 beats</option><option value="8">8 beats</option><option value="12">12 beats</option></select></label>'+
    '<button id="focus-enter" class="btn btn-secondary focus-enter" type="button">⛶ Fullscreen practice</button>';
  play.querySelector('.highway-title').insertBefore(controls,play.querySelector('.mode-switch'));
  controls.querySelector('#beats-visible').value=String(prefs.beats);
  controls.querySelector('#beats-visible').addEventListener('change',e=>{prefs.beats=visibleBeatCount(e.target.value);save();ui.highway.draw();});
  controls.querySelector('#finger-opacity').addEventListener('input',e=>{
    prefs.opacity=+e.target.value;ui.handGuideOpacity=prefs.opacity/100;
    controls.querySelector('#finger-opacity-value').textContent=prefs.opacity+'%';save();
    const state=ui.engine.state(),notes=state.done?[]:(Array.isArray(state.target)?state.target:[state.target]);
    ui.onHandGuide?.(notes,state.done?null:state.lesson.handAssignments?.[state.position],ui.handGuidesEnabled,ui.handGuideOpacity);
  });
  const grab=el('div','highway-resize-grip','⋮⋮  Drag to resize the notes');
  grab.setAttribute('role','separator');grab.setAttribute('aria-label','Resize rhythm highway');
  grab.setAttribute('aria-orientation','horizontal');grab.tabIndex=0;stage.insertBefore(grab,keyboard);
  let drag=null;
  grab.addEventListener('pointerdown',e=>{drag={id:e.pointerId,y:e.clientY,h:canvas.getBoundingClientRect().height};grab.setPointerCapture?.(e.pointerId);e.preventDefault();});
  grab.addEventListener('pointermove',e=>{if(drag?.id===e.pointerId){height(drag.h+e.clientY-drag.y);ui.highway.draw();}});
  grab.addEventListener('pointerup',()=>{drag=null;});grab.addEventListener('pointercancel',()=>{drag=null;});
  grab.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();height(prefs.height+(e.key==='ArrowDown'?30:-30));ui.highway.draw();}});
  const hud=el('div','focus-hud');
  hud.innerHTML='<div class="focus-lesson-info"><span id="focus-title">Piano practice</span><small id="focus-progress">Ready</small></div>'+
    '<div class="focus-actions"><button id="focus-start" type="button">▶ Start</button><button id="focus-stop" type="button">■ Stop</button>'+
    '<button id="focus-hands" type="button">☝ Fingers</button><button id="focus-exit" type="button">✕ Exit</button></div>';
  play.insertBefore(hud,play.querySelector('.highway-title'));
  hud.querySelector('#focus-start').addEventListener('click',()=>document.querySelector('#rhythm-start')?.click());
  hud.querySelector('#focus-stop').addEventListener('click',()=>document.querySelector('#rhythm-stop')?.click());
  hud.querySelector('#focus-hands').addEventListener('click',()=>document.querySelector('#hand-guide-toggle')?.click());
  const overlay=el('div','focus-results');overlay.hidden=true;
  overlay.innerHTML='<div class="focus-results-card" role="dialog" aria-modal="true" aria-labelledby="focus-finish-title">'+
    '<span class="overline">LESSON COMPLETE</span><h2 id="focus-finish-title">Great work, Cleo! ★</h2><p id="focus-finish-message"></p>'+
    '<div class="focus-score-grid"><div>Accuracy <strong id="focus-accuracy">—</strong></div><div>Key presses <strong id="focus-presses">—</strong></div>'+
    '<div>Expected <strong id="focus-expected">—</strong></div><div>Extra presses <strong id="focus-wrong">—</strong></div></div>'+
    '<div class="focus-result-actions"><button id="focus-retry">↺ Try again</button><button id="focus-next">Next lesson →</button>'+
    '<button id="focus-result-exit">Exit fullscreen</button></div></div>';
  play.append(overlay);
  let focused=false,priorHeight=prefs.height;
  const restore=()=>{focused=false;document.body.classList.remove('focus-fallback');play.classList.remove('game-in-focus');overlay.hidden=true;height(priorHeight);};
  const enter=async()=>{
    if(focused)return;
    focused=true;priorHeight=prefs.height;play.classList.add('game-in-focus');document.body.classList.add('focus-fallback');
    const keyH=keyboard.getBoundingClientRect().height||200;
    height(Math.min(820,Math.max(180,window.innerHeight-keyH-92)));
    try{if(play.requestFullscreen)await play.requestFullscreen();}catch{/* CSS focus fallback */ }
    ui.highway.draw();
  };
  const exit=async({results=false}={})=>{
    if(document.fullscreenElement===play){try{await document.exitFullscreen();}catch{}}
    restore();if(results)ui.show('results');else ui.highway.draw();
  };
  document.addEventListener('fullscreenchange',()=>{if(focused&&document.fullscreenElement!==play){restore();ui.highway.draw();}});
  controls.querySelector('#focus-enter').addEventListener('click',enter);
  hud.querySelector('#focus-exit').addEventListener('click',()=>exit({results:!overlay.hidden}));
  overlay.querySelector('#focus-result-exit').addEventListener('click',()=>exit({results:true}));
  overlay.querySelector('#focus-retry').addEventListener('click',()=>{overlay.hidden=true;document.querySelector('#result-restart')?.click();ui.highway.draw();});
  overlay.querySelector('#focus-next').addEventListener('click',()=>{
    if(overlay.querySelector('#focus-next').disabled)return;
    overlay.hidden=true;document.querySelector('#result-next')?.click();ui.highway.draw();
  });
  const originalShow=ui.show.bind(ui);
  ui.show=function(name){
    if(name==='results'&&focused){
      const read=id=>document.getElementById(id)?.textContent||'—';
      overlay.querySelector('#focus-finish-message').textContent=read('result-pass-message');
      for(const [out,inside] of [['accuracy','accuracy'],['presses','attempts'],['expected','ideal'],['wrong','wrong']])
        overlay.querySelector('#focus-'+out).textContent=read('result-'+inside);
      overlay.querySelector('#focus-next').disabled=!!document.getElementById('result-next')?.disabled;
      overlay.hidden=false;hud.querySelector('#focus-progress').textContent='Lesson complete';return;
    }
    if(name!=='play'&&focused)void exit();
    return originalShow(name);
  };
  const originalSync=ui.sync.bind(ui);
  ui.sync=function(state){originalSync(state);hud.querySelector('#focus-title').textContent=state.lesson.title;
    hud.querySelector('#focus-progress').textContent=state.position+' / '+state.length+' · '+(ui.mode==='perform'?'On beat':'Learn mode');};
  ui.showFocus=enter;ui.hideFocus=exit;
  return {enter,exit,isFocus:()=>focused,get preferences(){return {...prefs};}};
}
