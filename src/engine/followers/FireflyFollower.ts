import type { PhysicsState } from '../Physics';
import { CHARACTER_X, GROUND_Y } from '../../utils/constants';
import { BaseFollower } from './BaseFollower';

// 군집 무게중심: 캐릭터 뒤쪽 (강아지 근처)
const SWARM_CENTER_X = CHARACTER_X - 30;
const SWARM_CENTER_Y = GROUND_Y - 80;

// 군집 공전 반경
const ORBIT_RADIUS_MIN = 40;
const ORBIT_RADIUS_MAX = 60;

// 개별 Lissajous 부유 파라미터
interface FireflyParams {
  // 군집 공전
  orbitRadius: number;   // 40~60
  orbitPhase: number;    // 초기 위상
  orbitSpeed: number;    // 군집 공전 각속도 (느림)

  // 개별 Lissajous 진폭/주파수
  ampX: number;
  ampY: number;
  freqX: number;
  freqY: number;
  lissPhase: number;     // Lissajous 위상 오프셋

  // 점멸 파라미터
  blinkOffset: number;   // 점멸 위상 오프셋 (개체별 랜덤 타이밍)
  blinkSpeed: number;    // 점멸 주파수 (0.3~0.6 Hz → 2~3초 사이클)

  // 시각적 파라미터
  radius: number;        // 2~3px
  trailLength: number;   // 꼬리 길이 (3~6px)
  trailAngle: number;    // 꼬리 방향 오프셋 (radians)
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createFireflyParams(index: number, total: number): FireflyParams {
  // 초기 공전 위상을 고르게 분산
  const baseOrbitPhase = (index / total) * Math.PI * 2;

  return {
    orbitRadius: randBetween(ORBIT_RADIUS_MIN, ORBIT_RADIUS_MAX),
    orbitPhase: baseOrbitPhase + randBetween(-0.3, 0.3),
    orbitSpeed: randBetween(0.18, 0.28), // 느린 공전

    ampX: randBetween(10, 20),
    ampY: randBetween(8, 16),
    freqX: randBetween(0.8, 1.6),
    freqY: randBetween(1.1, 2.0),
    lissPhase: randBetween(0, Math.PI * 2),

    blinkOffset: randBetween(0, Math.PI * 2),
    blinkSpeed: randBetween(0.33, 0.55), // 2~3초 사이클

    radius: randBetween(2, 3),
    trailLength: randBetween(3, 6),
    trailAngle: randBetween(-0.4, 0.4),
  };
}

export class FireflyFollower extends BaseFollower {
  protected appearDistance = 350;
  protected entranceDuration = 2.0; // 천천히 페이드인

  private readonly COUNT = 6; // 5~7 사이, 고정 6개
  private params: FireflyParams[] = [];
  private orbitTime = 0; // 군집 공전 시간 (공유)

  protected onEnter(): void {
    this.orbitTime = 0;
    this.params = Array.from({ length: this.COUNT }, (_, i) =>
      createFireflyParams(i, this.COUNT)
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
    const baseAlpha = this.entranceProgress; // 0 → 1 fade in

    ctx.save();

    for (let i = 0; i < this.params.length; i++) {
      const p = this.params[i];

      // --- 군집 공전 위치 ---
      const orbitAngle = this.orbitTime * p.orbitSpeed + p.orbitPhase;
      const orbitX = SWARM_CENTER_X + Math.cos(orbitAngle) * p.orbitRadius;
      const orbitY = SWARM_CENTER_Y + Math.sin(orbitAngle) * p.orbitRadius * 0.45;

      // --- 개별 Lissajous 부유 ---
      const t = this.time;
      const lx = Math.sin(p.freqX * t + p.lissPhase) * p.ampX;
      const ly = Math.sin(p.freqY * t) * p.ampY;

      const fx = orbitX + lx;
      const fy = orbitY + ly;

      // --- 점멸 (0 → 1 → 0 사인 곡선) ---
      // abs(sin(...)) 로 항상 양수, 자연스러운 pulse
      const blinkRaw = Math.abs(Math.sin(Math.PI * p.blinkSpeed * t + p.blinkOffset));
      // 최소 밝기 0.15, 최대 1.0 으로 완전한 소등 방지
      const blinkAlpha = 0.15 + blinkRaw * 0.85;

      const finalAlpha = baseAlpha * blinkAlpha;

      ctx.globalAlpha = finalAlpha;

      // --- 꼬리 (fade trail) ---
      this.renderTrail(ctx, fx, fy, p);

      // --- 본체 글로우 ---
      this.renderGlow(ctx, fx, fy, p.radius);

      // --- 본체 코어 ---
      this.renderCore(ctx, fx, fy, p.radius);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private renderTrail(
    ctx: CanvasRenderingContext2D,
    fx: number,
    fy: number,
    p: FireflyParams
  ): void {
    // 꼬리: 반딧불이 뒤쪽으로 짧은 선, 끝으로 갈수록 투명
    // 이동 방향 반대쪽으로 꼬리를 냄 (단순화: 고정 각도 오프셋)
    const tailAngle = Math.PI + p.trailAngle; // 왼쪽(뒤) + 오프셋
    const tx = fx + Math.cos(tailAngle) * p.trailLength;
    const ty = fy + Math.sin(tailAngle) * p.trailLength;

    const grad = ctx.createLinearGradient(fx, fy, tx, ty);
    grad.addColorStop(0, 'rgba(255, 238, 136, 0.7)');
    grad.addColorStop(1, 'rgba(255, 238, 136, 0)');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }

  private renderGlow(
    ctx: CanvasRenderingContext2D,
    fx: number,
    fy: number,
    radius: number
  ): void {
    // shadowBlur 대신 radialGradient로 성능 절약
    const glowR = radius * 4;
    const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, glowR);
    grad.addColorStop(0, 'rgba(255, 238, 136, 0.55)');
    grad.addColorStop(0.5, 'rgba(255, 220, 80, 0.2)');
    grad.addColorStop(1, 'rgba(255, 200, 50, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(fx, fy, glowR, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderCore(
    ctx: CanvasRenderingContext2D,
    fx: number,
    fy: number,
    radius: number
  ): void {
    // 코어: 밝은 노란빛 원
    ctx.fillStyle = '#FFEE88';
    ctx.strokeStyle = '#FFCC33';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(fx, fy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
