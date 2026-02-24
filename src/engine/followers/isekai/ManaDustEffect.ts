// 이세계 팔로워 - 마나 가루 (RainEffect 움직임 기반 + 마나 파티클 렌더)
import type { PhysicsState } from '../../Physics';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../utils/constants';
import { BaseFollower } from '../BaseFollower';

const MAX_PARTICLES = 10;

const FALL_SPEED_MIN = 8;
const FALL_SPEED_MAX = 16;

const EXIT_DISTANCE = 160;
const EXIT_DURATION = 2.0;

interface ManaDustParticle {
  x: number;      // 화면 기준 X
  y: number;      // 화면 기준 Y
  vy: number;     // px/s 낙하 속도
  phase: number;  // 좌우 흔들림 + 알파 위상
}

export class ManaDustEffect extends BaseFollower {
  protected appearDistance = 150;
  protected entranceDuration = 2.0;

  private particles: ManaDustParticle[] = [];

  private exitProgress = 0;
  private isExiting = false;
  private isDone = false;

  protected onEnter(): void {
    this.particles = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push(this.createParticle(true));
    }
    this.exitProgress = 0;
    this.isExiting = false;
    this.isDone = false;
  }

  protected onReset(): void {
    this.particles = [];
    this.exitProgress = 0;
    this.isExiting = false;
    this.isDone = false;
  }

  protected onUpdate(dt: number, physicsState: PhysicsState): void {
    if (this.isDone) return;

    if (!this.isExiting && physicsState.distance >= EXIT_DISTANCE) {
      this.isExiting = true;
    }

    if (this.isExiting) {
      this.exitProgress = Math.min(1, this.exitProgress + dt / EXIT_DURATION);
      if (this.exitProgress >= 1) {
        this.isDone = true;
        this.particles = [];
        return;
      }
    }

    for (const p of this.particles) {
      // 아래로 천천히 낙하
      p.y += p.vy * dt;

      if (p.y > CANVAS_HEIGHT + 10) {
        const fresh = this.createParticle(false);
        p.x = fresh.x;
        p.y = fresh.y;
        p.vy = fresh.vy;
        p.phase = fresh.phase;
      }
    }
  }

  protected onRender(ctx: CanvasRenderingContext2D, _groundY: number): void {
    if (this.isDone) return;

    const fadeIn = this.entranceProgress;
    const fadeOut = this.isExiting ? 1 - this.exitProgress : 1;
    const globalFade = fadeIn * fadeOut;

    const t = this.time;

    ctx.save();

    for (const p of this.particles) {
      const px = p.x + Math.sin(t * 0.8 + p.phase) * 6;
      const py = p.y;

      const alpha = (0.6 + Math.sin(t * 2 + p.phase) * 0.3) * globalFade;
      ctx.globalAlpha = Math.max(0.05, alpha);

      // 다이아몬드 파티클
      const s = 3 + Math.abs(Math.sin(p.phase)) * 2;
      ctx.fillStyle = '#B070D0';
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(px, py - s);
      ctx.lineTo(px + s * 0.6, py);
      ctx.lineTo(px, py + s);
      ctx.lineTo(px - s * 0.6, py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private createParticle(scatter: boolean): ManaDustParticle {
    const vy = FALL_SPEED_MIN + Math.random() * (FALL_SPEED_MAX - FALL_SPEED_MIN);
    const phase = Math.random() * Math.PI * 2;

    const x = scatter
      ? Math.random() * CANVAS_WIDTH
      : Math.random() * CANVAS_WIDTH;
    const y = scatter
      ? Math.random() * CANVAS_HEIGHT
      : -10 - Math.random() * 30;

    return { x, y, vy, phase };
  }
}
