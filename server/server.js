// server/server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const RoomManager = require('./room');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.static(path.join(__dirname, '..', 'client')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const rooms = new RoomManager();

function safeSend(ws, obj) {
  try { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj)); } catch (e) {}
}

function broadcastToRoom(roomId, exceptWs, obj) {
  const sockets = rooms.getSockets(roomId);
  if (!sockets) return;
  for (const s of sockets) {
    if (s !== exceptWs && s.readyState === WebSocket.OPEN) safeSend(s, obj);
  }
}

function broadcastPresence(roomId) {
  const users = rooms.getUsers(roomId);
  const sockets = rooms.getSockets(roomId);
  for (const s of sockets) safeSend(s, { type: 'presence', payload: { users } });
}

wss.on('connection', (ws) => {
  ws.roomId = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }
    const { type, payload } = msg;

    if (type === 'join') {
      const { roomId, userId, name, color } = payload || {};
      ws.roomId = roomId;
      rooms.addSocket(roomId, ws, { userId, name, color });
      // send current drawing state
      safeSend(ws, { type: 'sync-state', payload: rooms.getState(roomId) });
      // update presence for all
      broadcastPresence(roomId);
      console.log(`[server] user ${name || userId} joined room ${roomId}`);
      return;
    }

    if (!ws.roomId) return;
    const roomId = ws.roomId;

    if (type === 'draw') {
      const stroke = payload && payload.stroke; if (!stroke) return;
      rooms.pushStroke(roomId, stroke);
      broadcastToRoom(roomId, ws, { type: 'draw', payload: { stroke } });
      return;
    }

    if (type === 'clear') {
      rooms.clear(roomId);
      broadcastToRoom(roomId, ws, { type: 'clear' });
      return;
    }

    if (type === 'undo') {
      const removed = rooms.popStroke(roomId);
      broadcastToRoom(roomId, ws, { type: 'undo', payload: { removed } });
      return;
    }

    if (type === 'request-sync') {
      safeSend(ws, { type: 'sync-state', payload: rooms.getState(roomId) });
      return;
    }

    if (type === 'request-presence') {
      broadcastPresence(roomId);
      return;
    }

    if (type === 'meta-update') {
      rooms.updateMeta(roomId, ws, payload || {});
      broadcastPresence(roomId);
      return;
    }
  });

  ws.on('close', () => {
    if (ws.roomId) {
      rooms.removeSocket(ws.roomId, ws);
      broadcastPresence(ws.roomId);
      console.log(`[server] connection closed in room ${ws.roomId}`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
