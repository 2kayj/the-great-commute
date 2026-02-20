import type { VerletNode } from '../types/game.types';
import { VERLET_ITERATIONS } from '../utils/constants';

export class VerletChain {
  nodes: VerletNode[];
  segmentLength: number;
  gravity: number;
  damping: number;
  // gravityDir: +1 = downward (default), -1 = upward (for neck-like chains)
  gravityDir: number;
  iterations: number;

  constructor(
    nodeCount: number,
    segmentLength: number,
    gravity: number = 0.5,
    damping: number = 0.98,
    gravityDir: number = 1,
    iterations: number = VERLET_ITERATIONS
  ) {
    this.segmentLength = segmentLength;
    this.gravity = gravity;
    this.damping = damping;
    this.gravityDir = gravityDir;
    this.iterations = iterations;

    // Initialize nodes along the gravity direction so the chain starts
    // in its natural resting pose rather than collapsing on first update.
    this.nodes = Array.from({ length: nodeCount }, (_, i) => ({
      x: 0,
      y: i * segmentLength * gravityDir,
      prevX: 0,
      prevY: i * segmentLength * gravityDir,
      pinned: i === 0,
    }));
  }

  update(anchorX: number, anchorY: number): void {
    const first = this.nodes[0];
    first.x = anchorX;
    first.y = anchorY;
    first.prevX = anchorX;
    first.prevY = anchorY;

    for (let i = 1; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      const vx = (node.x - node.prevX) * this.damping;
      const vy = (node.y - node.prevY) * this.damping;

      node.prevX = node.x;
      node.prevY = node.y;

      node.x += vx;
      node.y += vy + this.gravity * this.gravityDir;
    }

    for (let iter = 0; iter < this.iterations; iter++) {
      for (let i = 0; i < this.nodes.length - 1; i++) {
        const a = this.nodes[i];
        const b = this.nodes[i + 1];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        const diff = (dist - this.segmentLength) / dist;

        if (a.pinned) {
          b.x -= dx * diff;
          b.y -= dy * diff;
        } else if (b.pinned) {
          a.x += dx * diff;
          a.y += dy * diff;
        } else {
          const half = diff * 0.5;
          a.x += dx * half;
          a.y += dy * half;
          b.x -= dx * half;
          b.y -= dy * half;
        }
      }

      const first2 = this.nodes[0];
      first2.x = anchorX;
      first2.y = anchorY;
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    startWidth: number,
    endWidth: number,
    color: string = '#222222'
  ): void {
    if (this.nodes.length < 2) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < this.nodes.length - 1; i++) {
      const t = i / (this.nodes.length - 1);
      const lineWidth = startWidth + (endWidth - startWidth) * t;
      ctx.lineWidth = lineWidth;

      const a = this.nodes[i];
      const b = this.nodes[i + 1];

      if (i === 0 && this.nodes.length > 2) {
        const c = this.nodes[i + 1];
        const nextC = this.nodes[i + 2];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(c.x, c.y, (c.x + nextC.x) / 2, (c.y + nextC.y) / 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
