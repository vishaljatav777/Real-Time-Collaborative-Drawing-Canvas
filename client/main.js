// client/main.js - driving the minimal app
(function(){
  const serverUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host;
  let roomId = null;
  const userId = 'u_' + Math.random().toString(36).slice(2,6);
  const userColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');

  // DOM
  const createRoomInput = document.getElementById('createRoomInput');
  const createRoomBtn = document.getElementById('createRoomBtn');
  const joinRoomInput = document.getElementById('joinRoomInput');
  const joinRoomBtn = document.getElementById('joinRoomBtn');
  const connStatus = document.getElementById('connStatus');

  const toolPen = document.getElementById('toolPen');
  const toolEraser = document.getElementById('toolEraser');
  const brushSelect = document.getElementById('brushSelect');
  const colorPicker = document.getElementById('colorPicker');
  const brushSize = document.getElementById('brushSize');
  const undoBtn = document.getElementById('undoBtn');
  const clearBtn = document.getElementById('clearBtn');
  const exportBtn = document.getElementById('exportBtn');

  const userList = document.getElementById('userList');
  const userCount = document.getElementById('userCount');

  Whiteboard.init();

  wsClient.on('open', ()=>{ connStatus.textContent='Connected'; connStatus.className='status status-connected'; if(roomId) wsClient.send({ type:'join', payload:{ roomId, userId, name:userId, color:userColor } }); });
  wsClient.on('close', ()=>{ connStatus.textContent='Disconnected'; connStatus.className='status status-disconnected'; });
  wsClient.on('message', handleMessage);
  wsClient.connect(serverUrl);

  Whiteboard.attachListeners((stroke) => {
    if (!roomId) return console.warn('not in room, join first');
    stroke.userId = userId;
    if (!stroke.color) stroke.color = colorPicker.value;
    wsClient.send({ type:'draw', payload:{ stroke }});
  });

  function handleMessage(msg){
    const { type, payload } = msg;
    if (type === 'sync-state') Whiteboard.setStrokes(payload.strokes || []);
    else if (type === 'draw') Whiteboard.renderRemoteStroke(payload.stroke);
    else if (type === 'clear') Whiteboard.clearAll();
    else if (type === 'undo') Whiteboard.undo();
    else if (type === 'presence') renderUsers(payload.users || []);
  }

  function renderUsers(users){
    userList.innerHTML=''; users.forEach(u=>{ const li=document.createElement('li'); li.className='user-item'; const av=document.createElement('div'); av.className='user-avatar'; av.style.background=u.color||'#666'; av.textContent=(u.name||u.id||'U').slice(0,1).toUpperCase(); const span=document.createElement('div'); span.textContent = u.name || u.id; li.appendChild(av); li.appendChild(span); userList.appendChild(li); }); document.getElementById('userCount').textContent = users.length;
  }

  // CREATE ROOM
  createRoomBtn.addEventListener('click', ()=>{
    const name = (createRoomInput.value||'').trim();
    if(!name) return alert('Enter room name');
    roomId = name;
    wsClient.send({ type:'join', payload:{ roomId, userId, name:userId, color:userColor }});
    wsClient.send({ type:'request-sync' });
    alert('Created & joined room: '+roomId);
  });

  // JOIN ROOM
  joinRoomBtn.addEventListener('click', ()=>{
    const rid = (joinRoomInput.value||'').trim();
    if(!rid) return alert('Enter room id');
    roomId = rid;
    wsClient.send({ type:'join', payload:{ roomId, userId, name:userId, color:userColor }});
    wsClient.send({ type:'request-sync' });
  });

  // Controls
  toolPen.addEventListener('click', ()=> { Whiteboard.setTool('pen'); toolPen.classList.add('active'); toolEraser.classList.remove('active'); });
  toolEraser.addEventListener('click', ()=> { Whiteboard.setTool('eraser'); toolEraser.classList.add('active'); toolPen.classList.remove('active'); });
  brushSelect.addEventListener('change', ()=> { Whiteboard.setTool(brushSelect.value); });
  undoBtn.addEventListener('click', ()=> { Whiteboard.undo(); if (roomId) wsClient.send({ type:'undo' }); });
  clearBtn.addEventListener('click', ()=> { Whiteboard.clearAll(); if (roomId) wsClient.send({ type:'clear' }); });
  exportBtn.addEventListener('click', ()=> { const url = Whiteboard.exportPNG(); const a = document.createElement('a'); a.href=url; a.download='board.png'; a.click(); });

})();
