import type { PhysicsState } from '../Physics';
import { CHARACTER_X, GROUND_Y } from '../../utils/constants';
import { BaseFollower } from './BaseFollower';

// 참새가 비행하는 높이: 강아지 위 상공
const FLIGHT_BASE_Y = GROUND_Y - 170;
// 강아지와 같은 X 좌표 (CHARACTER_X - 55)
const FLIGHT_BASE_X = CHARACTER_X - 55;

// 참새 한 마리의 설정값
interface SparrowConfig {
  // V자 편대 내 X 오프셋 (리더 기준)
  formationOffsetX: number;
  // V자 편대 내 Y 오프셋 (리더 기준 — 날개끝으로 갈수록 뒤로 처짐)
  formationOffsetY: number;
  // 사인파 phase shift (개별 상하 움직임)
  phaseShift: number;
  // 날개 펄럭 phase shift
  flapPhaseShift: number;
}

// 3마리 V자 편대: 리더(중앙), 왼쪽 윙맨, 오른쪽 윙맨
const SPARROW_CONFIGS: SparrowConfig[] = [
  // 리더 — 맨 앞, 중앙
  { formationOffsetX: 0,   formationOffsetY: 0,  phaseShift: 0,              flapPhaseShift: 0 },
  // 왼쪽 윙맨 — 리더보다 약간 뒤, 왼쪽
  { formationOffsetX: -18, formationOffsetY: 10, phaseShift: Math.PI * 0.4,  flapPhaseShift: Math.PI * 0.5 },
  // 오른쪽 윙맨 — 리더보다 약간 뒤, 오른쪽
  { formationOffsetX: 18,  formationOffsetY: 10, phaseShift: Math.PI * 0.8,  flapPhaseShift: Math.PI * 1.1 },
];

export class SparrowFollower extends BaseFollower {
  protected appearDistance = 250;
  protected entranceDuration = 1.2;

  // 공용 위상 (편대 전체가 함께 전진하는 미세 흔들림)
  private flightPhase = 0;
  // 날개 펄럭 위상
  private flapPhase = 0;

  protected onReset(): void {
    this.flightPhase = 0;
    this.flapPhase = 0;
  }

  protected onUpdate(dt: number, _physicsState: PhysicsState): void {
    this.flightPhase += dt * 1.8;
    this.flapPhase    += dt * 9.0;
  }

  protected onRender(ctx: CanvasRenderingContext2D, _groundY: number): void {
    const alpha = this.entranceProgress;

    ctx.save();
    ctx.globalAlpha = alpha;

    for (const config of SPARROW_CONFIGS) {
      this.renderSparrow(ctx, config);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private renderSparrow(ctx: CanvasRenderingContext2D, config: SparrowConfig): void {
    // 편대 기준 위치: 캐릭터 X 위 상공
    const baseX = FLIGHT_BASE_X + config.formationOffsetX;

    // 각 새마다 phase shift가 다른 사인파로 자연스러운 상하 움직임
    const bobY = Math.sin(this.flightPhase + config.phaseShift) * 5;
    const bx = baseX;
    const by = FLIGHT_BASE_Y + config.formationOffsetY + bobY;

    // 날개 펄럭: |sin|로 0~1 범위, 개별 phase shift 적용
    const flapT = Math.abs(Math.sin(this.flapPhase + config.flapPhaseShift));

    ctx.save();
    ctx.translate(bx, by);

    // 몸통 (타원, 흰색 fill + 검은 outline)
    this.renderBody(ctx, flapT);

    // 날개 (펼침/접힘)
    this.renderWings(ctx, flapT);

    // 머리 (원)
    this.renderHead(ctx);

    ctx.restore();
  }

  // 몸통: 약간 기울어진 타원
  private renderBody(ctx: CanvasRenderingContext2D, _flapT: number): void {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // 몸통: 가로 5px, 세로 3px 타원, 살짝 앞으로 기울임
    ctx.ellipse(0, 2, 5, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 날개: 위로 펼침 (flapT=1) / 아래로 접힘 (flapT=0)
  private renderWings(ctx: CanvasRenderingContext2D, flapT: number): void {
    // 날개 펼침 높이: 0(접힘) ~ 7px(완전 펼침)
    const wingSpan = 7;
    const wingWidth = 6;

    // flapT=1이면 위로 펼쳐짐, flapT=0이면 수평
    const wingY = -flapT * wingSpan;

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;

    // 왼쪽 날개
    ctx.beginPath();
    ctx.moveTo(-1, 1);
    ctx.quadraticCurveTo(-wingWidth * 0.6, wingY * 0.5, -wingWidth, wingY);
    ctx.quadraticCurveTo(-wingWidth * 0.8, wingY + 3, -1, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 오른쪽 날개
    ctx.beginPath();
    ctx.moveTo(1, 1);
    ctx.quadraticCurveTo(wingWidth * 0.6, wingY * 0.5, wingWidth, wingY);
    ctx.quadraticCurveTo(wingWidth * 0.8, wingY + 3, 1, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 머리: 원 + 눈 + 부리
  private renderHead(ctx: CanvasRenderingContext2D): void {
    const headX = 4;
    const headY = -1;
    const headR = 3;

    // 머리 원
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(headX, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 눈: 작은 점
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(headX + 1.5, headY - 0.5, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // 부리: 작은 삼각형 (오른쪽을 향함)
    ctx.fillStyle = '#222222';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(headX + headR - 0.5, headY);
    ctx.lineTo(headX + headR + 3, headY + 0.5);
    ctx.lineTo(headX + headR - 0.5, headY + 1.5);
    ctx.closePath();
    ctx.fill();
  }
}
