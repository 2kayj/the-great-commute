// 우주 팔로워 - 유성 파편 (RainEffect 움직임 기반 + 유성 파티클 렌더)
import type { PhysicsState } from '../../Physics';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../utils/constants';
import { BaseFollower } from '../BaseFollower';

const MAX_ROCKS = 6;

const FALL_SPEED_X_MIN = 20;
const FALL_SPEED_X_MAX = 35;
const FALL_SPEED_Y_MIN = 25;
const FALL_SPEED_Y_MAX = 45;

const EXIT_DISTANCE = 160;
const EXIT_DURATION = 2.0;

interface MeteorRock {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

export class MicroMeteorEffect extends BaseFollower {
  protected appearDistance = 150;
  protected entranceDuration = 2.0;

  private rocks: MeteorRock[] = [];

  private exitProgress = 0;
  private isExiting = false;
  private isDone = false;

  protected onEnter(): void {
    this.rocks = [];
    for (let i = 0; i < MAX_ROCKS; i++) {
      this.rocks.push(this.createRock(true));
    }
    this.exitProgress = 0;
    this.isExiting = false;
    this.isDone = false;
  }

  protected onReset(): void {
    this.rocks = [];
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
        this.rocks = [];
        return;
      }
    }

    for (const rock of this.rocks) {
      rock.x += rock.vx * dt;
      rock.y += rock.vy * dt;

      if (rock.y > CANVAS_HEIGHT + rock.r * 2 || rock.x > CANVAS_WIDTH + rock.r * 2) {
        const fresh = this.createRock(false);
        rock.x = fresh.x;
        rock.y = fresh.y;
        rock.vx = fresh.vx;
        rock.vy = fresh.vy;
        rock.r = fresh.r;
      }
    }
  }

  protected onRender(ctx: CanvasRenderingContext2D, _groundY: number): void {
    if (this.isDone) return;

    const fadeIn = this.entranceProgress;
    const fadeOut = this.isExiting ? 1 - this.exitProgress : 1;
    const globalFade = fadeIn * fadeOut;

    ctx.save();

    // 클리핑
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.clip();

    for (const rock of this.rocks) {
      const px = rock.x;
      const py = rock.y;

      // 꼬리 (trail)
      const trailLen = 14;
      const grad = ctx.createLinearGradient(px, py, px - trailLen, py - trailLen);
      grad.addColorStop(0, `rgba(255,200,100,${0.7 * globalFade})`);
      grad.addColorStop(1, `rgba(255,150,50,0)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = rock.r;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - trailLen, py - trailLen);
      ctx.stroke();

      // 돌멩이
      ctx.globalAlpha = globalFade;
      ctx.fillStyle = '#888877'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, rock.r, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private createRock(scatter: boolean): MeteorRock {
    const vx = FALL_SPEED_X_MIN + Math.random() * (FALL_SPEED_X_MAX - FALL_SPEED_X_MIN);
    const vy = FALL_SPEED_Y_MIN + Math.random() * (FALL_SPEED_Y_MAX - FALL_SPEED_Y_MIN);
    const r = 2 + Math.random() * 3;

    const x = scatter
      ? Math.random() * CANVAS_WIDTH
      : -r - Math.random() * 60;
    const y = scatter
      ? Math.random() * CANVAS_HEIGHT
      : -r - Math.random() * 60;

    return { x, y, vx, vy, r };
  }
}
