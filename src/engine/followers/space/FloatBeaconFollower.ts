// 우주 팔로워 - 부유 신호등 (FireflyFollower 움직임 기반 + 신호등 렌더)
import type { PhysicsState } from '../../Physics';
import { CHARACTER_X, GROUND_Y } from '../../../utils/constants';
import { BaseFollower } from '../BaseFollower';

const SWARM_CENTER_X = CHARACTER_X - 30;
const SWARM_CENTER_Y = GROUND_Y - 80;

// FloatBeacon은 단일 오브젝트이므로 SWARM 중심 사용
export class FloatBeaconFollower extends BaseFollower {
  protected appearDistance = 350;
  protected entranceDuration = 2.0;

  private orbitTime = 0;

  protected onEnter(): void {
    this.orbitTime = 0;
  }

  protected onReset(): void {
    this.orbitTime = 0;
  }

  protected onUpdate(dt: number, _physicsState: PhysicsState): void {
    this.orbitTime += dt;
  }

  protected onRender(ctx: CanvasRenderingContext2D, _groundY: number): void {
    const baseAlpha = this.entranceProgress;

    // 부유 위치: SWARM_CENTER 근방에서 상하 부유
    const bx = SWARM_CENTER_X;
    const by = SWARM_CENTER_Y + Math.sin(this.orbitTime * 1.0) * 6;
    const tilt = Math.sin(this.orbitTime * 1.0) * 0.08;
    const t = this.time;

    // drawFloatingLight 기반 (cx=bx, cy=by-5이므로 위로 5px)
    const cx = bx;
    const cy = by - 5;

    // 신호등 주기
    const period = 6;
    const phase = t % period;

    ctx.save();
    ctx.globalAlpha = baseAlpha;
    ctx.translate(cx, cy);
    ctx.rotate(tilt);

    // 매달리는 선
    ctx.strokeStyle = '#444444'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(0, -28); ctx.stroke();

    // 케이스 (직사각형)
    ctx.fillStyle = '#333344'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(-14, -28, 28, 56, 4); ctx.fill(); ctx.stroke();

    // 신호등 3개
    const signalColors = [
      { y: -18, active: phase >= 4 },
      { y: 0,   active: phase >= 3 && phase < 4 },
      { y: 18,  active: phase < 3 },
    ];
    const baseColors = ['#440000', '#444400', '#004400'];
    const activeColors = ['#FF3333', '#FFDD22', '#33DD33'];
    const glowColors = [
      'rgba(255,50,50,0.5)',
      'rgba(255,220,30,0.5)',
      'rgba(50,220,50,0.5)',
    ];

    for (let i = 0; i < 3; i++) {
      const sc = signalColors[i];
      // 글로우
      if (sc.active) {
        const gr = ctx.createRadialGradient(0, sc.y, 0, 0, sc.y, 14);
        gr.addColorStop(0, glowColors[i]);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(0, sc.y, 14, 0, Math.PI * 2); ctx.fill();
      }
      // 렌즈
      ctx.fillStyle = sc.active ? activeColors[i] : baseColors[i];
      ctx.strokeStyle = '#222222'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, sc.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // 하이라이트
      if (sc.active) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath(); ctx.arc(-2.5, sc.y - 2.5, 3, 0, Math.PI * 2); ctx.fill();
      }
    }

    // 하단 태양전지판
    ctx.fillStyle = '#446688'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.roundRect(-10, 28, 20, 6, 1); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#335566'; ctx.lineWidth = 0.5;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(i * 6.5, 28); ctx.lineTo(i * 6.5, 34); ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
