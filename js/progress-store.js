const KEY='pianoplay-progress-v2.1';
export function loadHistory(){
  try{const list=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(list)?list:[];}
  catch{return [];}
}
export function saveSession(session){
  const next=[session,...loadHistory()].slice(0,100);
  try{localStorage.setItem(KEY,JSON.stringify(next));return true;}
  catch{return false;}
}
export function exportHistory(){return JSON.stringify({app:'Piano Play Lab',version:'2.1',savedAt:new Date().toISOString(),sessions:loadHistory()},null,2);}
export function updateSessionRhythm(id,report){
  if(!id)return false;
  const items=loadHistory(),entry=items.find(h=>h.id===id);
  if(!entry)return false;
  entry.rhythm=report;
  try{localStorage.setItem(KEY,JSON.stringify(items));return true;}
  catch{return false;}
}
