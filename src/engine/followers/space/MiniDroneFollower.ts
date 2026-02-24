// 우주 팔로워 - 소형 드론 (ButterflyFollower 움직임 기반 + 드론 렌더)
import type { PhysicsState } from '../../Physics';
import { CHARACTER_X, GROUND_Y } from '../../../utils/constants';
import { BaseFollower } from '../BaseFollower';

const ORBIT_CENTER_Y = GROUND_Y - 120;

export class MiniDroneFollower extends BaseFollower {
  protected appearDistance = 100;
  protected entranceDuration = 1.5;

  private orbitPhase = 0;
  private flapPhase = 0; // 프로펠러 회전 위상

  protected onReset(): void {
    this.orbitPhase = 0;
    this.flapPhase = 0;
  }

  protected onUpdate(dt: number, _physicsState: PhysicsState): void {
    this.orbitPhase += dt * 1.2;
    this.flapPhase += dt * 8; // 드론 프로펠러 회전
  }

  protected onRender(ctx: CanvasRenderingContext2D, _groundY: number): void {
    const alpha = this.entranceProgress;

    const bx = CHARACTER_X + Math.sin(this.orbitPhase) * 40;
    const by = ORBIT_CENTER_Y + Math.sin(this.orbitPhase * 1.7) * 25;

    // drawDrone 기반 (cx=bx, cy=by+(10) 보정: 원본에서 cy-10이 by)
    // 원본: bx = cx + sin*6, by = cy - 10 + sin*5
    // 여기서는 orbitPhase 기반 bx/by 사용, 드론 위치를 그 자리에 두겠습니다
    const cx = bx + Math.sin(this.time * 0.8) * 6;
    const cy = by + Math.sin(this.time * 1.2) * 5;
    const propRot = this.flapPhase;

    ctx.save();
    ctx.globalAlpha = alpha;

    // 프로펠러 (회전)
    ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    const propLen = 14;
    for (let i = 0; i < 2; i++) {
      const a = propRot + i * Math.PI;
      ctx.save();
      ctx.translate(cx, cy - 10);
      ctx.fillStyle = 'rgba(150,180,220,0.7)';
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(a) * propLen * 0.5,
        Math.sin(a) * propLen * 0.5,
        propLen * 0.5, 3, a, 0, Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 몸통 (원반형 타원)
    ctx.fillStyle = '#CCDDEE'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(cx, cy, 22, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // 아래 돔
    ctx.fillStyle = '#AABBDD'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(cx, cy + 2, 12, 7, 0, 0, Math.PI); ctx.fill(); ctx.stroke();

    // 빨간 점 깜빡임
    const blink = Math.abs(Math.sin(this.time * 3)) > 0.5;
    ctx.fillStyle = blink ? '#FF3333' : '#440000';
    ctx.beginPath(); ctx.arc(cx + 16, cy - 1, 2.5, 0, Math.PI * 2); ctx.fill();

    // 중앙 나사/허브
    ctx.fillStyle = '#556677'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy - 10, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
