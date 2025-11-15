# 🖌️ Realtime Collaborative Whiteboard

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-4A86E8?style=for-the-badge&logo=websockets&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

A fast, minimal, and stable **real-time collaborative drawing board** using the Canvas API and WebSockets.  
Supports rooms, presence, multiple brush types, simple shapes, erase, undo/clear, export PNG, and a minimap.

---

## 📦 Project Structure

project/
│ .env
│ package.json
│ README.md
│
├─ client/
│ ├─ index.html
│ ├─ style.css
│ ├─ main.js
│ ├─ canvas.js
│ └─ websocket.js
│
└─ server/
├─ server.js
├─ room.js
└─ drawing-state.js
---

## 🚀 Features

- 🎨 **Drawing tools:** Pen, Marker, Pencil, Calligraphy, Eraser  
- 🧭 **Shapes:** Line, Rectangle, Circle, Arrow (vector-like preview)  
- 🔧 **Controls:** Color picker, brush size, undo, clear, export PNG  
- 🔁 **Realtime collaboration:** Rooms (create/join), realtime sync of strokes  
- 👥 **Presence:** Online users list with color avatars and counts  
- 🗺️ **Mini-map:** Live thumbnail of the board for quick overview  
- ⚡ **Minimal server:** Node + Express + ws for WebSocket handling

---
## 📸 Screenshots

Below are preview screenshots of the **Realtime Collaborative Whiteboard** interface.  


---
## 🔧 Installation

**Requirements:** Node.js (v16+ recommended), npm

1. Clone repository
```bash
git clone <your-repo-url>
cd realtime-whiteboard
```
2. Install dependencies
```bash
npm install
```


3. Create .env in project root:
```bash
PORT=3000
```

4. Start server
```bash
npm start
```

5. Open the app in your browser:
```bash
http://localhost:3000
```
🧪 How to Use (Quick Start)
1. Open two tabs (or two devices)

Open http://localhost:3000 in Tab A and Tab B.

2. Create a room (Tab A)

Enter a Create room name (e.g. room1)

Click Create Room

Tab A automatically joins the created room

3. Join the room (Tab B)

Enter the same room id (room1)

Click Join Room

4. Draw together

Select brush, color, size and start drawing

Erase on one tab — it should remove pixels for all participants

Click Undo to remove the last stroke (broadcast to room)

Click Clear to clear the board for everyone

Click Export to download a PNG of the current board

🖼️ Tools Breakdown

|             Tool | Description                                                                              |
| ---------------: | ---------------------------------------------------------------------------------------- |
|          **Pen** | Solid strokes for normal drawing                                                         |
|       **Marker** | Semi-transparent wide brush (soft)                                                       |
|       **Pencil** | Thin sketch-like strokes                                                                 |
|  **Calligraphy** | Flat stroke style (butt cap)                                                             |
|       **Eraser** | Pixel-destructive erase (`destination-out`)                                              |
|       **Shapes** | Line / Rectangle / Circle / Arrow — drawn with a preview and finalized as stroke objects |
| **Color Picker** | Choose stroke color                                                                      |
|   **Brush Size** | Width slider (affects next stroke)                                                       |
|         **Undo** | Removes last stroke (broadcast to room)                                                  |
|        **Clear** | Clears all strokes in the room                                                           |
|       **Export** | Download a PNG snapshot of the canvas                                                    |

🔌 WebSocket Protocol (Messages)

All messages are JSON. Client ↔ Server messages are short and predictable.

Client → Server

join
```bash

{ "type": "join", "payload": { "roomId": "room1", "userId": "u_ab12", "name": "Alice", "color": "#3b82f6" } }
```

draw
```bash
{ "type": "draw", "payload": { "stroke": { "id":"s1","userId":"u_ab12","tool":"pen","shape":"none","color":"#000","width":4,"points":[{"x":10,"y":10}, ...] } } }
```

undo
```bash
{ "type": "undo", "payload": {} }
```

clear
```bash
{ "type": "clear", "payload": {} }
```

request-sync
```bash
{ "type": "request-sync", "payload": {} }
```

request-presence
```bash
{ "type": "request-presence", "payload": {} }
```

meta-update
```bash
{ "type": "meta-update", "payload": { "name": "Bob", "color": "#ef4444" } }
```
Server → Client

sync-state — sends { strokes: [...] }

draw — broadcast stroke to others

undo — tells clients to undo last stroke

clear — tells clients to clear

presence — sends { users: [{id,name,color}, ...] }

🧱 Server Architecture (What each file does)

server/server.js
Express static server + WebSocket server (ws). Routes/serves client bundle and handles incoming JSON messages; delegates room logic to room.js.

server/room.js
Keeps an in-memory map of rooms → { state, sockets }. Stores per-socket metadata (userId, name, color), provides helper APIs for presence and stroke storage.

server/drawing-state.js
Holds strokes (addStroke, popStroke, clear, serialize) for syncing new joiners.

Note: This project is intentionally minimal and stores everything in memory. For production scale, persist strokes to a DB or use shared-realtime backend (e.g., Redis + pub/sub, Supabase, Firebase, or CRDT-based solution).

⚠️ Troubleshooting
I cannot draw

Open DevTools (F12) → Console. Look for errors such as Cannot read property 'getContext' (canvas missing) or script 404s.

Run in Console to inspect canvas size:
```bash
document.getElementById('board').getBoundingClientRect()
```

Width/height must be > 0.

"ws not open" or messages not delivered

Ensure server is running (npm start).

Confirm WebSocket connected (top-right status shows "Connected").

Open Network tab → WS frames to inspect messages.

Rooms not syncing / wrong room

Room IDs are case-sensitive. Ensure both tabs use exactly same room id.

Use request-sync to force a full state sync for a client.

Users list not updating

Presence is broadcast on join/leave and when meta-update is sent.

Check server console for [server] user ... joined room ... logs.

If you see any red errors in Console or errors in terminal, paste them here and I'll provide a one-line fix and patched file.

✅ Development & Debugging Tips

Run server with a process manager (e.g., nodemon) for hot reload:
```bash
npm install -g nodemon
nodemon server/server.js
```

Add console.log in server/server.js message handler to inspect incoming payloads fast.

To test latency/reliability, open tabs in multiple browsers or devices on same network.

🧩 Extending & Deployment Ideas

Persist strokes in a DB (MongoDB / PostgreSQL) for history & versioning

Add per-stroke ownership and per-user undo (only undo own strokes)

Replace ws with socket.io for easier reconnection & rooms (optional)

Add cursor indicators (broadcast pointer coordinates)

Add authentication and private rooms (password or JWT)

Add file/image attachments, sticky-notes, and templates

Host on a Node host (Heroku, Fly, Railway) — ensure WebSocket support

🧑‍💻 Contributing

Fork the repo

Create a feature branch: git checkout -b feat/my-feature

Commit changes: git commit -am "Add feature"

Push and open a PR

Please keep changes small and focused. Add tests if you add logic to server state management.

📄 License

This project is released under the MIT License — free for personal & educational use. See LICENSE for details.

🙏 Credits

Created by Vishal — built with ❤️ using Node.js, Express, WebSockets, and the Canvas API.