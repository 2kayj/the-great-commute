// 우주 팔로워 - 탐사 로봇 (DogFollower 움직임 기반 + 탐사 로봇 렌더)
import type { PhysicsState } from '../../Physics';
import { VerletChain } from '../../VerletChain';
import { CHARACTER_X, GROUND_Y } from '../../../utils/constants';
import { BaseFollower } from '../BaseFollower';

const BOT_X = CHARACTER_X - 55;
const ENTRANCE_START_X = CHARACTER_X + 120;

function easeOutBack(t: number): number {
  return 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
}

export class ProbeBotFollower extends BaseFollower {
  protected appearDistance = 300;

  private walkPhase = 0;
  private tail: VerletChain;

  private tailAnchorOffsetX = -18;
  private tailAnchorOffsetY = -8;

  constructor() {
    super();
    this.tail = new VerletChain(3, 4, -0.3, 0.95, 1, 10);
  }

  protected onEnter(): void {
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
    for (const node of this.tail.nodes) {
      node.x = 0;
      node.y = 0;
      node.prevX = 0;
      node.prevY = 0;
    }
  }

  protected onUpdate(dt: number, physicsState: PhysicsState): void {
    this.walkPhase += (physicsState.speed / 80) * dt * Math.PI * 2;

    const easedX =
      this.entranceProgress >= 1
        ? BOT_X
        : ENTRANCE_START_X + (BOT_X - ENTRANCE_START_X) * easeOutBack(this.entranceProgress);

    const bodyY = GROUND_Y + Math.abs(Math.sin(this.walkPhase)) * -2;

    const anchorX = easedX + this.tailAnchorOffsetX;
    const anchorY = bodyY + this.tailAnchorOffsetY;
    this.tail.update(anchorX, anchorY);
  }

  protected onRender(ctx: CanvasRenderingContext2D, _groundY: number): void {
    const easedProgress = easeOutBack(Math.min(this.entranceProgress, 1));
    const currentX =
      this.entranceProgress >= 1
        ? BOT_X
        : ENTRANCE_START_X + (BOT_X - ENTRANCE_START_X) * easedProgress;

    const walkPhase = this.walkPhase;
    const bx = currentX;
    const by = GROUND_Y + Math.abs(Math.sin(walkPhase)) * -2;

    // drawExploreBot 기반 (gY = by, cx = bx)
    const gY = by;

    ctx.save();

    // 바퀴 두 개
    ctx.fillStyle = '#555566'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    for (const side of [-1, 1]) {
      const bounceY = Math.sin(walkPhase + (side < 0 ? 0 : Math.PI)) * 1.5;
      ctx.beginPath();
      ctx.arc(bx + side * 12, gY - 4 + bounceY, 6, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      // 바퀴 살
      ctx.strokeStyle = '#888899'; ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 2) * i + walkPhase * 0.5;
        ctx.beginPath();
        ctx.moveTo(bx + side * 12, gY - 4 + bounceY);
        ctx.lineTo(
          bx + side * 12 + Math.cos(a) * 5,
          gY - 4 + bounceY + Math.sin(a) * 5
        );
        ctx.stroke();
      }
      ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    }

    // 몸통 (네모)
    ctx.fillStyle = '#AABBCC'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bx - 16, gY - 32, 32, 24, 3);
    ctx.fill(); ctx.stroke();

    // 몸통 패널라인
    ctx.strokeStyle = '#888899'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(bx - 16, gY - 22); ctx.lineTo(bx + 16, gY - 22); ctx.stroke();

    // 안테나
    ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx - 5, gY - 32);
    ctx.lineTo(bx - 8, gY - 44);
    ctx.stroke();
    ctx.fillStyle = '#FF4444'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(bx - 8, gY - 44, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // 카메라 렌즈
    ctx.fillStyle = '#334455'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(bx + 4, gY - 22, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4488CC';
    ctx.beginPath(); ctx.arc(bx + 4, gY - 22, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#AADDFF';
    ctx.beginPath(); ctx.arc(bx + 6, gY - 24, 1.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }
}
