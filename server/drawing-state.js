// server/drawing-state.js
class DrawingState {
  constructor() {
    this.strokes = []; // each stroke: { id, userId, tool, color, width, points }
  }
  addStroke(stroke) { this.strokes.push(stroke); }
  popStroke() { return this.strokes.pop() || null; }
  clear() { this.strokes = []; }
  serialize() { return { strokes: this.strokes.slice() }; }
}
module.exports = DrawingState;
