import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const path=new URL('../',import.meta.url);
const page=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const main=readFileSync(new URL('../js/main.js',import.meta.url),'utf8');
test('rhythm UI controls are present and wired to code',()=>{
 for(const id of ['score-strip','rhythm-grade','metronome-audible','rhythm-bpm','rhythm-speed','mic-timing-offset', 'rhythm-start','rhythm-stop','rhythm-beat','rhythm-feedback','result-timing','result-holds','history-list','history-export']){
  assert.match(page,new RegExp(`id="${id}"`),id);
 }
 for(const module of ['rhythm','metronome','score-strip','progress-store']){
  assert.ok(existsSync(new URL(`../js/${module}.js`,import.meta.url)));
  assert.match(main,new RegExp(`from './${module}\\.js\\?v=2\\.6'`));
 }
});
test('document and source version are consistent',()=>{
 assert.match(page,/v2\.6 READY|v2\.6 · 20 lessons/);
 assert.match(page,/main\.js\?v=2\.6/);
 assert.match(page,/styles\.css\?v=2\.6/);
});
