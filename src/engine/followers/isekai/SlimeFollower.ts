// 이세계 팔로워 - 슬라임 (DogFollower 움직임 기반 + 슬라임 렌더)
import type { PhysicsState } from '../../Physics';
import { VerletChain } from '../../VerletChain';
import { CHARACTER_X, GROUND_Y } from '../../../utils/constants';
import { BaseFollower } from '../BaseFollower';

const SLIME_X = CHARACTER_X - 55;
const ENTRANCE_START_X = CHARACTER_X + 120;

function easeOutBack(t: number): number {
  return 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
}

export class SlimeFollower extends BaseFollower {
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
        ? SLIME_X
        : ENTRANCE_START_X + (SLIME_X - ENTRANCE_START_X) * easeOutBack(this.entranceProgress);

    const bodyY = GROUND_Y + Math.abs(Math.sin(this.walkPhase)) * -2;

    const anchorX = easedX + this.tailAnchorOffsetX;
    const anchorY = bodyY + this.tailAnchorOffsetY;
    this.tail.update(anchorX, anchorY);
  }

  protected onRender(ctx: CanvasRenderingContext2D, _groundY: number): void {
    const easedProgress = easeOutBack(Math.min(this.entranceProgress, 1));
    const currentX =
      this.entranceProgress >= 1
        ? SLIME_X
        : ENTRANCE_START_X + (SLIME_X - ENTRANCE_START_X) * easedProgress;

    const cx = currentX;
    const cy = GROUND_Y - 45; // drawSlime에서 gY = cy + 45
    const t = this.time;

    const gY = cy + 45;

    const phase = (t * 1.8) % (Math.PI * 2);
    const squish = Math.sin(phase);

    const scaleX = 1.0 + squish * 0.15;
    const scaleY = 1.0 - squish * 0.2;

    const jumpHeight = Math.max(0, -squish) * 6;

    const bx = cx;
    const by = gY - jumpHeight;

    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(scaleX, scaleY);

    // 그림자
    ctx.save();
    ctx.scale(1 / scaleX, 1 / scaleY);
    const shadowScale = 0.7 + squish * 0.1;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(0, gY - by + 2, 18 * shadowScale, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 몸통 (통통한 젤리 방울)
    const bodyW = 20, bodyH = 22;

    const grad = ctx.createRadialGradient(-4, -8, 2, 0, 0, bodyW);
    grad.addColorStop(0, 'rgba(140, 255, 140, 0.85)');
    grad.addColorStop(0.5, 'rgba(80, 220, 80, 0.8)');
    grad.addColorStop(1, 'rgba(40, 180, 60, 0.7)');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(-bodyW, -bodyH * 0.3);
    ctx.bezierCurveTo(-bodyW, -bodyH * 0.7, -bodyW * 0.6, -bodyH, 0, -bodyH);
    ctx.bezierCurveTo(bodyW * 0.6, -bodyH, bodyW, -bodyH * 0.7, bodyW, -bodyH * 0.3);
    ctx.bezierCurveTo(bodyW, bodyH * 0.1, bodyW * 0.5, bodyH * 0.25, 0, bodyH * 0.25);
    ctx.bezierCurveTo(-bodyW * 0.5, bodyH * 0.25, -bodyW, bodyH * 0.1, -bodyW, -bodyH * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(30, 130, 50, 0.6)';
    ctx.lineWidth = 1.5 / scaleX;
    ctx.stroke();

    // 하이라이트
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-7, -14, 5, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // 눈 (스케일 보정)
    const invSX = 1 / scaleX, invSY = 1 / scaleY;
    ctx.save();
    ctx.scale(invSX, invSY);

    const eyeY = -12 * scaleY;
    const eyeSpacing = 7 * scaleX;

    ctx.fillStyle = '#222222';
    ctx.beginPath(); ctx.arc(-eyeSpacing, eyeY, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeSpacing, eyeY, 3.5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(-eyeSpacing - 0.5, eyeY - 1, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeSpacing - 0.5, eyeY - 1, 1, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
    ctx.restore();
  }
}
