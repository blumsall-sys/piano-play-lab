// Application navigation, kid-friendly lesson map and three-checkpoint learning flow.
// Audio, keyboard, score grading and MIDI remain in the v2.1 modules.
import {loadHistory} from './progress-store.js';
import {RhythmHighway} from './rhythm-highway.js';
const KEY='cleos-piano-play-v2.2-settings';
const ACTIVE_KEY='cleos-piano-play-v2.2-active';
const PASS=70;
const $=id=>document.getElementById(id);
const html=s=>s.replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const create=(tag,cls='',markup='')=>{const n=document.createElement(tag);n.className=cls;n.innerHTML=markup;return n;};
export function checkpoints(state){
  const n=state.length||1;
  return [
    {label:'Discover',start:0,end:Math.ceil(n/3),done:state.position>=Math.ceil(n/3)},
    {label:'Practice',start:Math.ceil(n/3),end:Math.ceil(2*n/3),done:state.position>=Math.ceil(2*n/3)},
    {label:'Perform',start:Math.ceil(2*n/3),end:n,done:state.done}
  ];
}
export function unlockedThrough(lessons,history,unlockAll=false){
  if(unlockAll)return lessons.length;
  let count=1;
  for(let i=0;i<lessons.length-1;i++){
    if(history.some(h=>h.lessonId===lessons[i].id&&h.keyAccuracy>=PASS&&h.loopPassed!==false))count++;
    else break;
  }
  return count;
}
// Save only gameplay progress (no audio/video or identifying information).
export function restoreActive(engine){
  try{
    const data=JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null');
    if(!data||typeof data.lessonId!=='string')return false;
    const index=engine.lessons.findIndex(l=>l.id===data.lessonId);
    if(index<0||index>=unlockedThrough(engine.lessons,loadHistory()))return false;
    const max=engine.lessons[index].notes.length;
    if(!Number.isInteger(data.position)||data.position<0||data.position>=max)return false;
    engine.select(data.lessonId);engine.position=data.position;
    engine.attempts=Number.isInteger(data.attempts)?Math.max(0,data.attempts):0;
    engine.correctPresses=Number.isInteger(data.correctPresses)?Math.max(0,data.correctPresses):0;
    engine.wrongPresses=Number.isInteger(data.wrongPresses)?Math.max(0,data.wrongPresses):0;
    // An in-progress chord is restarted at its beginning after reloading.
    engine.collected.clear();
    return true;
  }catch{return false;}
}
export function saveActive(state){
  try{
    if(state.done){localStorage.removeItem(ACTIVE_KEY);return;}
    localStorage.setItem(ACTIVE_KEY,JSON.stringify({
      lessonId:state.lesson.id,position:state.position,attempts:state.summary.attempts,
      correctPresses:state.summary.correctPresses,wrongPresses:state.summary.wrongPresses
    }));
  }catch{}
}
export class GameUI{
  constructor({engine,chooseLesson,onModeChange,onNavigate,onPageChange,getSession,getTempo,onNarrate}){
    this.engine=engine;this.chooseLesson=chooseLesson;this.onModeChange=onModeChange;
    this.onNavigate=onNavigate;this.onPageChange=onPageChange;this.getSession=getSession;this.getTempo=getTempo;this.onNarrate=onNarrate;
    this.settings={unlockAll:false};
    try{Object.assign(this.settings,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{}
    this.view='home';this.makeLayout();this.wire();
    this.highway=new RhythmHighway($('highway-canvas'),{
      getState:()=>this.engine?.state(),getSession, getTempo,isVisible:()=>this.view==='play'
    });
    this.sync(this.engine.state());this.show('home');
  }
  makeLayout(){
    const main=document.querySelector('.app-shell main');
    const header=document.querySelector('.site-header');
    header.innerHTML=`<button type="button" class="brand-title" data-page="home"><span class="brand-note">♫</span> <span>Cleo's <b>Piano Play Lab</b></span></button>
      <nav class="game-nav" aria-label="Main navigation"><button data-page="home">Home</button><button data-page="map">Lessons</button><button data-page="play">Practice</button><button data-page="settings">Settings</button></nav>`;
    const lesson=$('lesson-select').closest('.lesson-top');
    const rhythm=$('rhythm-start').closest('.rhythm-panel');
    const piano=$('keyboard').closest('.piano-panel');
    const results=$('results-screen');
    const history=$('history-list').closest('.history-panel');
    const lower=document.querySelector('.lower-grid');
    const guide=lesson.querySelector('.voice-guide');
    const mic=piano.querySelector('.mic-tools'),calibration=piano.querySelector('.calibration-panel');
    const chord=piano.querySelector('.chord-guide');
    const camera=lower.querySelector('.camera-panel');
    const how=lower.querySelector('.learn-panel');
    const welcome=document.querySelector('.welcome');
    welcome?.remove(); lower?.remove();
    const home=create('section','game-page home-page',`<div class="home-hero"><div><span class="overline">WELCOME TO YOUR MUSIC ADVENTURE</span><h1>Hey Cleo! Ready to <em>make music?</em></h1><p>Listen. Play. Learn. Every little note is a big win.</p><div class="home-actions"><button class="hero-button" id="home-continue">▶ Continue playing</button><button class="btn btn-secondary" data-page="map">Explore lessons</button></div><div id="home-stats" class="home-stats"></div></div><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NzAgMjcwIiByb2xlPSJpbWciIGFyaWEtbGFiZWw9IkNvbG91cmZ1bCBtdXNpYyBub3RlcyByaXNpbmcgYWJvdmUgYSBwaWFubyI+CiA8ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9InciIHgyPSIuMiIgeTI9IjEiPjxzdG9wIHN0b3AtY29sb3I9IiNmZmYiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNmMWY3ZjQiLz48L2xpbmVhckdyYWRpZW50PjxmaWx0ZXIgaWQ9InNoYWRvdyIgeD0iLTMwJSIgeT0iLTMwJSIgd2lkdGg9IjE2MCUiIGhlaWdodD0iMTYwJSI+PGZlRHJvcFNoYWRvdyBkeD0iMCIgZHk9IjkiIHN0ZERldmlhdGlvbj0iOCIgZmxvb2QtY29sb3I9IiM1MzZjNjIiIGZsb29kLW9wYWNpdHk9Ii4xNCIvPjwvZmlsdGVyPjwvZGVmcz4KIDxlbGxpcHNlIGN4PSIyNDciIGN5PSIyMjUiIHJ4PSIxOTYiIHJ5PSIyMSIgZmlsbD0iI2VmZTBjNCIgb3BhY2l0eT0iLjU1Ii8+CiA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0MiAxMzkpIHJvdGF0ZSgtOCAyMDUgNTIpIiBmaWx0ZXI9InVybCgjc2hhZG93KSI+CiAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjM4OCIgaGVpZ2h0PSIxMTAiIHJ4PSIxNCIgZmlsbD0iIzMxM2E0NyIvPgogIDxyZWN0IHg9IjkiIHk9IjgiIHdpZHRoPSIzNzAiIGhlaWdodD0iOTEiIHJ4PSI1IiBmaWxsPSIjZjhmOGYyIi8+CiAgPGcgc3Ryb2tlPSIjOWNhOWFhIiBzdHJva2Utd2lkdGg9IjEuMyIgZmlsbD0idXJsKCN3KSI+CiAgIDxwYXRoIGQ9Ik0xMCA4aDMwdjkxSDEwek00MCA4aDMwdjkxSDQwek03MCA4aDMwdjkxSDcwek0xMDAgOGgzMHY5MWgtMzB6TTEzMCA4aDMwdjkxaC0zMHpNMTYwIDhoMzB2OTFoLTMwek0xOTAgOGgzMHY5MWgtMzB6TTIyMCA4aDMwdjkxaC0zMHpNMjUwIDhoMzB2OTFoLTMwek0yODAgOGgzMHY5MWgtMzB6TTMxMCA4aDMwdjkxaC0zMHpNMzQwIDhoMzB2OTFoLTMweiIvPgogIDwvZz4KICA8cmVjdCB4PSIzMCIgeT0iOCIgd2lkdGg9IjE5IiBoZWlnaHQ9IjU3IiByeD0iMyIgZmlsbD0iIzMwM2I0OCIvPjxyZWN0IHg9IjYwIiB5PSI4IiB3aWR0aD0iMTkiIGhlaWdodD0iNTciIHJ4PSIzIiBmaWxsPSIjMzAzYjQ4Ii8+PHJlY3QgeD0iMTIwIiB5PSI4IiB3aWR0aD0iMTkiIGhlaWdodD0iNTciIHJ4PSIzIiBmaWxsPSIjMzAzYjQ4Ii8+PHJlY3QgeD0iMTUwIiB5PSI4IiB3aWR0aD0iMTkiIGhlaWdodD0iNTciIHJ4PSIzIiBmaWxsPSIjMzAzYjQ4Ii8+PHJlY3QgeD0iMTgwIiB5PSI4IiB3aWR0aD0iMTkiIGhlaWdodD0iNTciIHJ4PSIzIiBmaWxsPSIjMzAzYjQ4Ii8+PHJlY3QgeD0iMjQwIiB5PSI4IiB3aWR0aD0iMTkiIGhlaWdodD0iNTciIHJ4PSIzIiBmaWxsPSIjMzAzYjQ4Ii8+PHJlY3QgeD0iMjcwIiB5PSI4IiB3aWR0aD0iMTkiIGhlaWdodD0iNTciIHJ4PSIzIiBmaWxsPSIjMzAzYjQ4Ii8+PHJlY3QgeD0iMzMwIiB5PSI4IiB3aWR0aD0iMTkiIGhlaWdodD0iNTciIHJ4PSIzIiBmaWxsPSIjMzAzYjQ4Ii8+CiAgPHJlY3QgeD0iMTYxIiB5PSI2NiIgd2lkdGg9IjI3IiBoZWlnaHQ9IjMyIiBmaWxsPSIjZmZjYTVlIiBvcGFjaXR5PSIuOCIvPgogPC9nPgogPGcgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxNjIgMzIpIHJvdGF0ZSgtMTIpIj48cGF0aCBkPSJNMyA0M1YzbDQzLTl2NDIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2VlOWIzNSIgc3Ryb2tlLXdpZHRoPSI5Ii8+PGVsbGlwc2UgY3g9Ii04IiBjeT0iNDUiIHJ4PSIxNiIgcnk9IjEwIiB0cmFuc2Zvcm09InJvdGF0ZSgtMjMgLTggNDUpIiBmaWxsPSIjZWU5YjM1Ii8+PGVsbGlwc2UgY3g9IjM1IiBjeT0iMzgiIHJ4PSIxNiIgcnk9IjEwIiB0cmFuc2Zvcm09InJvdGF0ZSgtMjMgMzUgMzgpIiBmaWxsPSIjZWU5YjM1Ii8+PC9nPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDMwMSAyNykgcm90YXRlKDE3KSI+PHBhdGggZD0iTTggNjRWNEw0Ni00djQ2IiBmaWxsPSJub25lIiBzdHJva2U9IiMyMGE4OTciIHN0cm9rZS13aWR0aD0iOCIvPjxlbGxpcHNlIGN4PSItMyIgY3k9IjY1IiByeD0iMTUiIHJ5PSIxMCIgdHJhbnNmb3JtPSJyb3RhdGUoLTI1IC0zIDY1KSIgZmlsbD0iIzIwYTg5NyIvPjxlbGxpcHNlIGN4PSIzNSIgY3k9IjQ1IiByeD0iMTUiIHJ5PSIxMCIgdHJhbnNmb3JtPSJyb3RhdGUoLTI1IDM1IDQ1KSIgZmlsbD0iIzIwYTg5NyIvPjwvZz4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMDAgOTEpIHJvdGF0ZSgtMTIpIj48cGF0aCBkPSJNMCAzOFYzTDIwIC0xIiBmaWxsPSJub25lIiBzdHJva2U9IiM4MTk2ZTAiIHN0cm9rZS13aWR0aD0iNyIvPjxlbGxpcHNlIGN4PSItMTEiIGN5PSI0MSIgcng9IjEzIiByeT0iOC41IiB0cmFuc2Zvcm09InJvdGF0ZSgtMjAgLTExIDQxKSIgZmlsbD0iIzgxOTZlMCIvPjwvZz4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzODUgODApIHJvdGF0ZSgxNSkiPjxwYXRoIGQ9Ik0wIDM2VjFMMjEtMiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjE4ZTdhIiBzdHJva2Utd2lkdGg9IjciLz48ZWxsaXBzZSBjeD0iLTEwIiBjeT0iMzkiIHJ4PSIxMiIgcnk9IjgiIHRyYW5zZm9ybT0icm90YXRlKC0yMCAtMTAgMzkpIiBmaWxsPSIjZjE4ZTdhIi8+PC9nPgogIDxwYXRoIGQ9Im0xMTIgMTUgNSA5IDEwIDItMTAgNC01IDEwLTQtMTAtMTAtNCAxMC0yeiIgZmlsbD0iI2YwYjQ0MSIvPjxwYXRoIGQ9Im0zODggMTUgMyA2IDcgMi03IDMtMyA3LTMtNy03LTMgNy0yeiIgZmlsbD0iIzI2YWE5OSIvPjxjaXJjbGUgY3g9IjI1NiIgY3k9IjczIiByPSI1IiBmaWxsPSIjZjQ5ZThhIi8+PGNpcmNsZSBjeD0iODgiIGN5PSI2OCIgcj0iNSIgZmlsbD0iIzlhOTlkYyIvPgogPC9nPgo8L3N2Zz4K" alt="Happy floating music notes"></div><section class="home-next panel"><span class="overline">UP NEXT</span><h2 id="home-lesson-title">Find the First F</h2><p>Try a new note and earn your stars.</p><button class="btn btn-primary" id="home-start">Play this lesson →</button></section>`);
    home.id='screen-home';
    const map=create('section','game-page map-page',`<div class="page-title"><span class="overline">YOUR MUSICAL JOURNEY</span><h1>Choose your adventure</h1><p>Finish each lesson with at least ${PASS}% note accuracy to unlock the next one. You can always try again.</p></div><div id="lesson-map" class="lesson-map"></div>`);
    map.id='screen-map';map.append(history);
    const play=create('section','game-page game-player',`<div class="player-topbar"><div><span class="overline">NOW PLAYING · <span id="player-lesson-number">LESSON 1</span></span><h2 id="player-lesson-title">Find the First F</h2></div><div class="player-actions"><span id="player-stars">☆ ☆ ☆</span><button class="btn btn-secondary" id="game-narrate">🔊 Hear Cleo's instructions</button><button class="btn btn-secondary" data-page="map">✕ Exit</button></div></div><div id="lesson-checkpoints" class="checkpoint-track" aria-label="Lesson checkpoints"></div><div class="highway-title"><div><span class="overline">RHYTHM HIGHWAY</span><p>Read ahead: notes travel toward the <b>PLAY</b> line.</p></div><div id="mode-switch" class="mode-switch" role="group" aria-label="Practice mode"><button type="button" data-mode="learn" aria-pressed="true">Learn · no timer</button><button type="button" data-mode="perform" aria-pressed="false">Perform · on beat</button></div></div>`);
    play.id='screen-play';
    const highwayBox=create('div','highway-box',`<canvas id="highway-canvas" height="180" aria-label="Scrolling rhythm highway displaying note names, chords, and durations"></canvas><div class="highway-key"><span class="dot gold"></span> Current <span class="dot blue"></span> Upcoming <span class="dot green"></span> Completed</div>`);
    // Rhythm controls ABOVE the notes; notes sit immediately above the piano.
    play.append(lesson,rhythm,highwayBox,piano);
    // Keep the key colour guide next to the highway's beat legend, not above the piano.
    const redundantHeading=piano.querySelector('.section-heading');
    const keyLegend=redundantHeading?.querySelector('.legend');
    if(keyLegend){keyLegend.classList.add('piano-mini-legend');highwayBox.querySelector('.highway-key').append(keyLegend);}
    redundantHeading?.remove();
    const accessibleTitle=create('span','sr-only','Interactive piano keys');
    accessibleTitle.id='piano-title';piano.prepend(accessibleTitle);
    // Add quick volume adjustment without cluttering the key/timeline view.
    const volumeDetails=create('details','quick-sound-mix',`<summary>🔊 Sound levels</summary><div class="mix-sliders" id="quick-mix-sliders"></div>`);
    piano.querySelector('.controls-row').after(volumeDetails);
    // Narration is the first button in the main teaching row, not a distant header button.
    piano.querySelector('.controls-row').prepend(play.querySelector('#game-narrate'));
    const practiceConnect=create('button','btn btn-primary midi-practice-connect','🔌 Connect USB MIDI');
    practiceConnect.id='midi-practice-connect';practiceConnect.type='button';practiceConnect.hidden=true;
    piano.querySelector('.controls-row').insertBefore(practiceConnect,piano.querySelector('#demo-button'));
    play.insertBefore(lesson,play.querySelector('.highway-title'));
    const settings=create('section','game-page settings-page',`<div class="page-title"><span class="overline">MAKE IT YOUR OWN</span><h1>Settings & helpers</h1><p>Keep the game simple. Set up the microphone, lesson voice, piano calibration and chord options here.</p></div><section class="setting-intro panel"><label class="rhythm-toggle"><input id="unlock-all-lessons" type="checkbox"> Unlock all lessons for testing</label><p class="subtle">Turn this on if you're testing advanced lessons before completing the earlier ones. Progress is still recorded normally.</p></section>`);
    settings.id='screen-settings';
    const instrument=create('section','setting-card instrument-setup',`<span class="overline">YOUR INSTRUMENT</span><h2>Choose your piano</h2>
      <p class="subtle">This changes the on-screen key layout and practice input. Your original Hape piano remains the default.</p>
      <label class="instrument-field" for="instrument-layout">Keyboard layout<select id="instrument-layout">
        <option value="hape">Hape toy piano · 25 keys · F3–F5</option>
        <option value="maudio">M-Audio Keystation Mini 32 MK3 · 32 keys</option></select></label>
      <div class="midi-setup-options" id="midi-setup-options" hidden>
        <p class="subtle">Connect the M-Audio with USB. It sends MIDI data, not audio. Use Chrome on Windows first; Web MIDI may not be available on every Android tablet.</p>
        <div class="midi-connect-slot"></div>
        <div class="midi-connection-tools"><button class="btn btn-secondary" id="midi-rescan" type="button">↻ Scan / reconnect</button><span id="midi-connection-state" class="midi-connection-state" role="status" aria-live="polite">Not connected · grant MIDI permission</span></div>
        <p id="midi-browser-diagnostics" class="subtle">MIDI browser check pending.</p>
        <p class="subtle">No connection? <a href="./midi-test.html" target="_blank" rel="noopener">Open the independent MIDI connection test</a> to check Chrome and the USB keyboard.</p>
        <p id="midi-last-event" class="midi-last-event" role="status" aria-live="polite">No MIDI messages received. Connect, then press a physical key.</p>
        <label class="instrument-field" for="midi-input-device">MIDI input device<select id="midi-input-device"><option value="">Auto-select M-Audio</option></select></label>
        <div class="midi-key-check"><button type="button" class="btn btn-secondary" id="midi-learn-first-c">Identify leftmost C key</button>
          <label class="instrument-field" for="midi-first-c">Display starts at <select id="midi-first-c">
             <option value="36">C2</option><option value="48" selected>C3</option><option value="60">C4</option><option value="72">C5</option></select></label></div>
        <label class="instrument-check"><input id="midi-enable-sound" type="checkbox" checked> Play piano sounds when MIDI keys are pressed</label>
        <p id="midi-live-status" class="midi-live-status" role="status" aria-live="polite">Connect MIDI, then press the leftmost C key to confirm the octave.</p>
        <div id="midi-status-slot"></div>
        <p class="subtle">For most of Cleo's lessons, the physical octave buttons should be at zero. If the keyboard plays the wrong octave, reset them by pressing both octave buttons together.</p>
      </div>`);
    settings.append(instrument);
    const soundSettings=create('section','setting-card audio-mix-settings',`<span class="overline">SOUND BALANCE</span><h2>Keyboard & chime volumes</h2><p class="subtle">Make the MIDI piano easy to hear while keeping success chimes gentle. Both controls are also available under Sound levels when practicing.</p><div class="mix-sliders" id="settings-mix-sliders"></div>`);
    settings.append(soundSettings);
    instrument.querySelector('.midi-connect-slot').append($('midi-button'));
    instrument.querySelector('#midi-status-slot').append($('midi-status'));
    for(const section of [guide,mic,calibration,chord,camera,how]){
      section.classList.add('setting-card');settings.append(section);
    }
    const done=create('section','game-page result-page',`<div class="result-heading"><span class="overline">YOU DID IT!</span><h1>Wonderful playing, Cleo! ✨</h1><p>Every time you practice, you get a little stronger.</p><div id="result-stars" class="result-stars">★★★</div><p id="result-pass-message" class="result-pass-message"></p></div>`);
    done.id='screen-results'; done.append(results);
    main.replaceChildren(home,map,play,settings,done);
    // The debug and original score elements stay mounted to preserve existing logic.
    $('score-strip').setAttribute('aria-hidden','true');
    // Move advanced rhythm mic latency setting into settings but keep the element alive.
    const latency=$('mic-timing-offset').closest('label');
    settings.querySelector('.setting-intro').append(latency);
    // Keep the full lesson selector in settings as a diagnostic (map handles progression).
    settings.querySelector('.setting-intro').append($('lesson-select').closest('label'));
    this.home=home;this.map=map;this.play=play;this.settingsPage=settings;this.results=done;
  }
  wire(){
    document.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>this.show(button.dataset.page)));
    $('home-continue').addEventListener('click',()=>this.continueLesson());
    $('home-start').addEventListener('click',()=>this.continueLesson());
    $('game-narrate').addEventListener('click',()=>this.onNarrate());
    document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>this.setMode(b.dataset.mode)));
    $('unlock-all-lessons').checked=this.settings.unlockAll;
    $('unlock-all-lessons').addEventListener('change',event=>{
      this.settings.unlockAll=event.target.checked;
      try{localStorage.setItem(KEY,JSON.stringify(this.settings));}catch{}
      this.updateMap();this.sync(this.engine.state());
    });
    this.mode='learn';
  }
  continueLesson(){
    if(this.engine.position>0&&!this.engine.state().done){this.show('play');return;}
    const lessons=this.engine.lessons,history=loadHistory();
    const index=Math.min(unlockedThrough(lessons,history,this.settings.unlockAll)-1,lessons.length-1);
    let candidate=lessons.findIndex(lesson=>!history.some(h=>h.lessonId===lesson.id&&h.keyAccuracy>=PASS&&h.loopPassed!==false));
    if(candidate<0)candidate=index;
    candidate=Math.min(candidate,index);
    this.chooseLesson(lessons[candidate].id);this.show('play');
  }
  show(name){
    if(!['home','map','play','settings','results'].includes(name))return;
    if(this.view==='play'&&name!=='play'&&name!=='results')this.onNavigate();
    if(name==='play'&&this.engine?.state().done){this.continueLesson();return;}
    this.view=name;
    this.onPageChange?.(name);
    for(const [id,screen] of Object.entries({home:this.home,map:this.map,play:this.play,settings:this.settingsPage,results:this.results}))screen.hidden=id!==name;
    document.querySelectorAll('.game-nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.page===name?'page':'false'));
    document.body.dataset.page=name;
    if(name==='home')this.updateHome();
    if(name==='map')this.updateMap();
    window.scrollTo({top:0,behavior:'instant'});
  }
  setMode(mode){
    if(!['learn','perform'].includes(mode))return;
    this.mode=mode;
    for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===mode));
    this.onModeChange(mode);
  }
  canOpenLesson(id){
    const i=this.engine.lessons.findIndex(l=>l.id===id);
    return i>=0&&i<unlockedThrough(this.engine.lessons,loadHistory(),this.settings.unlockAll);
  }
  selectLesson(index){
    const max=unlockedThrough(this.engine.lessons,loadHistory(),this.settings.unlockAll);
    if(index>=max)return;
    this.chooseLesson(this.engine.lessons[index].id);this.show('play');
  }
  onComplete(passedOverride=null){
    const state=this.engine.state(),passed=passedOverride===null?state.summary.accuracy>=PASS:passedOverride;
    $('result-stars').textContent=!passed?'☆☆☆':state.summary.accuracy>=95?'★★★':state.summary.accuracy>=80?'★★☆':'★☆☆';
    this.results.querySelector('.result-heading h1').textContent=passed?'Wonderful playing, Cleo! ✨': 'Three tries complete, Cleo! Keep practicing!';
    $('results-title').textContent=passed?'Congratulations! 🎉':'Your practice results';
    $('result-pass-message').textContent=passed?'Lesson passed! The next adventure is unlocked.':passedOverride===false?'Three tries completed. No full in-time melody yet. Restart and try again!':'Nice effort! Try again to reach 70% accuracy and unlock the next lesson.';
    $('result-next').disabled=!passed||!state.nextLessonId;
    this.updateMap();this.show('results');
  }
  sync(state){
    saveActive(state);
    $('player-lesson-number').textContent=`LESSON ${state.lessonIndex+1} / ${this.engine.lessons.length}`;
    $('player-lesson-title').textContent=state.lesson.title;
    const done=state.position,steps=checkpoints(state);
    $('lesson-checkpoints').innerHTML=steps.map((s,i)=>`<div class="checkpoint ${s.done?'complete':(done>=s.start?'active':'')}"><span class="checkpoint-icon">${s.done?'✓':i+1}</span><span>Step ${i+1}<b>${s.label}</b></span></div>`).join('');
    $('player-stars').textContent=state.done?'★ ★ ★':`${state.position} / ${state.length} notes`;
    this.updateHome();
  }
  updateHome(){
    const h=loadHistory(),passed=this.engine.lessons.filter(l=>h.some(s=>s.lessonId===l.id&&s.keyAccuracy>=PASS));
    $('home-stats').innerHTML=`<span>★ ${passed.length} lessons passed</span><span>♫ ${h.length} practice sessions</span><span>🎹 ${this.engine.lessons.length} adventures</span>`;
    const next=Math.min(unlockedThrough(this.engine.lessons,h,this.settings.unlockAll)-1,this.engine.lessons.length-1);
    $('home-lesson-title').textContent=this.engine.lessons[next]?.title||'Explore the piano';
  }
  updateMap(){
    const h=loadHistory(),allowed=unlockedThrough(this.engine.lessons,h,this.settings.unlockAll);
    const grid=$('lesson-map');grid.replaceChildren();
    this.engine.lessons.forEach((l,i)=>{
      const best=Math.max(0,...h.filter(x=>x.lessonId===l.id).map(x=>x.keyAccuracy||0));
      const passed=best>=PASS,locked=i>=allowed;
      const n=create('button',`map-card ${passed?'passed':''} ${locked?'locked':''}`,
        `<span class="map-index">${locked?'🔒':passed?'✓':String(i+1).padStart(2,'0')}</span><span class="map-type">${l.notes.some(Array.isArray)?'CHORDS':i<4?'STARTER':'MELODY'}</span><strong>${html(l.title)}</strong><small>${passed?`★ ${Math.round(best)}% best`:locked?'Finish the earlier lesson to unlock':`${l.notes.length} musical steps`}</small><span class="map-play">${locked?'Locked':'Play →'}</span>`);
      n.disabled=locked;n.addEventListener('click',()=>this.selectLesson(i));grid.append(n);
    });
  }
}
