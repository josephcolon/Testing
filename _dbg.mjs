import { JSDOM } from 'jsdom'; import fs from 'fs';
const dom = new JSDOM(fs.readFileSync('./index.html','utf8'), { url:'http://localhost/', runScripts:'outside-only', pretendToBeVisual:true });
const { window } = dom;
global.window=window; global.document=window.document; global.localStorage=window.localStorage;
global.SpeechSynthesisUtterance=function(){this.onend=null;}; global.requestAnimationFrame=()=>0; global.cancelAnimationFrame=()=>{};
global.Audio=window.Audio=function(){return{play(){return Promise.resolve();},pause(){},set onended(_){},set onerror(_){}};};
window.HTMLCanvasElement.prototype.getContext=()=>null; window.Element.prototype.scrollIntoView=function(){}; window.innerWidth=844; window.innerHeight=390;
const tap=(el)=>el&&el.dispatchEvent(new window.Event('pointerdown',{bubbles:true}));
const pdown=(el)=>el&&el.dispatchEvent(new window.MouseEvent('pointerdown',{bubbles:true}));
const pup=(el)=>el&&el.dispatchEvent(new window.MouseEvent('pointerup',{bubbles:true}));
function solve(board){
  if(board.querySelector('.lm-wrap')){const lefts=[...board.querySelectorAll('.lm-node[data-left-key]')];for(const L of lefts){pdown(L);pup(board.querySelector(`.lm-node[data-right-key="${L.dataset.leftKey}"]`));}return'linematch';}
  if(board.querySelector('.trace-surface')){const surf=board.querySelector('.trace-surface');const wps=surf._waypoints;const fire=(t,p)=>surf.dispatchEvent(new window.MouseEvent(t,{clientX:p.x,clientY:p.y,bubbles:true}));fire('pointerdown',wps[0][0]);wps.forEach(s=>s.forEach(p=>fire('pointermove',p)));fire('pointerup',wps.at(-1).at(-1));return'trace';}
  if(board.querySelector('.mcard')){const bp={};board.querySelectorAll('.mcard').forEach(c=>(bp[c.dataset.pair]||=[]).push(c));for(const pr of Object.values(bp)){tap(pr[0]);tap(pr[1]);}return'memory';}
  if(board.dataset.seq){board.dataset.seq.split(',').forEach(i=>tap(board.querySelector(`.echo-pad[data-pad="${i}"]`)));return'echo';}
  if(board.querySelector('.sort-baskets')){for(let g=0;g<60&&board.querySelector('.sort-item');g++){const w=board.querySelector('.sort-item').dataset.color;const bk=board.querySelector(`.basket[data-color="${w}"]`);if(bk)tap(bk);else break;}return'sorting';}
  if(board.querySelector('[data-order]')){[...board.querySelectorAll('[data-order]')].sort((a,b)=>+a.dataset.order-+b.dataset.order).forEach(tap);return'order';}
  for(let g=0;g<14;g++){const t=board.querySelectorAll('[data-target]:not(.popped):not(.found):not(.eaten):not(.done)');if(!t.length)break;t.forEach(tap);}return'default';
}
const { app } = await import('./src/main.js');
const { getProfiles, updateProfile } = await import('./src/state.js');
const root=document.getElementById('app'); updateProfile(getProfiles()[0].id,{difficulty:5});
tap(root.querySelector('.mode-card[data-mode="solo"]')); tap(root.querySelector('.profile'));
for(let i=0;i<60;i++){ const b=root.querySelector('.choices');
  if(!b||b.children.length===0){ console.log(`EMPTY r${i}: prompt="${root.querySelector('.prompt')?.textContent}" boardHTML.len=${b?b.innerHTML.length:'no board'}`); }
  solve(b); await new Promise(r=>setTimeout(r,1050)); }
console.log('done');
