import test from 'node:test';
import assert from 'node:assert/strict';
import {highwayPosition,fingerAssignment,mapNoteX} from '../js/falling-highway-v3.js';
import {readFileSync} from 'node:fs';
const lessons=JSON.parse(readFileSync(new URL('../lessons/lessons.json',import.meta.url)));
test('a high-to-low falling highway uses the same real beat clock as the original scorer',()=>{
 const timeline={beatMs:500,events:[{startBeat:0},{startBeat:1},{startBeat:3}]};
 assert.equal(highwayPosition({timeline,position:0,anchorMs:1000,nowMs:2500}),3);
 assert.equal(highwayPosition({timeline,position:1,anchorMs:null,nowMs:9000}),1);
});
test('finger assignment honours lesson metadata, and never invents unspecified fingers',()=>{
 const right=lessons.find(l=>l.id==='rh-five-fingers');
 assert.deepEqual(fingerAssignment(right,0,0),{hand:'RH',finger:1});
 assert.deepEqual(fingerAssignment(right,4,0),{hand:'RH',finger:5});
 const combined=lessons.find(l=>l.id==='bass-melody-pairs');
 assert.deepEqual(fingerAssignment(combined,0,0),{hand:'LH',finger:5});
 assert.deepEqual(fingerAssignment(combined,0,1),{hand:'RH',finger:1});
 assert.equal(fingerAssignment(lessons[0],0,0),null);
});
test('note lanes align to the exact physical key rectangle centres',()=>{
 const rect={dataset:{midi:'65'},getAttribute:(k)=>({x:'154',width:'48'}[k])};
 const svg={viewBox:{baseVal:{x:0,width:800}},querySelectorAll:()=>[rect]};
 assert.equal(mapNoteX(svg,65,800),178);
 assert.equal(mapNoteX(svg,53,800),null);
});
test('gameplay uses shared horizontally scrolling stage with toggleable hand diagrams',()=>{
 const ui=readFileSync(new URL('../js/game-ui.js',import.meta.url),'utf8');
 const main=readFileSync(new URL('../js/main.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../css/game-v22.css',import.meta.url),'utf8');
 assert.match(ui,/falling-stage/);
 assert.match(ui,/hand-guide-toggle/);
 assert.match(ui,/localStorage.setItem\('cleos-piano-hand-guides-v3'/);
 assert.match(main,/updateFingerGuides\(keyboard.svg/);
 assert.match(css,/falling-stage/);
});
