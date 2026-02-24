// 이세계 팔로워 - 꼬마 정령 (ButterflyFollower 움직임 기반 + 정령 렌더)
import type { PhysicsState } from '../../Physics';
import { CHARACTER_X, GROUND_Y } from '../../../utils/constants';
import { BaseFollower } from '../BaseFollower';

const ORBIT_CENTER_Y = GROUND_Y - 120;

export class WispFollower extends BaseFollower {
  protected appearDistance = 100;
  protected entranceDuration = 1.5;

  private orbitPhase = 0;
  private flapPhase = 0;

  protected onReset(): void {
    this.orbitPhase = 0;
    this.flapPhase = 0;
  }

  protected onUpdate(dt: number, _physicsState: PhysicsState): void {
    this.orbitPhase += dt * 1.2;
    this.flapPhase += dt * 12;
  }

  protected onRender(ctx: CanvasRenderingContext2D, _groundY: number): void {
    const alpha = this.entranceProgress;

    // ButterflyFollower와 동일한 위치 계산
    const bx = CHARACTER_X + Math.sin(this.orbitPhase) * 40;
    const by = ORBIT_CENTER_Y + Math.sin(this.orbitPhase * 1.7) * 25;

    // drawSpirit 기반 렌더 (cx=bx, cy=by, t=this.time)
    const cx = bx;
    const cy = by;
    const t = this.time;

    // 정령 자체 위치 (지그재그 추가 움직임)
    const fx = cx + Math.sin(t * 1.5) * 15 + Math.sin(t * 3.7) * 5;
    const fy = cy - 10 + Math.sin(t * 2.1) * 12 + Math.sin(t * 4.3) * 4;

    ctx.save();
    ctx.globalAlpha = alpha;

    // 글로우
    const gr = ctx.createRadialGradient(fx, fy, 0, fx, fy, 26);
    gr.addColorStop(0, 'rgba(190,140,255,0.5)');
    gr.addColorStop(0.5, 'rgba(160,100,240,0.15)');
    gr.addColorStop(1, 'rgba(140,80,220,0)');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(fx, fy, 26, 0, Math.PI * 2); ctx.fill();

    // 몸체 (연보라 원)
    ctx.fillStyle = 'rgba(200,160,255,0.9)';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(fx, fy, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // 눈 두 개
    ctx.fillStyle = '#222222';
    ctx.beginPath(); ctx.arc(fx - 4, fy - 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(fx + 4, fy - 2, 2, 0, Math.PI * 2); ctx.fill();

    // 미소
    ctx.strokeStyle = '#222222'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(fx, fy + 2, 5, 0.1, Math.PI - 0.1);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
