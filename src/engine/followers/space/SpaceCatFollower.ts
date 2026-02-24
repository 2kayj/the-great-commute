// 우주 팔로워 - 외계 고양이 (CatFollower 움직임 기반 + 외계 고양이 렌더)
import type { PhysicsState } from '../../Physics';
import { GROUND_Y, CANVAS_WIDTH } from '../../../utils/constants';
import { BaseFollower } from '../BaseFollower';

const CAT_SEAT_X = CANVAS_WIDTH * 0.72;
const ENTRANCE_START_X = CANVAS_WIDTH + 60;
const CAT_SCALE = 0.55;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export class SpaceCatFollower extends BaseFollower {
  protected appearDistance = 200;

  private catScreenX = ENTRANCE_START_X;
  private done = false;
  private tailPhase = 0;

  protected onEnter(): void {
    this.catScreenX = ENTRANCE_START_X;
    this.done = false;
    this.tailPhase = 0;
  }

  protected onReset(): void {
    this.catScreenX = ENTRANCE_START_X;
    this.done = false;
    this.tailPhase = 0;
  }

  protected onUpdate(dt: number, physicsState: PhysicsState): void {
    if (this.done) return;

    this.tailPhase += dt * 1.2;

    if (this.state === 'entering') {
      const easedX =
        ENTRANCE_START_X + (CAT_SEAT_X - ENTRANCE_START_X) * easeOutCubic(this.entranceProgress);
      this.catScreenX = easedX;
    } else {
      this.catScreenX -= physicsState.speed * dt;

      if (this.catScreenX < -60) {
        this.done = true;
      }
    }
  }

  protected onRender(ctx: CanvasRenderingContext2D, _groundY: number): void {
    if (this.done) return;

    const x = this.catScreenX;
    const y = GROUND_Y;
    const t = this.time;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(CAT_SCALE, CAT_SCALE);

    // drawAlienCat 기반, 좌표 기준: (0, 0) = 발 닿는 지면
    // 원본에서 bx=cx, by=gY, translate(bx,by) 후 scale(0.9,0.9) — 여기서는 이미 translate됨
    ctx.save();
    ctx.scale(0.9, 0.9);

    // 초록 틴트 글로우
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#00FF88';
    ctx.beginPath(); ctx.ellipse(0, -30, 30, 40, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // 꼬리 (초록빛)
    const sw = Math.sin(this.tailPhase) * 3;
    ctx.strokeStyle = '#CCFFCC'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, -12);
    ctx.bezierCurveTo(-22 + sw, -28, -18 + sw, -48, -6 + sw, -52);
    ctx.stroke();
    ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, -12);
    ctx.bezierCurveTo(-22 + sw, -28, -18 + sw, -48, -6 + sw, -52);
    ctx.stroke();

    // 몸통 (연한 초록)
    ctx.fillStyle = '#EEFFEE'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, -10, 11, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // 앞발
    ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    for (const px of [4, 9]) {
      ctx.beginPath(); ctx.moveTo(px, -2); ctx.lineTo(px, 4); ctx.stroke();
      ctx.fillStyle = '#EEFFEE'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(px, 5, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }

    // 머리 부분
    const hx = 5, hy = -36, hr = 12;

    // 귀 왼
    ctx.fillStyle = '#EEFFEE'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(hx - 8, hy - 2); ctx.lineTo(hx - 12, hy - hr - 6); ctx.lineTo(hx - 2, hy - 4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // 귀 오른
    ctx.beginPath();
    ctx.moveTo(hx + 2, hy - 4); ctx.lineTo(hx + 8, hy - hr - 6); ctx.lineTo(hx + 12, hy - 2);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 안테나 두 개
    ctx.strokeStyle = '#222222'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(hx - 5, hy - hr); ctx.lineTo(hx - 10, hy - hr - 14); ctx.stroke();
    ctx.fillStyle = '#00FF88'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(hx - 10, hy - hr - 14, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#222222'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(hx + 5, hy - hr); ctx.lineTo(hx + 12, hy - hr - 12); ctx.stroke();
    ctx.fillStyle = '#00FF88'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(hx + 12, hy - hr - 12, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // 머리
    ctx.fillStyle = '#EEFFEE'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // 눈 (초록빛)
    ctx.fillStyle = '#00DD66'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(hx + 3, hy - 3, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#222222';
    ctx.beginPath(); ctx.arc(hx + 3, hy - 3, 1.5, 0, Math.PI * 2); ctx.fill();

    // 코
    ctx.fillStyle = '#00AA44';
    ctx.beginPath(); ctx.arc(hx + 13, hy + 2, 1.5, 0, Math.PI * 2); ctx.fill();

    // 주둥이
    ctx.fillStyle = 'rgba(220,255,220,0.5)'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hx + 8, hy - 1);
    ctx.bezierCurveTo(hx + 15, hy - 2, hx + 15, hy + 5, hx + 8, hy + 5);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 안 쓰인 t 변수 참조 방지용 (점멸 효과 활용)
    void t;

    ctx.restore();
    ctx.restore();
  }
}
