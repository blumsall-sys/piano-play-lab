/** Generate an editable F3–F5 SVG reference directly from the interactive keyboard.js.
 * This has no browser, graphics, or dependency requirements: node tools/export-keyboard-preview.mjs
 */
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {Keyboard} from '../js/keyboard.js';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
class MockElement {
  constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.style={};this.dataset={};this.textContent='';this.cls=new Set();this.classList={add:(...args)=>args.forEach(x=>this.cls.add(x)),toggle:(x,on)=>{if(on)this.cls.add(x);else this.cls.delete(x);},remove:(x)=>this.cls.delete(x)};}
  setAttribute(k,v){this.attrs[k]=String(v);}
  getAttribute(k){return this.attrs[k];}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=[...nodes];}
  addEventListener(){}
  serialize(){
    const attrs={...this.attrs};
    if(this.cls.size)attrs.class=[attrs.class,...this.cls].filter(Boolean).join(' ');
    if(Object.keys(this.dataset).length)for(const [k,v] of Object.entries(this.dataset))attrs['data-'+k]=v;
    const attrTxt=Object.entries(attrs).map(([k,v])=>` ${k}="${esc(v)}"`).join('');
    return `<${this.tag}${attrTxt}>${esc(this.textContent)}${this.children.map(c=>c.serialize()).join('')}</${this.tag}>`;
  }
}
globalThis.document={createElementNS:(_ns,tag)=>new MockElement(tag)};
const svg=new MockElement('svg');
svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
const keyboard=new Keyboard(svg,()=>{});
const notes=[...keyboard.nodes.keys()].sort((a,b)=>a-b);
const whites=[...keyboard.nodes.values()].filter(n=>n.rect.cls.has('white'));
const blacks=[...keyboard.nodes.values()].filter(n=>n.rect.cls.has('black'));
if(notes.length!==25||whites.length!==15||blacks.length!==10||notes[0]!==53||notes.at(-1)!==77)throw new Error('Keyboard structure mismatch');
const expectedBlack=[54,56,58,61,63,66,68,70,73,75];
const actualBlack=[...keyboard.nodes.entries()].filter(([,n])=>n.rect.cls.has('black')).map(([note])=>note);
if(JSON.stringify(expectedBlack)!==JSON.stringify(actualBlack))throw new Error('Black keys do not match reference photo');
const svgContents=svg.serialize().replace('</svg>','<style><![CDATA[\n.key.white{fill:#fffdf8;stroke:#878e96;stroke-width:1.2}\n.key.black{fill:#242830;stroke:#0f1115;stroke-width:1.1}\n.key-label{font:700 12px system-ui,sans-serif;fill:#424e58}\n.key-label.dark{font-size:9px;fill:#fff}\n]]></style></svg>');
const dest=fileURLToPath(new URL('../assets/keyboard_F3-F5_preview.svg',import.meta.url));
writeFileSync(dest,svgContents);
console.log(`Saved SVG reference: ${dest} | 25 keys | 15 white | 10 black | F3–F5`);
