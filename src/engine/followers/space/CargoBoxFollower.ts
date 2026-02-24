// 우주 팔로워 - 화물 컨테이너 (TurtleFollower 움직임 기반 + 화물상자 렌더)
import type { PhysicsState } from '../../Physics';
import { CHARACTER_X, GROUND_Y } from '../../../utils/constants';
import { BaseFollower } from '../BaseFollower';

const CARGO_X = CHARACTER_X + 30;
const ENTRANCE_START_X = CHARACTER_X + 180;

function easeOutBack(t: number): number {
  return 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
}

export class CargoBoxFollower extends BaseFollower {
  protected appearDistance = 50;

  private walkPhase = 0;

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
        ? CARGO_X
        : ENTRANCE_START_X + (CARGO_X - ENTRANCE_START_X) * easedProgress;

    const bodyBob = Math.abs(Math.sin(this.walkPhase)) * -1.2;
    const bx = currentX;
    const by = GROUND_Y + bodyBob;
    const walkPhase = this.walkPhase;

    // drawCargoCrate 기반
    const cW = 40, cH = 30;

    ctx.save();

    // 로봇 다리 4개
    ctx.strokeStyle = '#222222'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    const crateLegs = [
      { ox: -14, phase: walkPhase },
      { ox: -5,  phase: walkPhase + Math.PI * 0.5 },
      { ox: 5,   phase: walkPhase + Math.PI },
      { ox: 14,  phase: walkPhase + Math.PI * 1.5 },
    ];
    for (const leg of crateLegs) {
      const sw = Math.sin(leg.phase) * 4;
      ctx.beginPath();
      ctx.moveTo(bx + leg.ox, by - 4);
      ctx.lineTo(bx + leg.ox + sw * 0.3, by);
      ctx.stroke();
    }

    // 윗면 (3D 평행사변형)
    ctx.fillStyle = '#AA7744'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx - cW / 2, by - cH);
    ctx.lineTo(bx - cW / 2 + 8, by - cH - 8);
    ctx.lineTo(bx + cW / 2 + 8, by - cH - 8);
    ctx.lineTo(bx + cW / 2, by - cH);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 옆면 (오른쪽)
    ctx.fillStyle = '#996633';
    ctx.beginPath();
    ctx.moveTo(bx + cW / 2, by);
    ctx.lineTo(bx + cW / 2 + 8, by - 8);
    ctx.lineTo(bx + cW / 2 + 8, by - cH - 8);
    ctx.lineTo(bx + cW / 2, by - cH);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 앞면
    ctx.fillStyle = '#CC9955';
    ctx.beginPath();
    ctx.roundRect(bx - cW / 2, by - cH, cW, cH, 2);
    ctx.fill(); ctx.stroke();

    // 앞면 세로 줄
    ctx.strokeStyle = '#AA7733'; ctx.lineWidth = 0.8;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(bx + i * 13, by - cH);
      ctx.lineTo(bx + i * 13, by);
      ctx.stroke();
    }

    // 화면/로고 (hideHeadProgress로 점멸)
    const screenAlpha = 1 - this.hideHeadProgress;
    ctx.globalAlpha = Math.max(0.1, screenAlpha);
    ctx.fillStyle = '#334455'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.roundRect(bx - 8, by - cH + 8, 16, 10, 1); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#44AAFF';
    ctx.beginPath(); ctx.arc(bx, by - cH + 13, 3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    ctx.restore();
  }
}
