# 🏛️ Architecture Overview  
**Realtime Collaborative Whiteboard**

This document explains the **system architecture**, **data flow**, **client–server communication**, and **internal modules** that power the realtime whiteboard.

---

# 📐 High-Level Architecture

┌────────────────────────┐ ┌────────────────────────┐
│ Browser A │ │ Browser B │
│ (Canvas + JS Client) │ │ (Canvas + JS Client) │
└────────────┬───────────┘ └────────────┬───────────┘
│ WebSocket Messages │
└───────────────────────────────────┘
Realtime Sync

pgsql
Copy code
                 ▼
    ┌───────────────────────────┐
    │      Node.js Server       │
    │  Express + WS WebSocket   │
    └──────────────┬────────────┘
                   │
                   ▼
    ┌───────────────────────────┐
    │        Room Manager        │
    │   Users + State Storage    │
    └──────────────┬────────────┘
                   │
                   ▼
    ┌───────────────────────────┐
    │      Drawing State         │
    │  Stroke History (in RAM)   │
    └───────────────────────────┘
markdown
Copy code

The server is a **stateful WebSocket backend** that maintains rooms and drawing state in memory, while clients render strokes on an HTML5 `<canvas>`.

---

# ⚡ Core Components

## 1. Client-side
### **HTML/CSS UI**
- Whiteboard canvas
- Top toolbar (pen, eraser, shapes, brush types, undo/clear/export)
- Right sidebar (online users)
- Minimap
- Room creation and joining inputs

### **JavaScript Modules**
| File | Responsibility |
|------|----------------|
| `main.js` | UI behavior, WebSocket communication, tool switching |
| `canvas.js` | Drawing logic, canvas scaling, stroke rendering, eraser, minimap |
| `websocket.js` | Small WS wrapper for send/receive events |

---

## 2. Server-side
### **server.js**
- Starts Express static server
- Creates WebSocket server (`ws`)
- Handles:
  - join room
  - draw
  - undo
  - clear
  - sync request
  - presence updates

### **room.js**
Each room holds:  
```js
{
  state: DrawingState(),
  sockets: Map<WebSocket, Meta>
}
```
User meta:

```js

{
  userId: "u_xxx",
  name: "Alice",
  color: "#ff0033"
}
```
drawing-state.js
Stores drawing strokes in memory.

A stroke object:

```js

{
  id: "s_123",
  userId: "u_ab12",
  tool: "pen" | "marker" | "pencil" | "eraser" | "shape",
  shape: "line" | "rect" | "circle" | "arrow" | null,
  color: "#000000",
  width: 4,
  points: [ { x, y }, { x, y }, ... ]
}
```
🔌 WebSocket Message Architecture
| Type               | Description                          |
| ------------------ | ------------------------------------ |
| `join`             | Join or create a room                |
| `draw`             | Send completed stroke (points array) |
| `undo`             | Request undo last stroke             |
| `clear`            | Clear entire board                   |
| `request-sync`     | Ask server to send full board state  |
| `request-presence` | Ask for online users                 |
| `meta-update`      | Update user name or color            |


Server → Client Messages
| Type         | Description                     |
| ------------ | ------------------------------- |
| `sync-state` | Full state: `{ strokes: [] }`   |
| `draw`       | Broadcast stroke to other users |
| `undo`       | Other users should undo         |
| `clear`      | Clear event for room            |
| `presence`   | Online users list for sidebar   |
