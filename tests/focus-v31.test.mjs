import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {clampLaneHeight,visibleBeatCount} from '../js/focus-mode-v31.js';
import {parseFingerCode} from '../js/finger-guides-v3.js';
test('vertical Highway height remains in safe limits',()=>{
 assert.equal(clampLaneHeight(20),180);assert.equal(clampLaneHeight(390),390);assert.equal(clampLaneHeight(1200),900);
});
test('look-ahead options show six, eight or twelve upcoming beats',()=>{
 assert.equal(visibleBeatCount('6'),6);assert.equal(visibleBeatCount('8'),8);assert.equal(visibleBeatCount('12'),12);assert.equal(visibleBeatCount('4'),8);
});
test('finger-guide technique labels are strict LH/RH and 1-5',()=>{
 assert.deepEqual(parseFingerCode('LH5'),{hand:'LH',finger:5});
 assert.deepEqual(parseFingerCode('rh1'),{hand:'RH',finger:1});
 assert.equal(parseFingerCode('LH6'),null);assert.equal(parseFingerCode('RH0'),null);
});
test('fullscreen focus mode includes essential navigation, controls and completion UI',()=>{
 const c=readFileSync(new URL('../js/focus-mode-v31.js',import.meta.url),'utf8');
 for(const control of ['focus-start','focus-stop','focus-hands','focus-exit','focus-retry','focus-next','focus-result-exit','finger-opacity','beats-visible'])assert.ok(c.includes(control),control);
 const ui=readFileSync(new URL('../js/game-ui.js',import.meta.url),'utf8');
 assert.match(ui,/installFocusMode\(this\)/);
});
