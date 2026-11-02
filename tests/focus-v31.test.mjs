import test from 'node:test';
import assert from 'node:assert/strict';
import {clampLaneHeight,visibleBeatCount} from '../js/focus-mode-v31.js';
import {parseFingerCode} from '../js/finger-guides-v3.js';
import {fingerAssignment,highwayPosition} from '../js/falling-highway-v3.js';
test('six, eight, and twelve beat look-ahead presets',()=>{
  assert.equal(visibleBeatCount(6),6);assert.equal(visibleBeatCount('8'),8);
  assert.equal(visibleBeatCount(12),12);assert.equal(visibleBeatCount(5),8);
});
test('resizable canvas height is clamped for sensible practice',()=>{
  assert.equal(clampLaneHeight(5),180);assert.equal(clampLaneHeight(400),400);assert.equal(clampLaneHeight(2000),900);
});
test('explicit left and right finger assignments remain accurate',()=>{
  assert.deepEqual(parseFingerCode('LH5'),{hand:'LH',finger:5});
  assert.deepEqual(parseFingerCode('rh1'),{hand:'RH',finger:1});
  assert.equal(parseFingerCode('RH6'),null);
  assert.deepEqual(fingerAssignment({handAssignments:[['LH5','RH1']]},0,1),{hand:'RH',finger:1});
});
test('highway note position honours the timeline clock',()=>{
  const timeline={beatMs:500,events:[{startBeat:0},{startBeat:1}]};
  assert.equal(highwayPosition({timeline,position:0,anchorMs:1000,nowMs:2000}),2);
  assert.equal(highwayPosition({timeline,position:1,anchorMs:null,nowMs:2000}),1);
});
