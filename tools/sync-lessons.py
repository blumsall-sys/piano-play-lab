r"""Synchronize the shipped offline fallback in index.html with lessons/lessons.json.
For FUTURE GitHub Pages lesson additions this step is NOT needed.
The browser fetches lessons/lessons.json first. The embedded catalog is used only if loading fails.

Standard library only. Run from project root:
    py -3 tools\sync-lessons.py
or:
    python tools/sync-lessons.py

This exists because an embedded catalog is used for reliable GitHub Pages startup.
"""
import json,re
from pathlib import Path
from html import escape
root=Path(__file__).resolve().parents[1]
path=root/'lessons'/'lessons.json'
html_path=root/'index.html'
lessons=json.loads(path.read_text(encoding='utf-8'))
if not isinstance(lessons,list) or len(lessons)<1:
    raise ValueError('Expected nonempty lesson list')
ids=[item['id'] for item in lessons]
if len(ids)!=len(set(ids)):
    raise ValueError('Duplicate IDs')
html=html_path.read_text(encoding='utf-8')
inline=json.dumps(lessons,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
html,count=re.subn(r'(<script type="application/json" id="embedded-lessons">).*?(</script>)',lambda m:m.group(1)+inline+m.group(2),html,flags=re.S,count=1)
if count!=1:raise ValueError('Embedded lesson catalog not found in index.html')
options=''.join(f'<option value="{escape(lesson["id"])}">{i} · {escape(lesson["title"])}</option>' for i,lesson in enumerate(lessons,1))
html,count=re.subn(r'(<select id="lesson-select"[^>]*>).*?(</select>)',lambda m:m.group(1)+options+m.group(2),html,flags=re.S,count=1)
if count!=1:raise ValueError('Lesson selector not found in index.html')
html_path.write_text(html,encoding='utf-8')
print(f'Synchronized {len(lessons)} lessons into index.html; commit BOTH files.')
