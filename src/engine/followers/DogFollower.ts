import type { PhysicsState } from '../Physics';
import { VerletChain } from '../VerletChain';
import { CHARACTER_X, GROUND_Y } from '../../utils/constants';
import { BaseFollower } from './BaseFollower';

const DOG_X = CHARACTER_X - 55;
const ENTRANCE_START_X = CHARACTER_X + 120;

// easeOutBack: overshoots slightly before settling
function easeOutBack(t: number): number {
  return 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
}

export class DogFollower extends BaseFollower {
  protected appearDistance = 50;

  private walkPhase = 0;
  private tail: VerletChain;

  // Tail anchor is at the rear of the body
  private tailAnchorOffsetX = -18;
  private tailAnchorOffsetY = -8;

  constructor() {
    super();
    // 3 nodes, segLen=4, negative gravity for upward curve, good damping
    this.tail = new VerletChain(3, 4, -0.3, 0.95, 1, 10);
  }

  protected onEnter(): void {
    // Reset tail nodes to entrance start position
    const startX = ENTRANCE_START_X + this.tailAnchorOffsetX;
    const startY = GROUND_Y + this.tailAnchorOffsetY;
    for (const node of this.tail.nodes) {
      node.x = startX;
      node.y = startY;
      node.prevX = startX;
      node.prevY = startY;
    }
  }

  protected onReset(): void {
    this.walkPhase = 0;
    // Reset tail
    for (const node of this.tail.nodes) {
      node.x = 0;
      node.y = 0;
      node.prevX = 0;
      node.prevY = 0;
    }
  }

  protected onUpdate(dt: number, physicsState: PhysicsState): void {
    this.walkPhase += (physicsState.speed / 80) * dt * Math.PI * 2;

    // Compute current dog body X based on entrance progress
    const easedX = this.entranceProgress >= 1
      ? DOG_X
      : ENTRANCE_START_X + (DOG_X - ENTRANCE_START_X) * easeOutBack(this.entranceProgress);

    const bodyY = GROUND_Y + Math.abs(Math.sin(this.walkPhase)) * -2;

    // Update tail verlet chain
    const anchorX = easedX + this.tailAnchorOffsetX;
    const anchorY = bodyY + this.tailAnchorOffsetY;
    this.tail.update(anchorX, anchorY);
  }

  protected onRender(ctx: CanvasRenderingContext2D, _groundY: number): void {
    const easedProgress = easeOutBack(Math.min(this.entranceProgress, 1));
    const currentX = this.entranceProgress >= 1
      ? DOG_X
      : ENTRANCE_START_X + (DOG_X - ENTRANCE_START_X) * easedProgress;

    const bodyBob = Math.abs(Math.sin(this.walkPhase)) * -2;
    const bodyX = currentX;
    const bodyY = GROUND_Y + bodyBob;

    ctx.save();

    // --- Tail (rendered behind body) ---
    this.renderTail(ctx);

    // --- Legs (behind the body, rendered first) ---
    this.renderLegs(ctx, bodyX, bodyY);

    // --- Body ---
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(bodyX, bodyY - 10, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // --- Head ---
    this.renderHead(ctx, bodyX, bodyY);

    ctx.restore();
  }

  private renderTail(ctx: CanvasRenderingContext2D): void {
    if (this.tail.nodes.length < 2) return;
    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(this.tail.nodes[0].x, this.tail.nodes[0].y);
    for (let i = 1; i < this.tail.nodes.length; i++) {
      ctx.lineTo(this.tail.nodes[i].x, this.tail.nodes[i].y);
    }
    ctx.stroke();

    // Outline
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.tail.nodes[0].x, this.tail.nodes[0].y);
    for (let i = 1; i < this.tail.nodes.length; i++) {
      ctx.lineTo(this.tail.nodes[i].x, this.tail.nodes[i].y);
    }
    ctx.stroke();

    ctx.restore();
  }

  private renderLegs(ctx: CanvasRenderingContext2D, bodyX: number, bodyY: number): void {
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Front pair: bodyX + 10, back pair: bodyX - 10
    const legPairs = [
      { hipX: bodyX + 10, phase: this.walkPhase },
      { hipX: bodyX - 10, phase: this.walkPhase + Math.PI },
    ];

    const hipY = bodyY - 4;
    const upperLen = 6;
    const lowerLen = 6;

    for (const { hipX, phase } of legPairs) {
      const swing = Math.sin(phase) * 4;
      const kneeX = hipX + swing * 0.5;
      const kneeY = hipY + upperLen;
      const footX = kneeX + swing;
      const footY = kneeY + lowerLen;

      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(footX, footY);
      ctx.stroke();
    }
  }

  private renderHead(ctx: CanvasRenderingContext2D, bodyX: number, bodyY: number): void {
    const headX = bodyX + 14;
    const headY = bodyY - 18;
    const headR = 8;

    // Ears (triangles)
    ctx.fillStyle = '#EEEEEE';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.5;

    // Left ear
    ctx.beginPath();
    ctx.moveTo(headX - 4, headY - headR + 2);
    ctx.lineTo(headX - 9, headY - headR - 6);
    ctx.lineTo(headX, headY - headR - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right ear
    ctx.beginPath();
    ctx.moveTo(headX + 2, headY - headR + 2);
    ctx.lineTo(headX + 7, headY - headR - 6);
    ctx.lineTo(headX + 4, headY - headR + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Head circle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(headX, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eye
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(headX + 4, headY - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#444444';
    ctx.beginPath();
    ctx.arc(headX + 7, headY + 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
