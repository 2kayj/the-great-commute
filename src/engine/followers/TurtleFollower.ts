import type { PhysicsState } from '../Physics';
import { CHARACTER_X, GROUND_Y } from '../../utils/constants';
import { BaseFollower } from './BaseFollower';

// 거북이는 캐릭터 측방 오른쪽 30px에 나란히 걸음
const TURTLE_X = CHARACTER_X + 30;

// 등장 시작 위치 (화면 오른쪽 밖)
const ENTRANCE_START_X = CHARACTER_X + 180;

// easeOutBack: 살짝 오버슛 후 정착
function easeOutBack(t: number): number {
  return 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
}

export class TurtleFollower extends BaseFollower {
  protected appearDistance = 50;

  // 다리 위상 (4개 다리 교대 보행)
  private walkPhase = 0;

  // 머리 집어넣기 타이머
  private hideHeadTimer = 0;
  private hideHeadInterval = 12; // 처음 대기 시간 (초), 10~15초 사이에서 변동
  private hideHeadPhase: 'out' | 'hiding' | 'hidden' | 'showing' = 'out';
  private hideHeadProgress = 0;
  private readonly HIDE_DURATION = 0.25;  // 집어넣는 시간
  private readonly HIDDEN_DURATION = 1.0; // 숨어있는 시간
  private readonly SHOW_DURATION = 0.3;   // 내미는 시간

  protected onEnter(): void {
    this.walkPhase = 0;
    this.hideHeadTimer = 0;
    this.hideHeadInterval = 12 + Math.random() * 3; // 12~15초
    this.hideHeadPhase = 'out';
    this.hideHeadProgress = 0;
  }

  protected onReset(): void {
    this.walkPhase = 0;
    this.hideHeadTimer = 0;
    this.hideHeadInterval = 12 + Math.random() * 3;
    this.hideHeadPhase = 'out';
    this.hideHeadProgress = 0;
  }

  protected onUpdate(dt: number, physicsState: PhysicsState): void {
    // 거북이는 천천히 걷기 때문에 phase 배율을 낮게 설정
    this.walkPhase += (physicsState.speed / 80) * dt * Math.PI * 1.6;

    // 머리 집어넣기 타이머 관리
    if (this.hideHeadPhase === 'out') {
      this.hideHeadTimer += dt;
      if (this.hideHeadTimer >= this.hideHeadInterval) {
        this.hideHeadPhase = 'hiding';
        this.hideHeadProgress = 0;
      }
    } else if (this.hideHeadPhase === 'hiding') {
      this.hideHeadProgress += dt / this.HIDE_DURATION;
      if (this.hideHeadProgress >= 1) {
        this.hideHeadProgress = 1;
        this.hideHeadPhase = 'hidden';
        this.hideHeadTimer = 0;
      }
    } else if (this.hideHeadPhase === 'hidden') {
      this.hideHeadTimer += dt;
      if (this.hideHeadTimer >= this.HIDDEN_DURATION) {
        this.hideHeadPhase = 'showing';
        this.hideHeadProgress = 1;
      }
    } else if (this.hideHeadPhase === 'showing') {
      this.hideHeadProgress -= dt / this.SHOW_DURATION;
      if (this.hideHeadProgress <= 0) {
        this.hideHeadProgress = 0;
        this.hideHeadPhase = 'out';
        this.hideHeadTimer = 0;
        // 다음 집어넣기 간격 랜덤 설정 (10~15초)
        this.hideHeadInterval = 10 + Math.random() * 5;
      }
    }
  }

  protected onRender(ctx: CanvasRenderingContext2D, _groundY: number): void {
    const easedProgress = easeOutBack(Math.min(this.entranceProgress, 1));
    const currentX = this.entranceProgress >= 1
      ? TURTLE_X
      : ENTRANCE_START_X + (TURTLE_X - ENTRANCE_START_X) * easedProgress;

    // 거북이는 작게 상하 바운스 (강아지보다 작은 진폭)
    const bodyBob = Math.abs(Math.sin(this.walkPhase)) * -1.2;
    const bodyX = currentX;
    const bodyY = GROUND_Y + bodyBob;

    // 머리 집어넣기 비율 (0 = 완전히 나옴, 1 = 완전히 들어감)
    const headHideRatio = this.hideHeadProgress;

    ctx.save();

    // --- 다리 (등껍데기 아래에 렌더) ---
    this.renderLegs(ctx, bodyX, bodyY);

    // --- 꼬리 ---
    this.renderTail(ctx, bodyX, bodyY);

    // --- 등껍데기 (중심 레이어) ---
    this.renderShell(ctx, bodyX, bodyY);

    // --- 머리 (껍데기 위에, 집어넣기 상태에 따라) ---
    this.renderHead(ctx, bodyX, bodyY, headHideRatio);

    ctx.restore();
  }

  private renderLegs(ctx: CanvasRenderingContext2D, bodyX: number, bodyY: number): void {
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    // 거북이 4다리: 앞 2개 (bodyX + 8 부근), 뒤 2개 (bodyX - 8 부근)
    // 4개 다리를 교대로 움직이기 위해 각각 위상 오프셋 적용
    // 대각선 보행 패턴: 앞오른-뒤왼 / 앞왼-뒤오른
    const legDefs = [
      { baseX: bodyX + 9,  phase: this.walkPhase,              side: 1  },  // 앞오른
      { baseX: bodyX - 9,  phase: this.walkPhase + Math.PI,    side: 1  },  // 앞왼
      { baseX: bodyX + 7,  phase: this.walkPhase + Math.PI,    side: -1 },  // 뒤오른 (앞왼과 동위상)
      { baseX: bodyX - 7,  phase: this.walkPhase,              side: -1 },  // 뒤왼 (앞오른과 동위상)
    ];

    const hipY = bodyY - 4;

    for (const leg of legDefs) {
      // 거북이 다리: 짧고 굵게, 수평 방향으로 퍼짐
      const swing = Math.sin(leg.phase) * 3;
      // side: 1 = 앞, -1 = 뒤
      const legExtendX = leg.side * 6;
      const kneeX = leg.baseX + legExtendX + swing * 0.3;
      const kneeY = hipY + 4;
      const footX = kneeX + swing * 0.6;
      const footY = bodyY; // 지면에 닿는 높이

      ctx.beginPath();
      ctx.moveTo(leg.baseX, hipY);
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(footX, footY);
      ctx.stroke();
    }
  }

  private renderTail(ctx: CanvasRenderingContext2D, bodyX: number, bodyY: number): void {
    // 짧은 뾰족한 꼬리 (뒤쪽)
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    const tailStartX = bodyX - 12;
    const tailStartY = bodyY - 6;
    const tailEndX = bodyX - 18;
    const tailEndY = bodyY - 4;

    ctx.beginPath();
    ctx.moveTo(tailStartX, tailStartY);
    ctx.lineTo(tailEndX, tailEndY);
    ctx.stroke();
  }

  private renderShell(ctx: CanvasRenderingContext2D, bodyX: number, bodyY: number): void {
    const shellCX = bodyX;
    const shellCY = bodyY - 9;
    const shellRX = 13; // 가로 반지름
    const shellRY = 9;  // 세로 반지름

    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 등껍데기 흰색 채우기
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(shellCX, shellCY, shellRX, shellRY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 6각형 패턴 (등껍데기 위에 작은 선들로 표현)
    this.renderShellPattern(ctx, shellCX, shellCY, shellRX, shellRY);
  }

  private renderShellPattern(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rx: number,
    ry: number
  ): void {
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 0.8;
    ctx.lineCap = 'round';

    // 클리핑 마스크: 등껍데기 타원 안에만 그리기
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx - 1, ry - 1, 0, 0, Math.PI * 2);
    ctx.clip();

    // 6각형 패턴: 중앙 하나 + 주변 6개를 간략하게 표현
    // 작은 선들로만 구성 (미니멀)
    const hexSize = 4.5;
    const hexCenters = [
      { x: cx,        y: cy - 2     },  // 중앙
      { x: cx + 7,    y: cy - 2     },  // 오른쪽
      { x: cx - 7,    y: cy - 2     },  // 왼쪽
      { x: cx + 3.5,  y: cy - 5.5   },  // 오른쪽 위
      { x: cx - 3.5,  y: cy - 5.5   },  // 왼쪽 위
      { x: cx + 3.5,  y: cy + 1.5   },  // 오른쪽 아래
      { x: cx - 3.5,  y: cy + 1.5   },  // 왼쪽 아래
    ];

    for (const center of hexCenters) {
      this.drawHexOutline(ctx, center.x, center.y, hexSize);
    }

    ctx.restore();
  }

  private drawHexOutline(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number
  ): void {
    // 납작한 hexagon (flat-top): 6개 꼭짓점을 선으로 연결
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i; // flat-top hexagon
      const px = cx + size * Math.cos(angle);
      const py = cy + size * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }

  private renderHead(
    ctx: CanvasRenderingContext2D,
    bodyX: number,
    bodyY: number,
    hideRatio: number
  ): void {
    // hideRatio: 0 = 완전히 나온 상태, 1 = 완전히 껍데기 안
    // 머리가 들어갈수록 x 이동 (왼쪽으로, 껍데기 안으로)
    const headFullX = bodyX + 14;
    const headHiddenX = bodyX + 6; // 껍데기 앞쪽 테두리 근방
    const headX = headFullX + (headHiddenX - headFullX) * hideRatio;

    const headY = bodyY - 9;

    // 목 (껍데기 앞쪽과 머리 사이 연결)
    const neckBaseX = bodyX + 11;
    const neckBaseY = bodyY - 9;

    // hideRatio가 높을수록 목이 짧아지고 머리가 껍데기 안으로
    const neckLength = (1 - hideRatio) * 6;

    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    // 목 선 (머리가 나올 때만 표시)
    if (hideRatio < 0.9) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(neckBaseX, neckBaseY);
      ctx.lineTo(neckBaseX + neckLength, headY);
      ctx.stroke();

      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(neckBaseX, neckBaseY);
      ctx.lineTo(neckBaseX + neckLength, headY);
      ctx.stroke();
    }

    // 머리가 완전히 들어간 상태면 렌더하지 않음
    if (hideRatio >= 1) return;

    // 머리 알파 (들어가는 중에 페이드)
    const headAlpha = 1 - Math.max(0, hideRatio - 0.6) / 0.4;
    ctx.globalAlpha = headAlpha;

    // 머리: 작은 타원 (거북이 머리 옆 모습)
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(headX, headY, 5, 4, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 눈: 작은 점
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(headX + 3, headY - 1, 1, 0, Math.PI * 2);
    ctx.fill();

    // 코: 아주 작은 점
    ctx.beginPath();
    ctx.arc(headX + 5, headY + 1, 0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}
