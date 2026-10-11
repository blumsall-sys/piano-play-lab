// Lesson catalog is authored in lessons/lessons.json. index.html has a last-known-good fallback.
import {validateLessons} from './lesson.js';
export function validateCatalogUpgrade(candidate, fallback){
  const lessons=validateLessons(candidate);
  if(!Array.isArray(fallback)||!fallback.length)return lessons;
  if(lessons.length < fallback.length)throw new Error(`Catalog is missing lessons: found ${lessons.length}, expected at least ${fallback.length}.`);
  // Existing IDs must remain stable for local progress, lesson progression and saved history.
  for(let i=0;i<fallback.length;i++){
    if(lessons[i].id!==fallback[i].id)throw new Error(`Lesson ${i+1} ID/order changed (${fallback[i].id}). Append new lessons without changing existing IDs.`);
  }
  return lessons;
}
export async function loadLessonCatalog({fallback,fetcher=fetch,now=()=>Date.now()}={}){
  const embedded=validateLessons(fallback);
  try{
    const url=`./lessons/lessons.json?catalog=${now()}`;
    const response=await fetcher(url,{cache:'no-store'});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const catalog=validateCatalogUpgrade(await response.json(),embedded);
    return {lessons:catalog,source:'lessons.json',warning:null};
  }catch(error){
    return {lessons:embedded,source:'embedded fallback',warning:`Could not use lessons/lessons.json (${error.message}). Using the ${embedded.length}-lesson built-in catalog. Update or check the JSON file on GitHub.`};
  }
}
