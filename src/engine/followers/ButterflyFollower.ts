import type { PhysicsState } from '../Physics';
import { CHARACTER_X, GROUND_Y } from '../../utils/constants';
import { BaseFollower } from './BaseFollower';

const ORBIT_CENTER_Y = GROUND_Y - 120;

export class ButterflyFollower extends BaseFollower {
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
    const alpha = this.entranceProgress; // 0→1 fade in during entering state
    const bx = CHARACTER_X + Math.sin(this.orbitPhase) * 40;
    const by = ORBIT_CENTER_Y + Math.sin(this.orbitPhase * 1.7) * 25;

    const flapScale = Math.abs(Math.sin(this.flapPhase));

    ctx.save();
    ctx.globalAlpha = alpha;

    this.renderWings(ctx, bx, by, flapScale);
    this.renderBody(ctx, bx, by);
    this.renderAntennae(ctx, bx, by);

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private renderWings(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    flapScale: number
  ): void {
    ctx.save();
    ctx.translate(bx, by);

    const wingColor = '#FFD700';
    const wingOutline = '#FF8C00';

    // Upper wings (larger)
    const upperW = 18 * flapScale;
    const upperH = 14;

    // Left upper wing
    ctx.fillStyle = wingColor;
    ctx.strokeStyle = wingOutline;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-upperW * 0.3, -upperH * 0.5, -upperW, -upperH, -upperW, -upperH * 0.3);
    ctx.bezierCurveTo(-upperW, upperH * 0.1, -upperW * 0.3, upperH * 0.3, 0, 0);
    ctx.fill();
    ctx.stroke();

    // Right upper wing
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(upperW * 0.3, -upperH * 0.5, upperW, -upperH, upperW, -upperH * 0.3);
    ctx.bezierCurveTo(upperW, upperH * 0.1, upperW * 0.3, upperH * 0.3, 0, 0);
    ctx.fill();
    ctx.stroke();

    // Lower wings (smaller)
    const lowerW = 12 * flapScale;
    const lowerH = 10;

    // Left lower wing
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-lowerW * 0.3, lowerH * 0.3, -lowerW, lowerH, -lowerW * 0.8, lowerH * 0.5);
    ctx.bezierCurveTo(-lowerW * 0.5, lowerH * 0.1, -lowerW * 0.2, lowerH * 0.1, 0, 0);
    ctx.fill();
    ctx.stroke();

    // Right lower wing
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(lowerW * 0.3, lowerH * 0.3, lowerW, lowerH, lowerW * 0.8, lowerH * 0.5);
    ctx.bezierCurveTo(lowerW * 0.5, lowerH * 0.1, lowerW * 0.2, lowerH * 0.1, 0, 0);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private renderBody(ctx: CanvasRenderingContext2D, bx: number, by: number): void {
    ctx.save();
    ctx.fillStyle = '#222222';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(bx, by, 2, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private renderAntennae(ctx: CanvasRenderingContext2D, bx: number, by: number): void {
    ctx.save();
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    // Left antenna
    ctx.beginPath();
    ctx.moveTo(bx - 1, by - 6);
    ctx.quadraticCurveTo(bx - 6, by - 14, bx - 8, by - 18);
    ctx.stroke();

    // Left antenna tip dot
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(bx - 8, by - 18, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Right antenna
    ctx.beginPath();
    ctx.moveTo(bx + 1, by - 6);
    ctx.quadraticCurveTo(bx + 6, by - 14, bx + 8, by - 18);
    ctx.stroke();

    // Right antenna tip dot
    ctx.beginPath();
    ctx.arc(bx + 8, by - 18, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
