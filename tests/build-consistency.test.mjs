import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const text=(path)=>readFileSync(new URL(path,root),'utf8');
const source=JSON.parse(text('lessons/lessons.json'));
const html=text('index.html');
const main=text('js/main.js');
const embedded=html.match(/<script type="application\/json" id="embedded-lessons">([\s\S]*?)<\/script>/)?.[1];
const options=html.match(/<select id="lesson-select"[^>]*>([\s\S]*?)<\/select>/)?.[1];

test('the distributed page embeds the complete fifty-lesson catalog',()=>{
  assert.ok(embedded,'Missing embedded catalog');
  const actual=JSON.parse(embedded);
  assert.equal(actual.length,50);
  assert.ok(source.length>=50);
  assert.deepEqual(actual,source.slice(0,50));
});
test('the selector includes all 50 lessons even if JavaScript fails to boot',()=>{
  assert.ok(options);
  assert.equal((options.match(/<option\b/g)||[]).length,50);
  for(const lesson of source.slice(0,50))assert.ok(options.includes(`value="${lesson.id}"`),lesson.id);
});
test('melody controls are visible and functional in the shipped page',()=>{
  assert.match(html, /id="melody-button"/);
  assert.doesNotMatch(html, /id="melody-button"[^>]*\bhidden\b/);
  assert.match(main, /melodyBeats \?\? lesson\.notes\.map\(\(\)=>1\)/);
  assert.match(main,/melodyButton\.addEventListener\('click',hearWholeMelody\)/);
  assert.match(main,/melodyStop\.addEventListener\('click'/);
});
test('version labels and cache busters all identify 2.9',()=>{
  assert.match(html,/CLEO EDITION · v2\.9/);
  assert.match(html, /main\.js\?v=2\.9/);
  assert.match(html,/styles\.css\?v=2\.9/);
  assert.doesNotMatch(main, /v=1\.8\.1/);
  assert.match(main,/embedded-lessons/);
});
test('the version supports JSON-first loading with an embedded fallback',()=>{
  assert.match(main,/loadLessonCatalog/);
  assert.match(main,/void refreshMicrophones\(\)/);
});

test('all chord controls and modules are deployed with twenty lessons',()=>{
  assert.match(html,/id="chord-mode"/);
  assert.match(html,/id="midi-button"/);
  assert.match(html,/id="chord-self-test"/);
  assert.match(html,/id="chord-progress"/);
  assert.match(main,/spectralNotes/);
  assert.match(main,/onMidiMessage/);
  assert.match(main,/loadLessonCatalog\(\{fallback\}\)/);
});
