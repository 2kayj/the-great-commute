// 우주 팔로워 - 소형 UFO (SparrowFollower 움직임 기반 + UFO 렌더)
import type { PhysicsState } from '../../Physics';
import { CHARACTER_X, GROUND_Y } from '../../../utils/constants';
import { BaseFollower } from '../BaseFollower';

const FLIGHT_BASE_Y = GROUND_Y - 170;
const FLIGHT_BASE_X = CHARACTER_X - 55;

interface UFOConfig {
  formationOffsetX: number;
  formationOffsetY: number;
  phaseShift: number;
  flapPhaseShift: number;
}

// 3기 편대 (SparrowFollower와 동일한 V자 대형)
const UFO_CONFIGS: UFOConfig[] = [
  { formationOffsetX: 0,   formationOffsetY: 0,  phaseShift: 0,              flapPhaseShift: 0 },
  { formationOffsetX: -18, formationOffsetY: 10, phaseShift: Math.PI * 0.4,  flapPhaseShift: Math.PI * 0.5 },
  { formationOffsetX: 18,  formationOffsetY: 10, phaseShift: Math.PI * 0.8,  flapPhaseShift: Math.PI * 1.1 },
];

export class TinyUFOFollower extends BaseFollower {
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
    this.flapPhase += dt * 3.0;
  }

  protected onRender(ctx: CanvasRenderingContext2D, _groundY: number): void {
    const alpha = this.entranceProgress;

    ctx.save();
    ctx.globalAlpha = alpha;

    for (const config of UFO_CONFIGS) {
      this.renderUFO(ctx, config, alpha);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private renderUFO(ctx: CanvasRenderingContext2D, config: UFOConfig, alpha: number): void {
    const baseX = FLIGHT_BASE_X + config.formationOffsetX;
    const bobY = Math.sin(this.flightPhase + config.phaseShift) * 5;
    const bx = baseX;
    const by = FLIGHT_BASE_Y + config.formationOffsetY + bobY;

    const t = this.time + config.flapPhaseShift;

    ctx.save();

    // drawUFO 기반 (소형이므로 0.35 스케일 적용)
    ctx.translate(bx, by);
    ctx.scale(0.35, 0.35);

    const cx = 0, cy = 0;

    // 아래 삼각형 빛줄기
    const beamFlicker = 0.4 + Math.abs(Math.sin(t * 4)) * 0.4;
    ctx.globalAlpha = beamFlicker * alpha;
    const beamGrad = ctx.createLinearGradient(cx, cy + 8, cx, cy + 45);
    beamGrad.addColorStop(0, 'rgba(100,255,100,0.6)');
    beamGrad.addColorStop(1, 'rgba(100,255,100,0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 8);
    ctx.lineTo(cx - 22, cy + 45);
    ctx.lineTo(cx + 22, cy + 45);
    ctx.lineTo(cx + 10, cy + 8);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = alpha;

    // UFO 접시 (타원)
    ctx.fillStyle = '#BBCCDD'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(cx, cy, 28, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // UFO 위 돔
    ctx.fillStyle = 'rgba(200,230,255,0.85)'; ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(cx, cy - 4, 14, 10, 0, Math.PI, 0, true); ctx.fill(); ctx.stroke();

    // 돔 하이라이트
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.ellipse(cx - 3, cy - 9, 4, 3, -0.3, 0, Math.PI * 2); ctx.fill();

    // 하단 점멸 등
    const lights = [
      { x: -18, color: '#FF3333' },
      { x: 0,   color: '#3399FF' },
      { x: 18,  color: '#33FF66' },
    ];
    for (const l of lights) {
      const on = Math.abs(Math.sin(t * 3 + l.x)) > 0.5;
      ctx.fillStyle = on ? l.color : '#333344';
      ctx.strokeStyle = '#222222'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(cx + l.x, cy + 7, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }

    ctx.restore();
  }
}
