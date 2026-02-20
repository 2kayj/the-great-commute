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

  // Fall-over animation state
  // fallenProgress: 0 = upright, 1 = fully lying down
  private fallenProgress: number = 0;
  // fallStartAngle: the physics angle at the moment game over was triggered
  private fallStartAngle: number = 0;
  // fallDirection: +1 = fell right, -1 = fell left
  private fallDirection: number = 1;

  constructor() {
    this.leftArm  = new VerletChain(4, 10, 0.3, 0.96);
    this.rightArm = new VerletChain(4, 10, 0.3, 0.96);
    this.leftLeg  = new VerletChain(5, 17, 0.4, 0.92, 1, 4);
    this.rightLeg = new VerletChain(5, 17, 0.4, 0.92, 1, 4);
    this.neck     = new VerletChain(3, 5, 0.12, 0.985, -1);

    // Give each limb a small random initial velocity so they start
    // in motion rather than frozen. Verlet velocity = (pos - prevPos),
    // so shifting prevPos by a small offset produces an immediate impulse.
    // Anchor node (index 0) is left untouched — only free nodes get the kick.
    this.applyInitialJitter(this.leftArm.nodes,  2, 5);
    this.applyInitialJitter(this.rightArm.nodes, 2, 5);
    this.applyInitialJitter(this.leftLeg.nodes,  4, 8);
    this.applyInitialJitter(this.rightLeg.nodes, 4, 8);
    this.applyInitialJitter(this.neck.nodes,     1, 2);
  }

  /**
   * Shifts `prevX`/`prevY` of non-anchor nodes by a random amount within
   * ±maxOffset px so that Verlet integration starts with a small velocity.
   * The jitter grows slightly toward the tip of the chain (distal amplification)
   * to mimic the natural way loose limbs swing from their root.
   *
   * @param nodes      Array of VerletNode belonging to one chain
   * @param minOffset  Minimum absolute shift in pixels
   * @param maxOffset  Maximum absolute shift in pixels (at the tip)
   */
  private applyInitialJitter(
    nodes: { x: number; y: number; prevX: number; prevY: number; pinned: boolean }[],
    minOffset: number,
    maxOffset: number
  ): void {
    for (let i = 1; i < nodes.length; i++) {
      // Scale amplitude toward the tip: nodes deeper in the chain swing more
      const t = i / (nodes.length - 1);
      const amplitude = minOffset + (maxOffset - minOffset) * t;

      const jx = (Math.random() * 2 - 1) * amplitude;
      const jy = (Math.random() * 2 - 1) * amplitude;

      // Subtract from prevPos → velocity on next step = pos - prevPos = +jx, +jy
      nodes[i].prevX = nodes[i].x - jx;
      nodes[i].prevY = nodes[i].y - jy;
    }
  }

  update(
    centerX: number,
    groundY: number,
    walkPhase: number,
    angle: number,
    deltaTime: number,
    isFallen: boolean = false
  ): void {
    if (isFallen) {
      // Advance fall animation — takes ~0.55s to complete
      const FALL_DURATION = 0.55;
      if (this.fallenProgress < 1) {
        this.fallenProgress = Math.min(1, this.fallenProgress + deltaTime / FALL_DURATION);
        // Only tick time during the fall transition; freeze once fully lying down
        this.time += deltaTime;
      }
      // No Verlet updates needed while lying down
      return;
    }

    // Reset fall state whenever we're not fallen (e.g. after retry)
    this.fallenProgress = 0;
    this.fallStartAngle = angle;
    this.fallDirection = angle >= 0 ? 1 : -1;

    // Tick animation time only while walking (not while fallen)
    this.time += deltaTime;

    const bodyTopY = groundY - this.bodyH * 2 - this.neckLen - this.headR * 2 - 20;

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

    const hipSwing = Math.sin(walkPhase) * 12;
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
    if (isFallen) {
      this.renderFallingOver(ctx, centerX, groundY, angle);
      return;
    }

    ctx.save();
    ctx.translate(centerX, groundY);
    ctx.rotate(angle);
    ctx.translate(-centerX, -groundY);

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

    // Head circle — wobble only when not fallen
    ctx.beginPath();
    if (fallen) {
      ctx.arc(x, y, r, 0, Math.PI * 2);
    } else {
      ctx.arc(x + wobbleOffset(10, t, 1), y + wobbleOffset(11, t, 1), r, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();

    // Eyes — wobble when walking, static when fallen. Always normal dot eyes (never XX)
    const eyeWobbleX = fallen ? 0 : wobbleOffset(12, t, 0.5);
    const eyeWobbleX2 = fallen ? 0 : wobbleOffset(13, t, 0.5);
    ctx.fillStyle = COLORS.line;
    ctx.beginPath();
    ctx.arc(x - 5 + eyeWobbleX, y - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 5 + eyeWobbleX2, y - 3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Beak (triangle pointing down) — always normal
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

  /**
   * Renders the fall-over animation.
   *
   * Phase 1 (fallenProgress 0→1): character rotates from its current physics
   *   angle toward lying flat (±90°), pivoting around the foot contact point.
   *   Uses easeOutBounce-like curve so it hits the ground with a slight thud.
   *
   * When fully fallen (fallenProgress === 1): renders the static lying pose.
   */
  private renderFallingOver(
    ctx: CanvasRenderingContext2D,
    cx: number,
    groundY: number,
    _currentAngle: number
  ): void {
    const p = this.fallenProgress;

    // Use the angle at first frame of falling (captured in update())
    // If fallenProgress just started this frame, fallStartAngle was set last frame.
    const startAngle = this.fallStartAngle;
    const dir = this.fallDirection;

    // Target angle: lying flat = ±(PI/2)
    const targetAngle = dir * (Math.PI / 2);

    // Easing: fast fall with a tiny overshoot at the end (thud feel)
    const eased = this.easeOutBack(p);
    const lerpedAngle = startAngle + (targetAngle - startAngle) * eased;

    // Both falling phase and fully-fallen phase: rotate the standing pose around the foot pivot.
    // When p < 1: interpolated angle. When p === 1: locked at ±PI/2 (fully lying flat).
    ctx.save();
    ctx.translate(cx, groundY);
    ctx.rotate(lerpedAngle);
    ctx.translate(-cx, -groundY);

    this.renderStandingPose(ctx, cx, groundY, 0, false);

    ctx.restore();
  }

  /**
   * Renders the character in its normal upright standing pose (no walk animation).
   * Used during the fall-over transition.
   */
  private renderStandingPose(
    ctx: CanvasRenderingContext2D,
    cx: number,
    groundY: number,
    _walkPhase: number,
    _wobble: boolean
  ): void {
    const bodyH2 = this.bodyH * 2;
    const bodyTopY = groundY - bodyH2 - this.neckLen - this.headR * 2 - 20;
    const bx = cx;
    const by = bodyTopY;
    const bodyCenterY = by + this.bodyH;

    // Legs — straight down, limp (no walk swing)
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    // Left leg
    const leftHipX = bx - 6;
    const rightHipX = bx + 6;
    const hipY = bodyCenterY + this.bodyH * 0.6;

    ctx.beginPath();
    ctx.moveTo(leftHipX, hipY);
    // Limp — slightly splayed outward
    ctx.quadraticCurveTo(leftHipX - 8, hipY + 20, leftHipX - 6, groundY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightHipX, hipY);
    ctx.quadraticCurveTo(rightHipX + 8, hipY + 20, rightHipX + 6, groundY);
    ctx.stroke();

    // Body
    ctx.save();
    ctx.strokeStyle = COLORS.line;
    ctx.fillStyle = COLORS.bg;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(bx, bodyCenterY, this.bodyW, this.bodyH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Necktie
    ctx.fillStyle = '#333333';
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, bodyCenterY - 8);
    ctx.lineTo(bx + 4, bodyCenterY + 4);
    ctx.lineTo(bx - 4, bodyCenterY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Arms — hanging limp at sides
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    const shoulderY = bodyCenterY - this.bodyH * 0.5;

    // Left arm limp
    ctx.beginPath();
    ctx.moveTo(bx - this.bodyW + 4, shoulderY);
    ctx.quadraticCurveTo(bx - this.bodyW - 4, shoulderY + 18, bx - this.bodyW, shoulderY + 38);
    ctx.stroke();

    // Right arm limp (no tray — dropped)
    ctx.beginPath();
    ctx.moveTo(bx + this.bodyW - 4, shoulderY);
    ctx.quadraticCurveTo(bx + this.bodyW + 4, shoulderY + 18, bx + this.bodyW, shoulderY + 38);
    ctx.stroke();

    // Neck — straight up
    const neckBaseY = by - 2;
    const headY = neckBaseY - this.neckLen;
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, neckBaseY);
    ctx.lineTo(bx, headY);
    ctx.stroke();

    // Head with normal expression
    this.renderHead(ctx, bx, headY - this.headR, false);
  }

  /**
   * easeOutQuart: decelerates quickly to a hard stop with no overshoot.
   * Replaces the previous easeOutBack to ensure the character locks in place
   * exactly at the fully-fallen position without any bounce or jitter.
   */
  private easeOutBack(t: number): number {
    return 1 - Math.pow(1 - t, 4);
  }

  /**
   * Runs the physics simulation for a given number of frames at a fixed delta
   * time without requiring an external game loop. Call this immediately after
   * construction to bring the chain into a natural walking pose before the
   * first rendered frame.
   *
   * @param centerX  Character X position (CHARACTER_X constant)
   * @param groundY  Ground Y position (GROUND_Y constant)
   * @param frames   Number of physics steps to pre-simulate (default 120 ≈ 2s at 60fps)
   */
  warmUp(centerX: number, groundY: number, frames: number = 120): void {
    const dt = 1 / 60;
    for (let i = 0; i < frames; i++) {
      this.time += dt;
      const phase = this.time * 2.2;
      this.update(centerX, groundY, phase, 0, dt, false);
    }
  }

  getTipPosition(): { x: number; y: number } {
    const tip = this.rightArm.nodes[this.rightArm.nodes.length - 1];
    return { x: tip?.x ?? 0, y: tip?.y ?? 0 };
  }
}
