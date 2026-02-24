// 이세계 팔로워 - 골렘 조각 (TurtleFollower 움직임 기반 + 골렘 렌더)
import type { PhysicsState } from '../../Physics';
import { CHARACTER_X, GROUND_Y } from '../../../utils/constants';
import { BaseFollower } from '../BaseFollower';

const GOLEM_X = CHARACTER_X + 30;
const ENTRANCE_START_X = CHARACTER_X + 180;

function easeOutBack(t: number): number {
  return 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
}

export class GolemChunkFollower extends BaseFollower {
  protected appearDistance = 50;

  private walkPhase = 0;

  // 머리 집어넣기 (TurtleFollower에서 복사)
  private hideHeadTimer = 0;
  private hideHeadInterval = 12;
  private hideHeadPhase: 'out' | 'hiding' | 'hidden' | 'showing' = 'out';
  private hideHeadProgress = 0;
  private readonly HIDE_DURATION = 0.25;
  private readonly HIDDEN_DURATION = 1.0;
  private readonly SHOW_DURATION = 0.3;

  protected onEnter(): void {
    this.walkPhase = 0;
    this.hideHeadTimer = 0;
    this.hideHeadInterval = 12 + Math.random() * 3;
    this.hideHeadPhase = 'out';
    this.hideHeadProgress = 0;
  }

  protected onReset(): void {
    this.walkPhase = 0;
    this.hideHeadTimer = 0;
    this.hideHeadInterval = 12 + Math.random() * 3;
    this.hideHeadPhase = 'out';
    this.hideHeadProgress = 0;
  }

  protected onUpdate(dt: number, physicsState: PhysicsState): void {
    this.walkPhase += (physicsState.speed / 80) * dt * Math.PI * 1.6;

    if (this.hideHeadPhase === 'out') {
      this.hideHeadTimer += dt;
      if (this.hideHeadTimer >= this.hideHeadInterval) {
        this.hideHeadPhase = 'hiding';
        this.hideHeadProgress = 0;
      }
    } else if (this.hideHeadPhase === 'hiding') {
      this.hideHeadProgress += dt / this.HIDE_DURATION;
      if (this.hideHeadProgress >= 1) {
        this.hideHeadProgress = 1;
        this.hideHeadPhase = 'hidden';
        this.hideHeadTimer = 0;
      }
    } else if (this.hideHeadPhase === 'hidden') {
      this.hideHeadTimer += dt;
      if (this.hideHeadTimer >= this.HIDDEN_DURATION) {
        this.hideHeadPhase = 'showing';
        this.hideHeadProgress = 1;
      }
    } else if (this.hideHeadPhase === 'showing') {
      this.hideHeadProgress -= dt / this.SHOW_DURATION;
      if (this.hideHeadProgress <= 0) {
        this.hideHeadProgress = 0;
        this.hideHeadPhase = 'out';
        this.hideHeadTimer = 0;
        this.hideHeadInterval = 10 + Math.random() * 5;
      }
    }
  }

  protected onRender(ctx: CanvasRenderingContext2D, _groundY: number): void {
    const easedProgress = easeOutBack(Math.min(this.entranceProgress, 1));
    const currentX =
      this.entranceProgress >= 1
        ? GOLEM_X
        : ENTRANCE_START_X + (GOLEM_X - ENTRANCE_START_X) * easedProgress;

    const bodyBob = Math.abs(Math.sin(this.walkPhase)) * -1.5;
    const bodyX = currentX;
    const bodyY = GROUND_Y + bodyBob;

    const walkPhase = this.walkPhase;
    const bx = bodyX, by = bodyY;

    ctx.save();

    // 다리 두 개 (짧고 굵은 네모)
    ctx.fillStyle = '#888899'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    for (const side of [-1, 1]) {
      const sw = Math.sin(walkPhase + (side < 0 ? 0 : Math.PI)) * 3;
      ctx.beginPath();
      ctx.roundRect(bx + side * 8 - 5 + sw, by - 8, 10, 10, 2);
      ctx.fill(); ctx.stroke();
    }

    // 팔 두 개
    for (const side of [-1, 1]) {
      const armSw = Math.sin(walkPhase + (side < 0 ? 0 : Math.PI)) * 4;
      ctx.fillStyle = '#999AAA';
      ctx.beginPath();
      ctx.roundRect(bx + side * 18 - 4, by - 28 + armSw, 8, 16, 2);
      ctx.fill(); ctx.stroke();
    }

    // 몸통 (회색 돌덩이)
    ctx.fillStyle = '#AAAACC'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bx - 15, by - 40, 30, 30, 3);
    ctx.fill(); ctx.stroke();

    // 균열선
    ctx.strokeStyle = '#222222'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(bx - 5, by - 40); ctx.lineTo(bx - 8, by - 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + 8, by - 35); ctx.lineTo(bx + 5, by - 20); ctx.stroke();

    // 눈 (주황빛) - hideHeadProgress로 페이드
    const eyeAlpha = 1 - Math.max(0, this.hideHeadProgress - 0.6) / 0.4;
    ctx.globalAlpha = eyeAlpha;
    ctx.fillStyle = '#FF8800'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(bx - 6, by - 30, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(bx + 6, by - 30, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#222222';
    ctx.beginPath(); ctx.arc(bx - 6, by - 30, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx + 6, by - 30, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    ctx.restore();
  }
}
