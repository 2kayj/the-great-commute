import { VerletChain } from './VerletChain';
import { COLORS, LEG_UPPER, LEG_LOWER, STEP_HEIGHT } from '../utils/constants';
import { wobbleOffset } from '../utils/math';
import type { CharacterItem, WorldPhase } from '../types/rank.types';

// ----- Footplant IK types -----

interface FootState {
  /** Current planted world position */
  x: number;
  y: number;
  /** Previous planted position (start of swing arc) */
  prevX: number;
  prevY: number;
  /** Target world position for the next step */
  targetX: number;
  targetY: number;
  /** 0 = stance (on ground), 1 = swing (in air, 0→1 arc progress) */
  swingT: number;
  /** true while foot is airborne */
  isSwinging: boolean;
}

// Segment length for leg Verlet chains: distribute total leg length evenly.
// 4 nodes → 3 segments.
const LEG_SEG_LENGTH = (LEG_UPPER + LEG_LOWER) / 3; // ≈ 24.7

// Half the total stride width: swing foot lands this far ahead of hip center.
// Keeping this value large enough ensures the stance foot (sliding backward)
// is well behind the hip before the swing foot arrives in front.
const STRIDE_FORWARD = 22;

export class CharacterRenderer {
  private leftArm: VerletChain;
  private rightArm: VerletChain;
  private time: number = 0;
  private currentItem: CharacterItem = 'coffee';
  private currentWorld: WorldPhase = 'company';
  private currentRankId: string = 'sinip';

  // Devil tail for mawang rank
  private tail: VerletChain;

  // IK + Verlet hybrid legs
  private leftLegChain: VerletChain;
  private rightLegChain: VerletChain;

  // Body dimensions
  private readonly bodyW = 22;
  private readonly bodyH = 18;
  private readonly headR = 14;
  private readonly neckLen = 10;

  // Fall-over animation state
  private fallenProgress: number = 0;
  private fallStartAngle: number = 0;
  private fallDirection: number = 1;

  // Footplant state (IK legs)
  private leftFoot: FootState;
  private rightFoot: FootState;
  /** Last walkPhase half-cycle index (floor(walkPhase / PI)) for step triggering */
  private lastHalfCycle: number = -1;

  constructor() {
    this.leftArm  = new VerletChain(4, 10, 0.3, 0.96);
    this.rightArm = new VerletChain(4, 10, 0.3, 0.96);
    // Tail: 5 nodes, 7px segments, upward gravity so tip curls up
    this.tail = new VerletChain(5, 7, 0.15, 0.92, -1, 8);

    // Leg chains: 4 nodes, gravity pulls down slightly, high damping for slow wobble
    // gravityDir = +1 (downward). gravity value is modest so legs don't droop too much.
    this.leftLegChain  = new VerletChain(4, LEG_SEG_LENGTH, 0.35, 0.93, 1);
    this.rightLegChain = new VerletChain(4, LEG_SEG_LENGTH, 0.35, 0.93, 1);

    // Feet start at rest (will be set properly on first update)
    this.leftFoot  = { x: 0, y: 0, prevX: 0, prevY: 0, targetX: 0, targetY: 0, swingT: 0, isSwinging: false };
    this.rightFoot = { x: 0, y: 0, prevX: 0, prevY: 0, targetX: 0, targetY: 0, swingT: 0, isSwinging: false };

    this.applyInitialJitter(this.leftArm.nodes,  2, 5);
    this.applyInitialJitter(this.rightArm.nodes, 2, 5);
    this.applyInitialJitter(this.leftLegChain.nodes,  1, 4);
    this.applyInitialJitter(this.rightLegChain.nodes, 1, 4);
  }

  private applyInitialJitter(
    nodes: { x: number; y: number; prevX: number; prevY: number; pinned: boolean }[],
    minOffset: number,
    maxOffset: number
  ): void {
    for (let i = 1; i < nodes.length; i++) {
      const t = i / (nodes.length - 1);
      const amplitude = minOffset + (maxOffset - minOffset) * t;
      const jx = (Math.random() * 2 - 1) * amplitude;
      const jy = (Math.random() * 2 - 1) * amplitude;
      nodes[i].prevX = nodes[i].x - jx;
      nodes[i].prevY = nodes[i].y - jy;
    }
  }

  // ----- Footplant helpers -----

  /**
   * Advance swing arc for one foot. swingSpeed = fraction of arc per second.
   */
  private advanceFoot(foot: FootState, dt: number, swingSpeed: number): void {
    if (!foot.isSwinging) return;
    foot.swingT = Math.min(1, foot.swingT + dt * swingSpeed);

    const t = foot.swingT;
    // Linear interpolation in X
    foot.x = foot.prevX + (foot.targetX - foot.prevX) * t;
    // Parabolic arc in Y: arc reaches STEP_HEIGHT at t=0.5
    foot.y = foot.prevY + (foot.targetY - foot.prevY) * t - STEP_HEIGHT * 4 * t * (1 - t);

    if (foot.swingT >= 1) {
      foot.x = foot.targetX;
      foot.y = foot.targetY;
      foot.isSwinging = false;
    }
  }

  update(
    centerX: number,
    groundY: number,
    walkPhase: number,
    angle: number,
    deltaTime: number,
    isFallen: boolean = false,
    speed: number = 0
  ): void {
    if (isFallen) {
      const FALL_DURATION = 0.55;
      if (this.fallenProgress < 1) {
        this.fallenProgress = Math.min(1, this.fallenProgress + deltaTime / FALL_DURATION);
        this.time += deltaTime;
      }
      return;
    }

    this.fallenProgress = 0;
    this.fallStartAngle = angle;
    this.fallDirection = angle >= 0 ? 1 : -1;
    this.time += deltaTime;

    const bodyTopY = groundY - this.bodyH * 2 - this.neckLen - this.headR * 2 - 20;
    const bodySwayX = Math.sin(walkPhase * 2) * 3;
    const bodyBobY  = Math.abs(Math.sin(walkPhase)) * -4;
    const bx = centerX + bodySwayX;
    const by = bodyTopY + bodyBobY;

    // Shoulders
    const bodyCenterY = by + this.bodyH;
    const shoulderOffsetY = -this.bodyH * 0.5;
    const shoulderY = bodyCenterY + shoulderOffsetY;
    const shoulderXRadius = this.bodyW * Math.sqrt(1 - Math.pow(shoulderOffsetY / this.bodyH, 2));

    const leftShoulderX  = bx - shoulderXRadius;
    const rightShoulderX = bx + shoulderXRadius;

    const armSwing = Math.sin(walkPhase) * 0.6;
    this.leftArm.update(
      leftShoulderX  + Math.sin(-armSwing) * 8,
      shoulderY      + Math.cos(-armSwing) * 4
    );
    this.rightArm.update(
      rightShoulderX + Math.sin(armSwing)  * 8,
      shoulderY      + Math.cos(armSwing)  * 4
    );

    // ----- Hip position -----
    const hipOffsetY = this.bodyH * 0.6;
    const hipY = bodyCenterY + hipOffsetY;
    const hipX = bx;

    // Stride offsets scaled by tilt angle.
    const angleScale = 1 + Math.abs(angle) * 0.5;
    const forwardTarget = hipX + STRIDE_FORWARD * angleScale;

    // ----- Initialise feet on first frame -----
    const isFirstFrame = (this.leftFoot.x === 0 && this.leftFoot.y === 0);
    if (isFirstFrame) {
      // Left foot starts at hipX + 7, right foot starts ahead —
      // natural mid-stride split so legs never start overlapping.
      const leftInitX  = hipX - 8;
      const rightInitX = forwardTarget;
      const initY = groundY;

      this.leftFoot.x  = leftInitX;  this.leftFoot.y  = initY;
      this.rightFoot.x = rightInitX; this.rightFoot.y = initY;
      this.leftFoot.prevX  = leftInitX;  this.leftFoot.prevY  = initY;
      this.rightFoot.prevX = rightInitX; this.rightFoot.prevY = initY;

      // Initialise leg chain node positions so chains start near correct pose
      this.initLegChain(this.leftLegChain,  hipX - 5, hipY, leftInitX,  initY);
      this.initLegChain(this.rightLegChain, hipX + 5, hipY, rightInitX, initY);
    }

    // ----- Swing speed proportional to angle magnitude -----
    const swingSpeed = (1 / 0.25) * (1 + Math.abs(angle) * 0.8);

    // Advance ongoing swings
    this.advanceFoot(this.leftFoot,  deltaTime, swingSpeed);
    this.advanceFoot(this.rightFoot, deltaTime, swingSpeed);

    // Slide stance feet backward to match background scroll
    const SCROLL_FACTOR = 1.0;
    const slideAmount = speed * deltaTime * SCROLL_FACTOR;
    if (!this.leftFoot.isSwinging)  this.leftFoot.x  -= slideAmount;
    if (!this.rightFoot.isSwinging) this.rightFoot.x -= slideAmount;

    // ----- Hard clamp: stance foot can never lag more than BACK_LIMIT behind hip -----
    // This is the primary protection against feet trailing too far at high speeds.
    // When speed is high, the slide-per-cycle can exceed the stride length, so
    // we force a new step the moment the foot crosses this threshold.
    const BACK_LIMIT = STRIDE_FORWARD + 8; // ~30px — just beyond the forward landing zone
    if (!this.leftFoot.isSwinging && (hipX - this.leftFoot.x) > BACK_LIMIT) {
      this.startStep(this.leftFoot, forwardTarget, groundY);
    }
    if (!this.rightFoot.isSwinging && (hipX - this.rightFoot.x) > BACK_LIMIT) {
      this.startStep(this.rightFoot, forwardTarget, groundY);
    }

    // ----- Decide when to trigger next step -----
    // Feet alternate: one foot always swings to the FRONT (forwardTarget),
    // the other remains as stance and slides backward with the scroll.
    // This guarantees the two foot tips are always on opposite sides of the
    // hip, preventing them from converging at the same x position.
    const currentHalfCycle = Math.floor(walkPhase / Math.PI);

    if (currentHalfCycle !== this.lastHalfCycle) {
      this.lastHalfCycle = currentHalfCycle;

      if (currentHalfCycle % 2 === 0) {
        // Left foot swings forward
        if (!this.leftFoot.isSwinging) {
          this.startStep(this.leftFoot, forwardTarget, groundY);
        }
      } else {
        // Right foot swings forward
        if (!this.rightFoot.isSwinging) {
          this.startStep(this.rightFoot, forwardTarget, groundY);
        }
      }
    }

    // ----- Safety: force step if stance foot drifts too far behind hip -----
    // (Fallback for cases the BACK_LIMIT clamp didn't catch, e.g. lateral drift)
    const MAX_X_REACH = (LEG_UPPER + LEG_LOWER) * 0.85;
    if (!this.leftFoot.isSwinging && Math.abs(this.leftFoot.x - hipX) > MAX_X_REACH) {
      this.startStep(this.leftFoot, forwardTarget, groundY);
    }
    if (!this.rightFoot.isSwinging && Math.abs(this.rightFoot.x - hipX) > MAX_X_REACH) {
      this.startStep(this.rightFoot, forwardTarget, groundY);
    }

    // ----- Hybrid Verlet leg update -----
    // Hip anchor offsets match renderIKLeg hip positions
    const leftHipX  = hipX - 5;
    const rightHipX = hipX + 5;

    this.updateLegChain(this.leftLegChain,  leftHipX,  hipY, this.leftFoot);
    this.updateLegChain(this.rightLegChain, rightHipX, hipY, this.rightFoot);

    // Devil tail: anchor at the back of the hip (slightly left = behind character)
    if (this.currentRankId === 'mawang') {
      const tailAnchorX = hipX - this.bodyW * 0.6;
      const tailAnchorY = hipY - 4;
      this.tail.update(tailAnchorX, tailAnchorY);
    }
  }

  /**
   * Initialise a leg chain so nodes are distributed from hip to foot with a
   * natural knee-bend shape.  Node[1] (the "knee") is nudged slightly backward
   * (negative X) so the leg rests in a believable upright stance rather than a
   * perfectly straight vertical line.
   */
  private initLegChain(
    chain: VerletChain,
    hipX: number, hipY: number,
    footX: number, footY: number
  ): void {
    const n = chain.nodes.length;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const baseX = hipX + (footX - hipX) * t;
      const baseY = hipY + (footY - hipY) * t;

      // For the mid-point node (knee area) push it backward slightly so the
      // chain starts with a gentle bend rather than a rigid straight line.
      // "Backward" in screen space means negative X (the character faces right).
      const kneeBend = (n === 4 && i === 1) ? -6 : 0;

      chain.nodes[i].x     = baseX + kneeBend;
      chain.nodes[i].y     = baseY;
      chain.nodes[i].prevX = chain.nodes[i].x;
      chain.nodes[i].prevY = chain.nodes[i].y;
    }
    chain.nodes[0].pinned = true;
  }

  /**
   * Run one Verlet physics step for a leg chain, then lerp the tip node toward
   * the IK foot position. This gives natural inertia/wobble in the middle joints
   * while the foot broadly follows the IK target.
   */
  private updateLegChain(
    chain: VerletChain,
    hipX: number, hipY: number,
    foot: FootState
  ): void {
    // Step 1: Verlet physics (anchor at hip)
    chain.update(hipX, hipY);

    // Step 2: Pull the tip node toward the IK foot position.
    // lerpFactor 0.8 → foot tracks IK closely but with some inertia/overshoot.
    // During swing (foot airborne) use a slightly softer pull so the wobble is more visible.
    const lerpFactor = foot.isSwinging ? 0.72 : 0.82;
    const tip = chain.nodes[chain.nodes.length - 1];
    tip.x += (foot.x - tip.x) * lerpFactor;
    tip.y += (foot.y - tip.y) * lerpFactor;
  }

  private startStep(foot: FootState, targetX: number, targetY: number): void {
    foot.prevX = foot.x;
    foot.prevY = foot.y;
    foot.targetX = targetX;
    foot.targetY = targetY;
    foot.swingT = 0;
    foot.isSwinging = true;
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

    // Devil tail (behind body and legs)
    if (this.currentRankId === 'mawang') {
      this.renderDevilTail(ctx);
    }

    // ----- Render hybrid Verlet legs (behind body) -----
    this.renderVerletLeg(ctx, this.leftLegChain);
    this.renderVerletLeg(ctx, this.rightLegChain);

    // Body
    ctx.save();
    ctx.strokeStyle = COLORS.line;
    ctx.fillStyle = COLORS.bg;
    ctx.lineWidth = 2.5;

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

    // Necktie
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
    this.rightArm.render(ctx, 2.5, 1.5, COLORS.line);
    this.renderItem(ctx);

    // Neck
    const neckBaseX = bx;
    const neckBaseY = by - 2;
    ctx.save();
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(neckBaseX, neckBaseY);
    ctx.lineTo(neckBaseX, neckBaseY - this.neckLen);
    ctx.stroke();
    ctx.restore();

    // Head
    const headX = neckBaseX + wobbleOffset(10, t, 2);
    const headY = neckBaseY - this.neckLen - this.headR + wobbleOffset(11, t, 1.5);
    this.renderHead(ctx, headX, headY, false);

    ctx.restore();
  }

  /**
   * Renders a hybrid Verlet leg by drawing curved segments through the chain nodes.
   * Node 0 = hip (anchor), Node 3 = foot (IK-tracked).
   * Upper segment (0→1) is thicker; lower segment tapers; foot dot at tip.
   */
  private renderVerletLeg(
    ctx: CanvasRenderingContext2D,
    chain: VerletChain
  ): void {
    const nodes = chain.nodes;
    if (nodes.length < 2) return;

    ctx.save();
    ctx.strokeStyle = COLORS.line;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw curved path through all nodes using quadraticCurveTo midpoints
    // Upper segment: nodes[0] → nodes[1] (thicker)
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(nodes[0].x, nodes[0].y);

    if (nodes.length === 4) {
      // Upper leg: hip → mid1 via smooth curve
      const upperCtrlX = (nodes[0].x + nodes[1].x) / 2;
      const upperCtrlY = (nodes[0].y + nodes[1].y) / 2;
      ctx.quadraticCurveTo(upperCtrlX, upperCtrlY, nodes[1].x, nodes[1].y);
      ctx.stroke();

      // Lower leg: mid1 → mid2 → foot (taper width)
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(nodes[1].x, nodes[1].y);
      // Use nodes[2] as control point for the curve to nodes[3]
      ctx.quadraticCurveTo(nodes[2].x, nodes[2].y, nodes[3].x, nodes[3].y);
      ctx.stroke();
    } else {
      // Fallback for other node counts: simple polyline
      for (let i = 1; i < nodes.length; i++) {
        const w = 3 - (i / (nodes.length - 1)) * 0.5;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(nodes[i - 1].x, nodes[i - 1].y);
        ctx.lineTo(nodes[i].x, nodes[i].y);
        ctx.stroke();
      }
    }

    // Foot dot at the tip node
    const tip = nodes[nodes.length - 1];
    ctx.fillStyle = COLORS.line;
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderDevilTail(ctx: CanvasRenderingContext2D): void {
    const nodes = this.tail.nodes;
    if (nodes.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw curved tail body: thicker at base, tapers toward tip
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(nodes[0].x, nodes[0].y);
    if (nodes.length >= 3) {
      // Use quadraticCurveTo through midpoints for smooth curve
      ctx.quadraticCurveTo(nodes[1].x, nodes[1].y, (nodes[1].x + nodes[2].x) / 2, (nodes[1].y + nodes[2].y) / 2);
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo((nodes[1].x + nodes[2].x) / 2, (nodes[1].y + nodes[2].y) / 2);
      ctx.quadraticCurveTo(nodes[2].x, nodes[2].y, nodes[nodes.length - 1].x, nodes[nodes.length - 1].y);
      ctx.stroke();
    } else {
      ctx.lineTo(nodes[nodes.length - 1].x, nodes[nodes.length - 1].y);
      ctx.stroke();
    }

    // Arrow-tip (devil tail spade shape) at the last node
    const tip = nodes[nodes.length - 1];
    const prev = nodes[nodes.length - 2];
    const dx = tip.x - prev.x;
    const dy = tip.y - prev.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    // Direction unit vector (tail direction)
    const ux = dx / len;
    const uy = dy / len;
    // Perpendicular
    const px = -uy;
    const py = ux;

    const arrowLen = 7;
    const arrowHalf = 4;

    ctx.fillStyle = '#8B0000';
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tip.x + ux * arrowLen, tip.y + uy * arrowLen);
    ctx.lineTo(tip.x + px * arrowHalf - ux * 2, tip.y + py * arrowHalf - uy * 2);
    ctx.lineTo(tip.x, tip.y);
    ctx.lineTo(tip.x - px * arrowHalf - ux * 2, tip.y - py * arrowHalf - uy * 2);
    ctx.closePath();
    ctx.fill();

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

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hat is drawn after head circle so it overlaps the head correctly.
    // Space helmet is drawn here (before eyes/beak) so the visor is rendered
    // underneath the face features, making eyes/beak visible through the visor.
    this.renderHat(ctx, x, y);

    const eyeWobbleX  = fallen ? 0 : wobbleOffset(12, t, 0.5);
    const eyeWobbleX2 = fallen ? 0 : wobbleOffset(13, t, 0.5);
    ctx.fillStyle = COLORS.line;
    ctx.beginPath();
    ctx.arc(x - 5 + eyeWobbleX,  y - 3, 2, 0, Math.PI * 2);
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
    const trayWobble = wobbleOffset(20, this.time, 0.06);
    ctx.rotate(trayWobble);

    const t = this.time;
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.quadraticCurveTo(0, wobbleOffset(21, t, 1.5), 18, 0);
    ctx.stroke();

    this.renderCup(ctx, -12, -12);
    this.renderCup(ctx, 4,   -12);

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

    ctx.fillStyle = COLORS.coffee;
    ctx.fillRect(x, y, w, 4);
  }

  setItem(item: CharacterItem): void {
    this.currentItem = item;
  }

  setWorld(world: WorldPhase): void {
    this.currentWorld = world;
  }

  setRankId(id: string): void {
    this.currentRankId = id;
  }

  private renderItem(ctx: CanvasRenderingContext2D): void {
    switch (this.currentItem) {
      case 'coffee': this.renderCoffeeTray(ctx); break;
      case 'sword':  this.renderSword(ctx);       break;
      case 'flag':   this.renderFlag(ctx);        break;
    }
  }

  private renderHat(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const r = this.headR;
    // sin rank: halo instead of horned helmet
    if (this.currentRankId === 'sin') {
      this.renderHalo(ctx, x, y, r);
      return;
    }
    switch (this.currentWorld) {
      case 'company': break;
      case 'politics': this.renderBeret(ctx, x, y, r); break;
      case 'isekai':   this.renderHornedHelmet(ctx, x, y, r); break;
      case 'space':    this.renderSpaceHelmet(ctx, x, y, r); break;
    }
  }

  private renderHalo(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.7)';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2.5;
    const haloY = y - r * 1.8 + Math.sin(this.time * 2) * 1.5;
    ctx.beginPath();
    ctx.ellipse(x, haloY, r * 0.95, r * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glow ring (lighter, thinner)
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#FFFACD';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.ellipse(x, haloY, r * 0.95, r * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private renderBeret(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    ctx.save();

    const rimY = y - r * 0.5;  // 눈(y-3) 위로 올림

    // Headband (rim at bottom of beret)
    ctx.strokeStyle = '#1C1C3A';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, rimY, r * 0.95, Math.PI, Math.PI * 2);
    ctx.stroke();

    // Beret dome — slightly tilted right
    ctx.fillStyle = '#1C1C3A';
    ctx.strokeStyle = '#1C1C3A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.9, rimY);
    ctx.bezierCurveTo(
      x - r * 1.1, rimY - r * 1.1,
      x + r * 0.6, rimY - r * 1.3,
      x + r * 1.1, rimY - r * 0.25
    );
    ctx.bezierCurveTo(
      x + r * 1.2, rimY + r * 0.1,
      x + r * 0.1, rimY + r * 0.05,
      x - r * 0.9, rimY
    );
    ctx.fill();
    ctx.stroke();

    // Small circle decoration at top
    ctx.fillStyle = '#3A3A6A';
    ctx.strokeStyle = '#1C1C3A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x + r * 0.3, rimY - r * 1.0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private renderHornedHelmet(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    ctx.save();

    const rimY = y - r * 0.55;  // 눈(y-3) 위로 올림

    // Left horn (drawn first so dome covers the base)
    ctx.strokeStyle = '#B0B0B8';
    ctx.fillStyle = '#B0B0B8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.6, rimY - r * 0.1);
    ctx.quadraticCurveTo(
      x - r * 1.5, rimY - r * 0.7,
      x - r * 1.2, rimY - r * 1.4
    );
    ctx.quadraticCurveTo(
      x - r * 1.0, rimY - r * 1.3,
      x - r * 0.5, rimY - r * 0.2
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right horn
    ctx.beginPath();
    ctx.moveTo(x + r * 0.6, rimY - r * 0.1);
    ctx.quadraticCurveTo(
      x + r * 1.5, rimY - r * 0.7,
      x + r * 1.2, rimY - r * 1.4
    );
    ctx.quadraticCurveTo(
      x + r * 1.0, rimY - r * 1.3,
      x + r * 0.5, rimY - r * 0.2
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Helmet dome (covers horn bases)
    ctx.fillStyle = '#C8C8D0';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, rimY, r * 1.1, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bottom rim/brim
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - r * 1.25, rimY);
    ctx.lineTo(x + r * 1.25, rimY);
    ctx.stroke();

    // Highlight on upper-left of dome
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x - r * 0.35, rimY - r * 0.55, r * 0.45, Math.PI * 1.2, Math.PI * 1.7);
    ctx.stroke();

    ctx.restore();
  }

  private renderSpaceHelmet(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    ctx.save();

    // Outer helmet shell (white, slightly larger than head)
    const hr = r * 1.55;
    ctx.fillStyle = '#F0F0F0';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, hr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Visor — semi-transparent sky blue ellipse
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#7EC8E3';
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.1, r * 0.95, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Visor border
    ctx.strokeStyle = '#3A8BAA';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.1, r * 0.95, r * 0.75, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Reflection arc on upper-left
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x - r * 0.45, y - r * 0.5, r * 0.55, Math.PI * 1.1, Math.PI * 1.6);
    ctx.stroke();

    // Small reflection dot
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(x - r * 0.75, y - r * 0.7, 2, 0, Math.PI * 2);
    ctx.fill();

    // Neck ring at bottom
    ctx.strokeStyle = '#AAAAAA';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, hr, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();

    ctx.restore();
  }

  private renderSword(ctx: CanvasRenderingContext2D): void {
    const tipNode = this.rightArm.nodes[this.rightArm.nodes.length - 1];
    if (!tipNode) return;

    const tx = tipNode.x;
    const ty = tipNode.y;

    ctx.save();
    ctx.translate(tx, ty);
    // Rotate +45deg so sword points forward (character faces right)
    const swordWobble = wobbleOffset(20, this.time, 0.05);
    ctx.rotate(Math.PI / 4 + swordWobble);

    // Handle at origin (hand grip point), blade extends upward in local coords
    // Handle
    ctx.fillStyle = '#8B4513';
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(-3, 0, 6, 10);
    ctx.fill();
    ctx.stroke();

    // Cross-guard
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(-8, -4, 16, 4);
    ctx.fill();
    ctx.stroke();

    // Blade — extends upward from cross-guard, rounded tip
    ctx.fillStyle = '#C0C0C0';
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3, -4);
    ctx.lineTo(3, -4);
    const tipX = wobbleOffset(22, this.time, 0.5);
    ctx.quadraticCurveTo(3, -28, tipX, -32);
    ctx.quadraticCurveTo(-3, -28, -3, -4);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private renderFlag(ctx: CanvasRenderingContext2D): void {
    const tipNode = this.rightArm.nodes[this.rightArm.nodes.length - 1];
    if (!tipNode) return;

    const tx = tipNode.x;
    const ty = tipNode.y;

    ctx.save();
    ctx.translate(tx, ty);
    const flagWobble = wobbleOffset(20, this.time, 0.04);
    ctx.rotate(flagWobble);

    // Pole — vertical line going up
    ctx.strokeStyle = '#AAAAAA';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -25);
    ctx.stroke();

    // Flag — small rectangular pennant at the top, with wavy edge
    const wave = Math.sin(this.time * 3) * 2;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -25);        // pole attachment top
    ctx.lineTo(14 + wave, -21); // top-right corner (waves)
    ctx.lineTo(14 + wave * 0.5, -17); // bottom-right corner
    ctx.lineTo(0, -17);        // bottom-left (attached to pole)
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Small star on the flag
    ctx.fillStyle = COLORS.line;
    ctx.beginPath();
    ctx.arc(6, -21, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderFallingOver(
    ctx: CanvasRenderingContext2D,
    cx: number,
    groundY: number,
    _currentAngle: number
  ): void {
    const p = this.fallenProgress;
    const startAngle = this.fallStartAngle;
    const dir = this.fallDirection;
    const targetAngle = dir * (Math.PI / 2);
    const eased = this.easeOutBack(p);
    const lerpedAngle = startAngle + (targetAngle - startAngle) * eased;

    ctx.save();
    ctx.translate(cx, groundY);
    ctx.rotate(lerpedAngle);
    ctx.translate(-cx, -groundY);

    // Render the character using the current Verlet leg state so there is no
    // sudden shape change when transitioning from walking to fallen.
    const bodyH2 = this.bodyH * 2;
    const bodyTopY = groundY - bodyH2 - this.neckLen - this.headR * 2 - 20;
    const bx = cx;
    const by = bodyTopY;
    const bodyCenterY = by + this.bodyH;

    // Verlet legs — same as the normal render path, preserving last physics state
    this.renderVerletLeg(ctx, this.leftLegChain);
    this.renderVerletLeg(ctx, this.rightLegChain);

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

    // Arms
    this.leftArm.render(ctx, 2.5, 1.5, COLORS.line);
    this.rightArm.render(ctx, 2.5, 1.5, COLORS.line);
    this.renderItem(ctx);

    // Neck
    const neckBaseX = bx;
    const neckBaseY = by - 2;
    ctx.save();
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(neckBaseX, neckBaseY);
    ctx.lineTo(neckBaseX, neckBaseY - this.neckLen);
    ctx.stroke();
    ctx.restore();

    // Head
    const headX = neckBaseX;
    const headY = neckBaseY - this.neckLen - this.headR;
    this.renderHead(ctx, headX, headY, true);

    ctx.restore();
  }

  private easeOutBack(t: number): number {
    return 1 - Math.pow(1 - t, 4);
  }

  warmUp(centerX: number, groundY: number, frames: number = 120, speed: number = 80): void {
    const dt = 1 / 60;
    for (let i = 0; i < frames; i++) {
      this.time += dt;
      const phase = this.time * 2.2;
      this.update(centerX, groundY, phase, 0, dt, false, speed);
    }
  }

  getTipPosition(): { x: number; y: number } {
    const tip = this.rightArm.nodes[this.rightArm.nodes.length - 1];
    return { x: tip?.x ?? 0, y: tip?.y ?? 0 };
  }
}
