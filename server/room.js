// server/room.js
const DrawingState = require('./drawing-state');

class RoomManager {
  constructor() { this.rooms = new Map(); }

  _ensure(roomId) {
    if (!this.rooms.has(roomId)) this.rooms.set(roomId, { state: new DrawingState(), sockets: new Map() });
    return this.rooms.get(roomId);
  }

  addSocket(roomId, ws, meta = {}) {
    const r = this._ensure(roomId);
    r.sockets.set(ws, Object.assign({}, meta));
  }

  removeSocket(roomId, ws) {
    const r = this.rooms.get(roomId);
    if (!r) return;
    r.sockets.delete(ws);
  }

  updateMeta(roomId, ws, meta = {}) {
    const r = this.rooms.get(roomId);
    if (!r) return;
    const m = r.sockets.get(ws) || {};
    r.sockets.set(ws, Object.assign(m, meta));
  }

  getSockets(roomId) {
    const r = this.rooms.get(roomId);
    return r ? Array.from(r.sockets.keys()) : [];
  }

  getUsers(roomId) {
    const r = this.rooms.get(roomId);
    if (!r) return [];
    const users = [];
    for (const meta of r.sockets.values()) {
      users.push({ id: meta.userId || null, name: meta.name || meta.userId || 'User', color: meta.color || '#666' });
    }
    return users;
  }

  pushStroke(roomId, stroke) { const r = this._ensure(roomId); r.state.addStroke(stroke); }
  popStroke(roomId) { const r = this.rooms.get(roomId); if (!r) return null; return r.state.popStroke(); }
  clear(roomId) { const r = this._ensure(roomId); r.state.clear(); }
  getState(roomId) { const r = this._ensure(roomId); return r.state.serialize(); }
}

module.exports = RoomManager;
