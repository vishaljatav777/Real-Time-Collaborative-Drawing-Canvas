// client/canvas.js - simple pen + eraser + minimap
const Whiteboard = (function () {
  const canvas = document.getElementById('board');
  if (!canvas) console.error('#board not found');
  const ctx = canvas.getContext('2d', { alpha: true });
  const miniEl = document.getElementById('miniMap');
  let dpr = window.devicePixelRatio || 1;

  let strokes = [];
  let current = null;
  let drawing = false;
  let tool = 'pen';
  let view = { offsetX:0, offsetY:0, scale:1 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr * view.scale, 0, 0, dpr * view.scale, view.offsetX * dpr, view.offsetY * dpr);
    redraw();
  }
  window.addEventListener('resize', resize);

  function screenToWorld(cx,cy){
    const r = canvas.getBoundingClientRect();
    return { x: (cx - r.left - view.offsetX)/view.scale, y: (cy - r.top - view.offsetY)/view.scale };
  }

  function redraw(){
    ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,canvas.width,canvas.height); ctx.restore();
    for(const s of strokes) drawStroke(s);
    if (current) drawStroke(current);
    renderMini();
  }

  function drawStroke(s){
    if (!s || !s.points || !s.points.length) return;
    ctx.save();
    if (s.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = s.width;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = s.width;
      ctx.strokeStyle = s.color || '#000';
      ctx.globalAlpha = s.alpha || 1;
    }
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(s.points[0].x, s.points[0].y);
    for(let i=1;i<s.points.length;i++) ctx.lineTo(s.points[i].x, s.points[i].y);
    ctx.stroke(); ctx.restore();
  }

  function startStroke(x,y,color,width,toolMode){
    drawing = true;
    current = { id: 's_'+Date.now().toString(36), userId:null, tool:toolMode||'pen', color: color||'#000', width:width||4, alpha:1, points:[{x,y}] };
  }
  function addPoint(x,y){ if(!drawing||!current) return; current.points.push({x,y}); redraw(); }
  function endStroke(){ if(!drawing) return null; drawing=false; strokes.push(current); const f=current; current=null; redraw(); return f; }

  function attachListeners(onFinish){
    canvas.style.touchAction='none';
    canvas.addEventListener('pointerdown', e=>{
      if (e.button !== 0) return;
      canvas.setPointerCapture(e.pointerId);
      const p = screenToWorld(e.clientX,e.clientY);
      const color = document.getElementById('colorPicker')?.value || '#000';
      const width = Number(document.getElementById('brushSize')?.value || 4);
      startStroke(p.x,p.y,color,width,tool);
    });
    canvas.addEventListener('pointermove', e=>{ if(!drawing) return; const p=screenToWorld(e.clientX,e.clientY); addPoint(p.x,p.y); });
    window.addEventListener('pointerup', e=>{ if(!drawing) return; const finished=endStroke(); if (finished && onFinish) onFinish(finished); });
    canvas.addEventListener('pointercancel', e=>{ if(drawing) endStroke(); });
  }

  function setTool(t){ tool = t; }
  function setStrokes(list){ strokes = (list||[]).slice(); redraw(); }
  function renderRemoteStroke(s){ strokes.push(s); redraw(); }
  function clearAll(){ strokes=[]; current=null; redraw(); }
  function undo(){ strokes.pop(); redraw(); }
  function exportPNG(){
    const tmp=document.createElement('canvas'); const r=canvas.getBoundingClientRect();
    tmp.width = Math.max(1, Math.floor(r.width*dpr)); tmp.height = Math.max(1, Math.floor(r.height*dpr));
    const tctx = tmp.getContext('2d'); tctx.fillStyle='#fff'; tctx.fillRect(0,0,tmp.width,tmp.height);
    tctx.setTransform(dpr*view.scale,0,0,dpr*view.scale,view.offsetX*dpr,view.offsetY*dpr);
    for(const s of strokes){
      if(!s.points||!s.points.length) continue;
      if (s.tool === 'eraser') { tctx.globalCompositeOperation='destination-out'; tctx.lineWidth=s.width; } else { tctx.globalCompositeOperation='source-over'; tctx.strokeStyle=s.color; tctx.lineWidth=s.width; }
      tctx.beginPath(); tctx.moveTo(s.points[0].x,s.points[0].y); for(let i=1;i<s.points.length;i++) tctx.lineTo(s.points[i].x,s.points[i].y); tctx.stroke();
    }
    return tmp.toDataURL('image/png');
  }

  function renderMini(){
    if(!miniEl) return;
    try{
      const w = Math.max(120, miniEl.clientWidth); const h = Math.max(80, miniEl.clientHeight);
      const tmp = document.createElement('canvas'); tmp.width=w; tmp.height=h; const m=tmp.getContext('2d');
      if(!strokes.length){ m.fillStyle='#f8fafc'; m.fillRect(0,0,w,h); miniEl.innerHTML=''; miniEl.appendChild(tmp); return; }
      let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
      for(const s of strokes) for(const p of s.points){ minX=Math.min(minX,p.x); minY=Math.min(minY,p.y); maxX=Math.max(maxX,p.x); maxY=Math.max(maxY,p.y); }
      const pad=20; minX-=pad; minY-=pad; maxX+=pad; maxY+=pad;
      const sw=Math.max(1,maxX-minX), sh=Math.max(1,maxY-minY);
      const scale = Math.min((w-4)/sw,(h-4)/sh);
      m.fillStyle='#fff'; m.fillRect(0,0,w,h); m.save(); m.translate(2,2); m.scale(scale,scale); m.translate(-minX,-minY);
      for(const s of strokes){ if(!s.points||!s.points.length) continue; if(s.tool==='eraser') continue; m.strokeStyle=s.color||'#000'; m.lineWidth=Math.max(1,s.width/4); m.beginPath(); m.moveTo(s.points[0].x,s.points[0].y); for(let i=1;i<s.points.length;i++) m.lineTo(s.points[i].x,s.points[i].y); m.stroke(); }
      m.restore(); miniEl.innerHTML=''; miniEl.appendChild(tmp);
    }catch(e){}
  }

  return {
    init: function(){ requestAnimationFrame(resize); window.addEventListener('resize', resize); },
    attachListeners, setTool, setStrokes, renderRemoteStroke, clearAll, undo, exportPNG, getState: ()=>({ strokes: strokes.slice() })
  };
})();
