import { VerletChain } from './VerletChain';
import { COLORS } from '../utils/constants';
import { wobbleOffset } from '../utils/math';

export class CharacterRenderer {
  private leftArm: VerletChain;
  private rightArm: VerletChain;
  private leftLeg: VerletChain;
  private rightLeg: VerletChain;
  private neck: VerletChain;

  private time: number = 0;

  // Body dimensions
  private readonly bodyW = 22;
  private readonly bodyH = 18;
  private readonly headR = 14;
  private readonly neckLen = 10;

  constructor() {
    this.leftArm  = new VerletChain(4, 10, 0.3, 0.96);
    this.rightArm = new VerletChain(4, 10, 0.3, 0.96);
    this.leftLeg  = new VerletChain(5, 13, 0.45, 0.90, 1, 3);
    this.rightLeg = new VerletChain(5, 13, 0.45, 0.90, 1, 3);
    this.neck     = new VerletChain(3, 5, 0.12, 0.985, -1);
  }

  update(
    centerX: number,
    groundY: number,
    walkPhase: number,
    _angle: number,
    deltaTime: number
  ): void {
    this.time += deltaTime;

    const bodyTopY = groundY - this.bodyH * 2 - this.neckLen - this.headR * 2 - 20;
    const bodyBottomY = bodyTopY + this.bodyH * 2;

    const bodySwayX = Math.sin(walkPhase * 2) * 3;
    const bodyBobY  = Math.abs(Math.sin(walkPhase)) * -4;

    const bx = centerX + bodySwayX;
    const by = bodyTopY + bodyBobY;

    // Ellipse center is at (bx, by + bodyH) where bodyH = 18, so center = by + 18
    // Ellipse rx = bodyW(22), ry = bodyH(18)
    // Shoulder: upper side of ellipse, angle ~-PI/2 shifted outward
    // At the widest horizontal point (equator level) the ellipse edge is at ±rx from center
    // We place shoulders at the ellipse edge at the upper quarter: y = centerY - ry * 0.5
    const bodyCenterY = by + this.bodyH; // ellipse center Y
    const shoulderOffsetY = -this.bodyH * 0.5; // upper quarter of ellipse
    const shoulderY = bodyCenterY + shoulderOffsetY;
    // At that Y offset, the ellipse x-radius is: rx * sqrt(1 - (offsetY/ry)^2)
    const shoulderXRadius = this.bodyW * Math.sqrt(1 - Math.pow(shoulderOffsetY / this.bodyH, 2));

    // Arm anchors: pinned exactly to ellipse surface
    const leftShoulderX  = bx - shoulderXRadius;
    const rightShoulderX = bx + shoulderXRadius;

    const armSwing = Math.sin(walkPhase) * 0.6;
    const leftArmAnchorX  = leftShoulderX  + Math.sin(-armSwing) * 8;
    const leftArmAnchorY  = shoulderY      + Math.cos(-armSwing) * 4;
    const rightArmAnchorX = rightShoulderX + Math.sin(armSwing)  * 8;
    const rightArmAnchorY = shoulderY      + Math.cos(armSwing)  * 4;

    this.leftArm.update(leftArmAnchorX, leftArmAnchorY);
    this.rightArm.update(rightArmAnchorX, rightArmAnchorY);

    // Leg anchors: pinned to lower ellipse edge
    const hipOffsetY = this.bodyH * 0.6;
    const hipY = bodyCenterY + hipOffsetY;
    const hipXRadius = this.bodyW * Math.sqrt(1 - Math.pow(hipOffsetY / this.bodyH, 2));

    const leftHipX  = bx - hipXRadius * 0.5;
    const rightHipX = bx + hipXRadius * 0.5;

    const hipSwing = Math.sin(walkPhase) * 6;
    const leftLegAnchorX  = leftHipX  - hipSwing;
    const leftLegAnchorY  = hipY;
    const rightLegAnchorX = rightHipX + hipSwing;
    const rightLegAnchorY = hipY;

    this.leftLeg.update(leftLegAnchorX, leftLegAnchorY);
    this.rightLeg.update(rightLegAnchorX, rightLegAnchorY);

    // Neck
    const neckBaseX = bx;
    const neckBaseY = by - 2;
    this.neck.update(neckBaseX, neckBaseY);
  }

  render(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    groundY: number,
    angle: number,
    walkPhase: number,
    isFallen: boolean = false
  ): void {
    ctx.save();
    ctx.translate(centerX, groundY);
    ctx.rotate(angle);
    ctx.translate(-centerX, -groundY);

    if (isFallen) {
      this.renderFallen(ctx, centerX, groundY);
      ctx.restore();
      return;
    }

    const bodyH2 = this.bodyH * 2;
    const bodyTopY = groundY - bodyH2 - this.neckLen - this.headR * 2 - 20;

    const bodySwayX = Math.sin(walkPhase * 2) * 3;
    const bodyBobY  = Math.abs(Math.sin(walkPhase)) * -4;
    const bx = centerX + bodySwayX;
    const by = bodyTopY + bodyBobY;

    // Legs (behind body) - Verlet chain
    this.leftLeg.render(ctx, 3, 2, COLORS.line);
    this.rightLeg.render(ctx, 3, 2, COLORS.line);

    // Body
    ctx.save();
    ctx.strokeStyle = COLORS.line;
    ctx.fillStyle = COLORS.bg;
    ctx.lineWidth = 2.5;

    // Wobble on body outline
    const t = this.time;
    ctx.beginPath();
    const wx = wobbleOffset(1, t, 1.5);
    const wy = wobbleOffset(2, t, 1.5);
    ctx.ellipse(
      bx + wx,
      by + bodyH2 / 2 + wy,
      this.bodyW + wobbleOffset(3, t, 1),
      this.bodyH + wobbleOffset(4, t, 1),
      0, 0, Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    // Necktie (small triangle)
    ctx.fillStyle = '#333333';
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, by + bodyH2 / 2 - 8);
    ctx.lineTo(bx + 4, by + bodyH2 / 2 + 4);
    ctx.lineTo(bx - 4, by + bodyH2 / 2 + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Arms (in front)
    this.leftArm.render(ctx, 2.5, 1.5, COLORS.line);

    // Right arm + coffee tray
    this.rightArm.render(ctx, 2.5, 1.5, COLORS.line);
    this.renderCoffeeTray(ctx);

    // Neck chain
    this.neck.render(ctx, 2.5, 2, COLORS.line);

    // Head
    const headX = this.neck.nodes.length > 0
      ? this.neck.nodes[this.neck.nodes.length - 1].x
      : bx;
    const headY = this.neck.nodes.length > 0
      ? this.neck.nodes[this.neck.nodes.length - 1].y
      : by - this.neckLen;

    this.renderHead(ctx, headX, headY, false);

    ctx.restore();
  }

  private renderHead(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    fallen: boolean
  ): void {
    const r = this.headR;
    const t = this.time;

    ctx.save();
    ctx.strokeStyle = COLORS.line;
    ctx.fillStyle = COLORS.bg;
    ctx.lineWidth = 2.5;

    // Head circle with wobble
    ctx.beginPath();
    ctx.arc(x + wobbleOffset(10, t, 1), y + wobbleOffset(11, t, 1), r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (fallen) {
      // X eyes
      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 2;
      const ex1 = x - 5, ex2 = x + 5, ey = y - 3;
      ctx.beginPath();
      ctx.moveTo(ex1 - 3, ey - 3); ctx.lineTo(ex1 + 3, ey + 3);
      ctx.moveTo(ex1 + 3, ey - 3); ctx.lineTo(ex1 - 3, ey + 3);
      ctx.moveTo(ex2 - 3, ey - 3); ctx.lineTo(ex2 + 3, ey + 3);
      ctx.moveTo(ex2 + 3, ey - 3); ctx.lineTo(ex2 - 3, ey + 3);
      ctx.stroke();

      // Sad beak
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x - 5, y + 7);
      ctx.quadraticCurveTo(x, y + 13, x + 5, y + 7);
      ctx.stroke();
    } else {
      // Normal eyes (dots)
      ctx.fillStyle = COLORS.line;
      ctx.beginPath();
      ctx.arc(x - 5 + wobbleOffset(12, t, 0.5), y - 3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 5 + wobbleOffset(13, t, 0.5), y - 3, 2, 0, Math.PI * 2);
      ctx.fill();

      // Beak (triangle pointing down)
      ctx.fillStyle = COLORS.gold;
      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y + 4);
      ctx.lineTo(x - 5, y + 10);
      ctx.lineTo(x + 5, y + 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderCoffeeTray(ctx: CanvasRenderingContext2D): void {
    const tipNode = this.rightArm.nodes[this.rightArm.nodes.length - 1];
    if (!tipNode) return;

    const tx = tipNode.x;
    const ty = tipNode.y;

    ctx.save();
    ctx.translate(tx, ty);
    // Only a tiny wobble around horizontal - ignore arm angle entirely
    const trayWobble = wobbleOffset(20, this.time, 0.06);
    ctx.rotate(trayWobble);

    // Tray line (slightly wobbly curve)
    const t = this.time;
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.quadraticCurveTo(0, wobbleOffset(21, t, 1.5), 18, 0);
    ctx.stroke();

    // Cup 1
    this.renderCup(ctx, -12, -12);
    // Cup 2
    this.renderCup(ctx, 4, -12);

    ctx.restore();
  }

  private renderCup(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const w = 8, h = 11;
    ctx.strokeStyle = COLORS.line;
    ctx.fillStyle = COLORS.bg;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();

    // Coffee fill (top portion)
    ctx.fillStyle = COLORS.coffee;
    ctx.fillRect(x, y, w, 4);
  }

  private renderFallen(
    ctx: CanvasRenderingContext2D,
    cx: number,
    groundY: number
  ): void {
    const gy = groundY;
    ctx.save();
    ctx.translate(cx - 40, gy - 20);
    ctx.rotate(Math.PI / 2);

    // Body
    ctx.strokeStyle = COLORS.line;
    ctx.fillStyle = COLORS.bg;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.bodyW, this.bodyH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Necktie
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(0, -8); ctx.lineTo(4, 2); ctx.lineTo(-4, 2);
    ctx.closePath(); ctx.fill();

    // Legs (akimbo)
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, this.bodyH);
    ctx.lineTo(-25, this.bodyH + 35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, this.bodyH);
    ctx.lineTo(30, this.bodyH + 20);
    ctx.stroke();

    // Arms flailing
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-this.bodyW, -5);
    ctx.lineTo(-this.bodyW - 25, -30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.bodyW, -5);
    ctx.lineTo(this.bodyW + 30, 10);
    ctx.stroke();

    ctx.restore();

    // Head (separate, rolled to side)
    this.renderHead(ctx, cx - 70, groundY - 15, true);

    // Coffee spill
    this.renderCoffeeSpill(ctx, cx - 20, groundY - 5);
  }

  private renderCoffeeSpill(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = COLORS.coffee;
    ctx.strokeStyle = COLORS.coffeeDark;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.85;

    ctx.beginPath();
    ctx.moveTo(10, -8);
    ctx.quadraticCurveTo(30, -20, 55, -12);
    ctx.quadraticCurveTo(75, -5, 70, 5);
    ctx.quadraticCurveTo(60, 18, 35, 16);
    ctx.quadraticCurveTo(10, 18, 5, 8);
    ctx.quadraticCurveTo(-5, 0, 10, -8);
    ctx.fill();
    ctx.stroke();

    // Splash droplets
    const drops = [
      [-5, -15, 4], [20, -22, 5], [50, -20, 4],
      [72, -15, 3], [78, 5, 3], [-8, 8, 3],
    ];
    drops.forEach(([dx, dy, r]) => {
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  getTipPosition(): { x: number; y: number } {
    const tip = this.rightArm.nodes[this.rightArm.nodes.length - 1];
    return { x: tip?.x ?? 0, y: tip?.y ?? 0 };
  }
}
