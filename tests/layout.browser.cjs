// Requires localhost:8765 and Chromium remote debugging on localhost:9222.
const assert=require('node:assert/strict');
(async()=>{
 const target=await(await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'})).json();
 const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));let id=0;const pending=new Map();
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}});
 const call=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
 const run=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
 await call('Page.enable');await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});
 await call('Network.setBlockedURLs',{urls:['*cdnjs.cloudflare.com*','*cdn.jsdelivr.net*']});
 await call('Network.emulateNetworkConditions',{offline:false,latency:200,downloadThroughput:125000,uploadThroughput:62500});
 await call('Page.addScriptToEvaluateOnNewDocument',{source:`window.layoutShifts=[];window.frames=[];window.mainChanges=0;new PerformanceObserver(list=>{for(const e of list.getEntries())window.layoutShifts.push({t:e.startTime,value:e.value,recent:e.hadRecentInput,sources:e.sources.map(s=>s.node?.className||s.node?.tagName)});}).observe({type:'layout-shift',buffered:true});document.addEventListener('DOMContentLoaded',()=>{new MutationObserver(()=>window.mainChanges++).observe(document.querySelector('main'),{childList:true});});function sample(){const root=document.querySelector('.trajectory,.todo-popcorn,#homeTypewriter');if(root){const b=root.getBoundingClientRect();const c=document.querySelector('.trajectory-card,.options-card,.main-logo');const cr=c?.getBoundingClientRect();const firstButton=document.querySelector('.trajectory-filters button');const a={type:root.className,x:b.x,y:b.y,width:b.width,height:b.height,card:c?{x:cr.x,y:cr.y,width:cr.width,height:cr.height}:null,font:firstButton?getComputedStyle(firstButton).fontSize:null,entries:document.querySelectorAll('.trajectory-entry').length};const last=window.frames.at(-1);if(!last||JSON.stringify(last.shape)!==JSON.stringify(a))window.frames.push({t:performance.now(),shape:a});}requestAnimationFrame(sample);}requestAnimationFrame(sample);`});
 const result=[];
 for(const [width,height] of [[1440,900],[390,844]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
  for(const route of ['/proyectos','/todo_popcorn','/']){
   await call('Page.navigate',{url:`http://127.0.0.1:8765/?layout=${Date.now()}#${route}`});
   for(let attempt=0;attempt<200;attempt++){if(await run("!!(document.querySelector('.trajectory-entry,#homeTypewriter .type-line')||document.querySelector('.todo-popcorn')?.todoPopcornApp)")) break;await new Promise(r=>setTimeout(r,100));}
   await new Promise(r=>setTimeout(r,2500));
   const metrics=await run(`({frames:window.frames,shifts:window.layoutShifts,changes:window.mainChanges,resources:performance.getEntriesByType('resource').filter(r=>/pages\\/|timeline.json|trayectoria.js/.test(r.name)).map(r=>new URL(r.name).pathname),overflow:document.documentElement.scrollWidth>innerWidth})`);
   const cls=metrics.shifts.filter(s=>!s.recent).reduce((sum,s)=>sum+s.value,0);
   result.push({width,height,route,cls,...metrics});
  }
 }
 for (const metrics of result) {
  const label = `${metrics.width}px ${metrics.route}`;
  assert.equal(metrics.changes, 1, `${label}: section inserted more than once`);
  assert.equal(metrics.frames.length, 1, `${label}: geometry changed after first paint`);
  assert.ok(metrics.cls < 0.001, `${label}: unexpected layout shifts (${metrics.cls})`);
  assert.equal(metrics.overflow, false, `${label}: horizontal overflow`);
  const page = metrics.route === '/' ? '/pages/index.html' : metrics.route === '/proyectos' ? '/pages/proyectos.html' : '/pages/todo_popcorn.html';
  assert.equal(metrics.resources.filter(path => path === page).length, 1, `${label}: duplicate fetch`);
  if (metrics.route === '/proyectos') assert.ok(metrics.frames[0].shape.entries > 0, 'Timeline first painted without its data');
 }
 // Exercise warm navigation, history, filters, dialogs, stale responses and retry.
 await call('Network.emulateNetworkConditions', {offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 await call('Network.setBlockedURLs', {urls:[]});
 const waitFor = async expression => {
  for (let i=0;i<100;i++) { if (await run(expression)) return; await new Promise(resolve=>setTimeout(resolve,100)); }
  throw new Error('Navigation did not complete: '+expression);
 };
 for (const [width,height] of [[1440,900],[390,844]]) {
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
  await run(`document.querySelector('a[href="#/proyectos"]').click()`);
  await waitFor(`document.querySelectorAll('.trajectory-entry').length>0`);
  const first=await run(`document.querySelectorAll('.trajectory-entry').length`);
  await run(`document.querySelector('[data-filter="project"]').click();document.querySelector('.trajectory-card').click()`);
  assert.ok(await run(`document.querySelector('.trajectory-dialog').open`));
  await run(`document.querySelector('.trajectory-close').click();document.querySelector('[data-filter="all"]').click()`);
  assert.equal(await run(`document.querySelectorAll('.trajectory-entry').length`),first);
  await run('history.back()'); await waitFor(`!!document.querySelector('#homeTypewriter')`);
  await run('history.forward()'); await waitFor(`!!document.querySelector('.trajectory-entry')`);
  await run(`document.querySelector('a[href="#/todo_popcorn"]').click()`);
  await waitFor(`!!document.querySelector('.todo-popcorn')?.todoPopcornApp`);
  // Delay data only in the test, so an older route completes after a newer one.
  await run(`window.originalFetch=window.fetch;window.fetch=(url,...args)=>String(url).includes('timeline.json')?new Promise(resolve=>setTimeout(()=>resolve(window.originalFetch(url,...args)),600)):window.originalFetch(url,...args);document.querySelector('a[href="#/proyectos"]').click()`);
  await new Promise(resolve=>setTimeout(resolve,100));
  await run(`document.querySelector('a[href="#/todo_popcorn"]').click()`);
  await new Promise(resolve=>setTimeout(resolve,1000));
  assert.ok(await run(`!!document.querySelector('.todo-popcorn')?.todoPopcornApp`));
  await run(`window.fetch=(url,...args)=>String(url).includes('timeline.json')?Promise.resolve(new Response('',{status:503})):window.originalFetch(url,...args);document.querySelector('a[href="#/proyectos"]').click()`);
  await waitFor(`!!document.getElementById('navigation-error')`);
  assert.ok(await run(`!!document.querySelector('.todo-popcorn')`), 'Failed navigation discarded the current section');
  await run(`window.fetch=window.originalFetch;document.querySelector('a[href="#/proyectos"]').click()`);
  await waitFor(`!!document.querySelector('.trajectory-entry')`);
  // Restore Home as the previous history entry for the next viewport.
  await run(`document.querySelector('a[href="#/"]').click()`);
  await waitFor(`!!document.querySelector('#homeTypewriter')`);
 }
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await run(`document.querySelector('a[href="#/proyectos"]').click()`);
 await waitFor(`!!document.querySelector('.trajectory-entry')`);
 await run(`document.querySelector('a[href="#/"]').click()`);
 await waitFor(`!!document.querySelector('#homeTypewriter .author:not(.type-author-pending)')`);
 console.log(JSON.stringify({coldLoads:result.map(r=>({width:r.width,route:r.route,cls:r.cls,stableFirstFrame:r.frames.length===1})),navigation:'Filters, dialogs, Back/Forward, stale responses, retry and reduced motion passed'},null,2));
 ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
