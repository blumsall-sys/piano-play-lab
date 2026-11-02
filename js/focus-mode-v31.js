// UI-only adjustable vertical highway and focused practice. Existing audio/scoring remains authoritative.
const KEY='cleos-piano-display-v31';
const node=(tag,cls='',text='')=>{const e=document.createElement(tag);e.className=cls;if(text)e.textContent=text;return e;};
export function clampLaneHeight(v){return Math.min(900,Math.max(180,Math.round(v)));}
export function visibleBeatCount(v){const n=Number(v);return [6,8,12].includes(n)?n:8;}
export function installFocusMode(ui){
 const play=ui.play,stage=play.querySelector('.falling-stage'),canvas=stage.querySelector('canvas'),keyboard=stage.querySelector('#keyboard');
 let prefs={beats:8,height:390,opacity:38};
 try{Object.assign(prefs,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{}
 prefs.beats=visibleBeatCount(prefs.beats);prefs.height=clampLaneHeight(prefs.height);prefs.opacity=Math.min(100,Math.max(0,Number(prefs.opacity)||0));
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch{}};
 ui.handGuideOpacity=prefs.opacity/100;ui.highway.getBeats=()=>prefs.beats;
 const setHeight=h=>{prefs.height=clampLaneHeight(h);play.style.setProperty('--lane-height',prefs.height+'px');save();};
 setHeight(prefs.height);
 const menu=node('div','practice-view-controls');
 menu.innerHTML='<label class="finger-opacity-control">Hand opacity <input id="finger-opacity" aria-label="Hand opacity" type="range" min="0" max="100" step="5"><output id="finger-opacity-value"></output></label><label class="beats-control">Look ahead <select id="beats-visible" aria-label="Visible upcoming beats"><option value="6">6 beats</option><option value="8">8 beats</option><option value="12">12 beats</option></select></label><button id="focus-enter" type="button" class="btn btn-secondary focus-enter">⛶ Fullscreen practice</button>';
 const heading=play.querySelector('.highway-title');heading.insertBefore(menu,heading.querySelector('.mode-switch'));
 menu.querySelector('#finger-opacity').value=String(prefs.opacity);menu.querySelector('#finger-opacity-value').textContent=prefs.opacity+'%';
 menu.querySelector('#beats-visible').value=String(prefs.beats);
 menu.querySelector('#beats-visible').addEventListener('change',e=>{prefs.beats=visibleBeatCount(e.target.value);save();ui.highway.draw();});
 menu.querySelector('#finger-opacity').addEventListener('input',e=>{
  prefs.opacity=Math.max(0,Math.min(100,Number(e.target.value)));ui.handGuideOpacity=prefs.opacity/100;save();
  menu.querySelector('#finger-opacity-value').textContent=prefs.opacity+'%';
  const state=ui.engine.state(),notes=state.done?[]:state.target;
  ui.onHandGuide?.(notes,state.lesson.handAssignments?.[state.position],ui.handGuidesEnabled,ui.handGuideOpacity);
 });
 const grab=node('div','highway-resize-grip','⋮⋮  Drag to change Highway height');
 grab.setAttribute('role','separator');grab.setAttribute('aria-label','Resize falling-note highway');grab.setAttribute('aria-orientation','horizontal');grab.tabIndex=0;
 stage.insertBefore(grab,keyboard);
 let drag=null;
 grab.addEventListener('pointerdown',e=>{drag={id:e.pointerId,y:e.clientY,height:canvas.getBoundingClientRect().height};grab.setPointerCapture?.(e.pointerId);e.preventDefault();});
 grab.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;setHeight(drag.height+e.clientY-drag.y);ui.highway.draw();});
 grab.addEventListener('pointerup',()=>{drag=null;});grab.addEventListener('pointercancel',()=>{drag=null;});
 grab.addEventListener('keydown',e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();setHeight(prefs.height+(e.key==='ArrowDown'?30:-30));}});
 const hud=node('div','focus-hud');
 hud.innerHTML='<div class="focus-lesson-info"><span id="focus-title">Piano practice</span><small id="focus-progress">Ready</small></div><div class="focus-actions"><button id="focus-start" type="button">▶ Start</button><button id="focus-stop" type="button">Ⅱ Stop</button><button id="focus-hands" type="button">☝ Fingers</button><button id="focus-exit" type="button">✕ Exit</button></div>';
 play.insertBefore(hud,heading);
 hud.querySelector('#focus-start').addEventListener('click',()=>document.getElementById('rhythm-start')?.click());
 hud.querySelector('#focus-stop').addEventListener('click',()=>document.getElementById('rhythm-stop')?.click());
 hud.querySelector('#focus-hands').addEventListener('click',()=>document.getElementById('hand-guide-toggle')?.click());
 const overlay=node('div','focus-results');overlay.hidden=true;
 overlay.innerHTML='<div class="focus-results-card" role="dialog" aria-modal="true" aria-labelledby="focus-finish-title"><span class="overline">LESSON COMPLETE</span><h2 id="focus-finish-title">Great work, Cleo! ⭐</h2><p id="focus-finish-message"></p><div class="focus-score-grid"><div>Accuracy <strong id="focus-accuracy">—</strong></div><div>Key presses <strong id="focus-presses">—</strong></div><div>Expected <strong id="focus-expected">—</strong></div><div>Extra presses <strong id="focus-wrong">—</strong></div></div><div class="focus-result-actions"><button id="focus-retry" type="button">↺ Try again</button><button id="focus-next" type="button">Next lesson →</button><button id="focus-result-exit" type="button">Exit fullscreen</button></div></div>';
 play.append(overlay);
 let focused=false,previousHeight=prefs.height,exiting=false;
 const restore=()=>{focused=false;document.body.classList.remove('focus-fallback');play.classList.remove('game-in-focus');overlay.hidden=true;setHeight(previousHeight);};
 async function enter(){
  if(focused)return;focused=true;previousHeight=prefs.height;
  play.classList.add('game-in-focus');document.body.classList.add('focus-fallback');
  const keyHeight=keyboard.getBoundingClientRect().height||220;
  setHeight(Math.min(820,Math.max(180,window.innerHeight-keyHeight-105)));
  try{if(play.requestFullscreen)await play.requestFullscreen();}catch{/* CSS-only fullscreen fallback */}
  ui.highway.draw();
 }
 async function exit({goResults=false}={}){
  if(exiting)return;exiting=true;
  const shouldShowResults=goResults;
  if(document.fullscreenElement===play){try{await document.exitFullscreen();}catch{}}
  restore();exiting=false;
  if(shouldShowResults)ui.show('results');else ui.highway.draw();
 }
 document.addEventListener('fullscreenchange',()=>{if(focused&&!exiting&&document.fullscreenElement!==play){const completed=!overlay.hidden;restore();if(completed)ui.show('results');ui.highway.draw();}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&focused&&!document.fullscreenElement){const completed=!overlay.hidden;void exit({goResults:completed});}});
 menu.querySelector('#focus-enter').addEventListener('click',enter);
 hud.querySelector('#focus-exit').addEventListener('click',()=>exit({goResults:!overlay.hidden}));
 overlay.querySelector('#focus-result-exit').addEventListener('click',()=>exit({goResults:true}));
 overlay.querySelector('#focus-retry').addEventListener('click',()=>{overlay.hidden=true;document.getElementById('result-restart')?.click();ui.highway.draw();});
 overlay.querySelector('#focus-next').addEventListener('click',()=>{if(overlay.querySelector('#focus-next').disabled)return;overlay.hidden=true;document.getElementById('result-next')?.click();ui.highway.draw();});
 const originalShow=ui.show.bind(ui);
 ui.show=function(name){
  if(name==='results'&&focused){
   const value=id=>document.getElementById(id)?.textContent||'—';
   overlay.querySelector('#focus-finish-message').textContent=value('result-pass-message');
   overlay.querySelector('#focus-accuracy').textContent=value('result-accuracy');
   overlay.querySelector('#focus-presses').textContent=value('result-attempts');
   overlay.querySelector('#focus-expected').textContent=value('result-ideal');
   overlay.querySelector('#focus-wrong').textContent=value('result-wrong');
   overlay.querySelector('#focus-next').disabled=!!document.getElementById('result-next')?.disabled;
   overlay.hidden=false;hud.querySelector('#focus-progress').textContent='Lesson complete';return;
  }
  if(name!=='play'&&focused)void exit();
  return originalShow(name);
 };
 const originalSync=ui.sync.bind(ui);
 ui.sync=function(state){originalSync(state);hud.querySelector('#focus-title').textContent=state.lesson.title;
   hud.querySelector('#focus-progress').textContent=state.position+' / '+state.length+' · '+(ui.mode==='perform'?'On beat':'Learn mode');
 };
 ui.showFocus=enter;ui.hideFocus=exit;
 return {enter,exit,isFocus:()=>focused,get preferences(){return {...prefs}}};
}