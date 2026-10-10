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

test('the distributed page embeds the complete nine-lesson catalog',()=>{
  assert.ok(embedded,'Missing embedded catalog');
  const actual=JSON.parse(embedded);
  assert.equal(actual.length,9);
  assert.deepEqual(actual,source);
});
test('the selector includes all 9 lessons even if JavaScript fails to boot',()=>{
  assert.ok(options);
  assert.equal((options.match(/<option\b/g)||[]).length,9);
  for(const lesson of source)assert.ok(options.includes(`value="${lesson.id}"`),lesson.id);
});
test('melody controls are visible and functional in the shipped page',()=>{
  assert.match(html, /id="melody-button"/);
  assert.doesNotMatch(html, /id="melody-button"[^>]*\bhidden\b/);
  assert.match(main, /melodyBeats \?\? lesson\.notes\.map\(\(\)=>1\)/);
  assert.match(main,/melodyButton\.addEventListener\('click',hearWholeMelody\)/);
  assert.match(main,/melodyStop\.addEventListener\('click'/);
});
test('version labels and cache busters all identify 1.8.1',()=>{
  assert.match(html,/NINE LESSONS · v1\.8\.1/);
  assert.match(html, /main\.js\?v=1\.8\.1/);
  assert.match(html,/styles\.css\?v=1\.8\.1/);
  assert.doesNotMatch(main, /v=1\.8\.1\.1/);
  assert.match(main,/embedded-lessons/);
});
test('the version can initialize without a fetch request for lessons.json',()=>{
  assert.doesNotMatch(main,/fetch\(['"]\.\/lessons\/lessons\.json/);
  assert.match(main,/void refreshMicrophones\(\)/);
});
