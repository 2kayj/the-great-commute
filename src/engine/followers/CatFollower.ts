import type { PhysicsState } from '../Physics';
import { GROUND_Y, CANVAS_WIDTH } from '../../utils/constants';
import { BaseFollower } from './BaseFollower';

// 고양이가 최종적으로 앉아있을 X 위치 (화면 우측, 캐릭터 오른쪽)
const CAT_SEAT_X = CANVAS_WIDTH * 0.72;

// 등장 시작 위치 (화면 오른쪽 밖)
const ENTRANCE_START_X = CANVAS_WIDTH + 60;

// 고양이 크기 (강아지보다 약간 작게)
const CAT_SCALE = 0.55;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export class CatFollower extends BaseFollower {
  protected appearDistance = 200;

  // 고양이의 월드 기준 X 위치 (스크롤에 따라 감소)
  private catScreenX = ENTRANCE_START_X;

  // 이미 화면 밖으로 나갔는지 여부
  private done = false;

  // 꼬리 곡선 애니메이션 위상
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

    // 꼬리 위상 천천히 흔들기
    this.tailPhase += dt * 1.2;

    if (this.state === 'entering') {
      // entering 상태: 고양이가 오른쪽에서 앉을 위치로 슬라이드
      const easedX =
        ENTRANCE_START_X + (CAT_SEAT_X - ENTRANCE_START_X) * easeOutCubic(this.entranceProgress);
      this.catScreenX = easedX;
    } else {
      // following 상태: 캐릭터가 걸어가므로 스피드만큼 X가 왼쪽으로 밀림
      // 고양이는 지면에 앉아있고 캐릭터만 이동하는 효과
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

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(CAT_SCALE, CAT_SCALE);

    this.renderCat(ctx);

    ctx.restore();
  }

  private renderCat(ctx: CanvasRenderingContext2D): void {
    // 좌표 기준: (0, 0) = 발 닿는 지면
    // 앉은 자세: 몸통은 납작한 타원, 머리는 위에

    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // --- 꼬리 (몸통 뒤, 위로 곡선) ---
    this.renderTail(ctx);

    // --- 앉은 몸통 (아래에 납작한 타원) ---
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // 앉아있는 몸통: 세로로 약간 긴 타원 (엉덩이 표현)
    ctx.ellipse(0, -10, 11, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // --- 앞발 (앉아있는 자세, 아래로 뻗은 두 선) ---
    this.renderPaws(ctx);

    // --- 머리 ---
    this.renderHead(ctx);
  }

  private renderTail(ctx: CanvasRenderingContext2D): void {
    // 꼬리: 몸통 뒤(왼쪽)에서 시작해 위로 올라가는 S자 곡선
    // 살짝 흔들리는 효과
    const sway = Math.sin(this.tailPhase) * 3;

    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    // 흰색 굵은 선 먼저 (outline용)
    ctx.beginPath();
    ctx.moveTo(-8, -12);
    ctx.bezierCurveTo(
      -22 + sway, -28,
      -18 + sway, -48,
      -6 + sway,  -52
    );
    ctx.stroke();

    // 검은 외곽선
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, -12);
    ctx.bezierCurveTo(
      -22 + sway, -28,
      -18 + sway, -48,
      -6 + sway,  -52
    );
    ctx.stroke();

    ctx.restore();
  }

  private renderPaws(ctx: CanvasRenderingContext2D): void {
    // 앉은 자세에서 앞발: 몸통 앞쪽 아래로 짧게
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.5;

    // 왼쪽 앞발
    ctx.beginPath();
    ctx.moveTo(4, -2);
    ctx.lineTo(4, 4);
    ctx.stroke();

    // 오른쪽 앞발
    ctx.beginPath();
    ctx.moveTo(9, -2);
    ctx.lineTo(9, 4);
    ctx.stroke();

    // 발 끝 작은 원형
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.arc(4, 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(9, 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  private renderHead(ctx: CanvasRenderingContext2D): void {
    const headX = 5;
    const headY = -36;
    const headR = 12;

    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.5;

    // --- 귀 (뾰족한 삼각형, 머리 뒤에 먼저 그려 머리 위에 올라오게) ---
    ctx.fillStyle = '#FFFFFF';

    // 왼쪽 귀 (뒤쪽)
    ctx.beginPath();
    ctx.moveTo(headX - 8, headY - 2);
    ctx.lineTo(headX - 12, headY - headR - 6);
    ctx.lineTo(headX - 2, headY - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 오른쪽 귀 (앞쪽)
    ctx.beginPath();
    ctx.moveTo(headX + 2, headY - 4);
    ctx.lineTo(headX + 8, headY - headR - 6);
    ctx.lineTo(headX + 12, headY - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // --- 머리 원형 ---
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(headX, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // --- 주둥이 (약간 앞으로 돌출) ---
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(headX + 8, headY - 1);
    ctx.bezierCurveTo(
      headX + 15, headY - 2,
      headX + 15, headY + 5,
      headX + 8,  headY + 5
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // --- 눈 (작은 점, side view) ---
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(headX + 3, headY - 3, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // --- 코 (작은 삼각형 or 점) ---
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(headX + 13, headY + 2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // --- 수염 (양쪽 짧은 선) ---
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 0.8;

    // 위 수염
    ctx.beginPath();
    ctx.moveTo(headX + 11, headY + 1);
    ctx.lineTo(headX + 20, headY - 1);
    ctx.stroke();

    // 아래 수염
    ctx.beginPath();
    ctx.moveTo(headX + 11, headY + 3);
    ctx.lineTo(headX + 20, headY + 4);
    ctx.stroke();
  }
}
