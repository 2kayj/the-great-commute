// 이세계 팔로워 - 박쥐 (SparrowFollower 움직임 기반 + 박쥐 렌더)
import type { PhysicsState } from '../../Physics';
import { CHARACTER_X, GROUND_Y } from '../../../utils/constants';
import { BaseFollower } from '../BaseFollower';

const FLIGHT_BASE_Y = GROUND_Y - 170;
const FLIGHT_BASE_X = CHARACTER_X - 55;

interface BatConfig {
  formationOffsetX: number;
  formationOffsetY: number;
  phaseShift: number;
  flapPhaseShift: number;
}

const BAT_CONFIGS: BatConfig[] = [
  { formationOffsetX: 0,   formationOffsetY: 0,  phaseShift: 0,              flapPhaseShift: 0 },
  { formationOffsetX: -18, formationOffsetY: 10, phaseShift: Math.PI * 0.4,  flapPhaseShift: Math.PI * 0.5 },
  { formationOffsetX: 18,  formationOffsetY: 10, phaseShift: Math.PI * 0.8,  flapPhaseShift: Math.PI * 1.1 },
];

export class BatFollower extends BaseFollower {
  protected appearDistance = 250;
  protected entranceDuration = 1.2;

  private flightPhase = 0;
  private flapPhase = 0;

  protected onReset(): void {
    this.flightPhase = 0;
    this.flapPhase = 0;
  }

  protected onUpdate(dt: number, _physicsState: PhysicsState): void {
    this.flightPhase += dt * 1.8;
    this.flapPhase += dt * 9.0;
  }

  protected onRender(ctx: CanvasRenderingContext2D, _groundY: number): void {
    const alpha = this.entranceProgress;

    ctx.save();
    ctx.globalAlpha = alpha;

    for (const config of BAT_CONFIGS) {
      this.renderBat(ctx, config);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private renderBat(ctx: CanvasRenderingContext2D, config: BatConfig): void {
    const baseX = FLIGHT_BASE_X + config.formationOffsetX;
    const bobY = Math.sin(this.flightPhase + config.phaseShift) * 5;
    const bx = baseX;
    const by = FLIGHT_BASE_Y + config.formationOffsetY + bobY;

    // drawBat에서 flapT = Math.abs(Math.sin(t * 8))
    // 여기서는 flapPhase를 사용
    const flapT = Math.abs(Math.sin(this.flapPhase + config.flapPhaseShift));

    ctx.save();
    ctx.translate(bx, by);

    // 날개 (V자)
    const wSpan = 26 * flapT;
    const wDip = 12 * (1 - flapT);

    ctx.fillStyle = '#442255';
    ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;

    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(s * wSpan * 0.5, -wSpan * 0.3, s * wSpan, -wDip);
      ctx.quadraticCurveTo(s * wSpan * 0.7, wDip * 0.5, 0, 4);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }

    // 몸통
    ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, 6, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // 귀 (뾰족)
    ctx.fillStyle = '#442255'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 3, -6);
      ctx.lineTo(s * 6, -14);
      ctx.lineTo(s * 8, -6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    // 눈 (붉은)
    ctx.fillStyle = '#FF3333';
    ctx.beginPath(); ctx.arc(-2.5, -2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2.5, -2, 2, 0, Math.PI * 2); ctx.fill();
    // 눈 광택
    ctx.fillStyle = '#FFAAAA';
    ctx.beginPath(); ctx.arc(-1.5, -3, 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3.5, -3, 0.8, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }
}
