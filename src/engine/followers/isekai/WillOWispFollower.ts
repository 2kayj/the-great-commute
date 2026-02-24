// 이세계 팔로워 - 도깨비불 (FireflyFollower 움직임 기반 + 도깨비불 렌더)
import type { PhysicsState } from '../../Physics';
import { CHARACTER_X, GROUND_Y } from '../../../utils/constants';
import { BaseFollower } from '../BaseFollower';

const SWARM_CENTER_X = CHARACTER_X - 30;
const SWARM_CENTER_Y = GROUND_Y - 80;

const ORBIT_RADIUS_MIN = 40;
const ORBIT_RADIUS_MAX = 60;

interface WispFireParams {
  orbitRadius: number;
  orbitPhase: number;
  orbitSpeed: number;
  ampX: number;
  ampY: number;
  freqX: number;
  freqY: number;
  lissPhase: number;
  blinkOffset: number;
  blinkSpeed: number;
  radius: number;
  trailLength: number;
  trailAngle: number;
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createWispParams(index: number, total: number): WispFireParams {
  const baseOrbitPhase = (index / total) * Math.PI * 2;
  return {
    orbitRadius: randBetween(ORBIT_RADIUS_MIN, ORBIT_RADIUS_MAX),
    orbitPhase: baseOrbitPhase + randBetween(-0.3, 0.3),
    orbitSpeed: randBetween(0.18, 0.28),
    ampX: randBetween(10, 20),
    ampY: randBetween(8, 16),
    freqX: randBetween(0.8, 1.6),
    freqY: randBetween(1.1, 2.0),
    lissPhase: randBetween(0, Math.PI * 2),
    blinkOffset: randBetween(0, Math.PI * 2),
    blinkSpeed: randBetween(0.33, 0.55),
    radius: randBetween(2.5, 3.5),
    trailLength: randBetween(3, 6),
    trailAngle: randBetween(-0.4, 0.4),
  };
}

export class WillOWispFollower extends BaseFollower {
  protected appearDistance = 350;
  protected entranceDuration = 2.0;

  private readonly COUNT = 4;
  private params: WispFireParams[] = [];
  private orbitTime = 0;

  protected onEnter(): void {
    this.orbitTime = 0;
    this.params = Array.from({ length: this.COUNT }, (_, i) =>
      createWispParams(i, this.COUNT)
    );
  }

  protected onReset(): void {
    this.params = [];
    this.orbitTime = 0;
  }

  protected onUpdate(dt: number, _physicsState: PhysicsState): void {
    this.orbitTime += dt;
  }

  protected onRender(ctx: CanvasRenderingContext2D, _groundY: number): void {
    const baseAlpha = this.entranceProgress;

    ctx.save();

    for (const p of this.params) {
      const orbitAngle = this.orbitTime * p.orbitSpeed + p.orbitPhase;
      const orbitX = SWARM_CENTER_X + Math.cos(orbitAngle) * p.orbitRadius;
      const orbitY = SWARM_CENTER_Y + Math.sin(orbitAngle) * p.orbitRadius * 0.45;

      const t = this.time;
      const lx = Math.sin(p.freqX * t + p.lissPhase) * p.ampX;
      const ly = Math.sin(p.freqY * t) * p.ampY;

      const fx = orbitX + lx;
      const fy = orbitY + ly;

      const blinkRaw = Math.abs(Math.sin(Math.PI * p.blinkSpeed * t + p.blinkOffset));
      const blinkAlpha = 0.2 + blinkRaw * 0.8;

      ctx.globalAlpha = baseAlpha * blinkAlpha;

      // 푸른 불꽃 글로우
      const gr = ctx.createRadialGradient(fx, fy, 0, fx, fy, p.radius * 5);
      gr.addColorStop(0, 'rgba(100,200,255,0.7)');
      gr.addColorStop(0.4, 'rgba(50,100,255,0.3)');
      gr.addColorStop(1, 'rgba(0,50,200,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(fx, fy, p.radius * 5, 0, Math.PI * 2); ctx.fill();

      // 불꽃 코어
      ctx.fillStyle = '#88DDFF';
      ctx.strokeStyle = '#44AAFF'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.arc(fx, fy, p.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
