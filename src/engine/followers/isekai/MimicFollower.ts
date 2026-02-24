// 이세계 팔로워 - 미믹 상자 (CatFollower 움직임 기반 + 미믹 렌더)
import type { PhysicsState } from '../../Physics';
import { GROUND_Y, CANVAS_WIDTH } from '../../../utils/constants';
import { BaseFollower } from '../BaseFollower';

const MIMIC_SEAT_X = CANVAS_WIDTH * 0.72;
const ENTRANCE_START_X = CANVAS_WIDTH + 60;
const MIMIC_SCALE = 0.55;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export class MimicFollower extends BaseFollower {
  protected appearDistance = 200;

  private mimicScreenX = ENTRANCE_START_X;
  private done = false;
  private walkPhase = 0;

  protected onEnter(): void {
    this.mimicScreenX = ENTRANCE_START_X;
    this.done = false;
    this.walkPhase = 0;
  }

  protected onReset(): void {
    this.mimicScreenX = ENTRANCE_START_X;
    this.done = false;
    this.walkPhase = 0;
  }

  protected onUpdate(dt: number, physicsState: PhysicsState): void {
    if (this.done) return;

    this.walkPhase += dt * 2;

    if (this.state === 'entering') {
      const easedX =
        ENTRANCE_START_X +
        (MIMIC_SEAT_X - ENTRANCE_START_X) * easeOutCubic(this.entranceProgress);
      this.mimicScreenX = easedX;
    } else {
      this.mimicScreenX -= physicsState.speed * dt;

      if (this.mimicScreenX < -60) {
        this.done = true;
      }
    }
  }

  protected onRender(ctx: CanvasRenderingContext2D, _groundY: number): void {
    if (this.done) return;

    const x = this.mimicScreenX;
    const y = GROUND_Y;
    const t = this.time;

    ctx.save();
    // CatFollower와 동일하게 translate + scale
    ctx.translate(x, y);
    ctx.scale(MIMIC_SCALE, MIMIC_SCALE);

    // 이하 좌표는 (0,0) = 발 닿는 지면 기준
    // drawMimic에서 gY = cy + 45이고 bx=cx, by=gY
    // 여기서 cx=0, cy=-45이므로 by=0
    const bx = 0, by = 0;
    const walkPhase = this.walkPhase;

    // 다리 두 개
    ctx.strokeStyle = '#222222'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      const sw = Math.sin(walkPhase + (side < 0 ? 0 : Math.PI)) * 5;
      ctx.beginPath();
      ctx.moveTo(bx + side * 10, by - 2);
      ctx.lineTo(bx + side * 12 + sw, by);
      ctx.stroke();
    }

    // 상자 몸통 (갈색)
    ctx.fillStyle = '#C89040';
    ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bx - 22, by - 38, 44, 30, 3);
    ctx.fill(); ctx.stroke();

    // 상자 장식선
    ctx.strokeStyle = '#222222'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(bx - 22, by - 28); ctx.lineTo(bx + 22, by - 28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx, by - 38); ctx.lineTo(bx, by - 8); ctx.stroke();

    // 뚜껑 (살짝 열림 + 미세 떨림)
    const lidAngle = -0.25 + Math.sin(t * 2) * 0.08;
    ctx.save();
    ctx.translate(bx - 22, by - 38);
    ctx.rotate(lidAngle);
    ctx.fillStyle = '#D4A045';
    ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(0, -10, 44, 12, [3, 3, 0, 0]);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // 뚜껑 안에서 보이는 눈 두 개
    const eyeY = by - 40;
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#222222'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(bx - 7, eyeY, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(bx + 7, eyeY, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#222222';
    ctx.beginPath(); ctx.arc(bx - 7, eyeY, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx + 7, eyeY, 2, 0, Math.PI * 2); ctx.fill();

    // 자물쇠
    ctx.fillStyle = '#FFD700'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(bx, by - 23, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(bx - 3, by - 23, 6, 5); ctx.fill(); ctx.stroke();

    ctx.restore();
  }
}
