import {
  GRAVITY,
  ANGULAR_DAMPING,
  MAX_ANGLE,
  INPUT_FORCE,
  FIXED_DT,
  INITIAL_SPEED,
  MAX_SPEED,
  SPEED_INCREMENT,
} from '../utils/constants';
import { clamp } from '../utils/math';
import { DifficultyManager } from './DifficultyManager';
import type { EventFrame } from './EventManager';

export interface PhysicsState {
  angle: number;
  angularVelocity: number;
  distance: number;
  elapsedTime: number;
  speed: number;
  walkPhase: number;
  isGameOver: boolean;
}

export class Physics {
  private state: PhysicsState;
  private accumulator: number = 0;
  private difficultyManager: DifficultyManager = new DifficultyManager();
  private stageMultiplier: number = 1.0;
  private speedMultiplier: number = 1.0;
  private zeroGravity: boolean = false;
  private invincible: boolean = false;
  private coffeeShield: { active: boolean; remainingDistance: number } = { active: false, remainingDistance: 0 };
  private eventFrame: EventFrame = { bumpImpulse: 0, windTorque: 0, slopeOffset: 0 };

  constructor() {
    this.state = {
      angle: 0,
      angularVelocity: 0,
      distance: 0,
      elapsedTime: 0,
      speed: INITIAL_SPEED,
      walkPhase: 0,
      isGameOver: false,
    };
  }

  reset(): void {
    this.state = {
      angle: 0,
      angularVelocity: (Math.random() - 0.5) * 0.08,
      distance: 0,
      elapsedTime: 0,
      speed: INITIAL_SPEED,
      walkPhase: 0,
      isGameOver: false,
    };
    this.accumulator = 0;
    this.stageMultiplier = 1.0;
    this.speedMultiplier = 1.0;
    this.coffeeShield = { active: false, remainingDistance: 0 };
  }

  setStageMultiplier(multiplier: number): void {
    this.stageMultiplier = multiplier;
  }

  setSpeedMultiplier(mult: number): void {
    this.speedMultiplier = mult;
  }

  setRankDampingPenalty(penalty: number): void {
    this.difficultyManager.setRankDampingPenalty(penalty);
  }

  setZeroGravity(enabled: boolean): void {
    this.zeroGravity = enabled;
  }

  setInvincible(enabled: boolean): void {
    this.invincible = enabled;
  }

  activateCoffeeShield(distance: number): void {
    this.coffeeShield = { active: true, remainingDistance: distance };
  }

  isCoffeeShieldActive(): boolean {
    return this.coffeeShield.active;
  }

  getCoffeeShieldRemaining(): number {
    return this.coffeeShield.remainingDistance;
  }

  setEventFrame(frame: EventFrame): void {
    this.eventFrame = { ...frame };
  }

  resetForContinue(stageBaseDistance: number, stageMultiplier: number): void {
    this.state = {
      angle: 0,
      angularVelocity: (Math.random() - 0.5) * 0.08,
      distance: stageBaseDistance,
      elapsedTime: this.state.elapsedTime, // keep elapsed time
      speed: INITIAL_SPEED,
      walkPhase: 0,
      isGameOver: false,
    };
    this.stageMultiplier = stageMultiplier;
    this.accumulator = 0;
  }

  update(realDeltaTime: number, inputDirection: -1 | 0 | 1): void {
    if (this.state.isGameOver) return;

    const dt = Math.min(realDeltaTime, 0.1);
    this.accumulator += dt;

    while (this.accumulator >= FIXED_DT) {
      this.step(FIXED_DT, inputDirection);
      this.accumulator -= FIXED_DT;
    }
  }

  private step(dt: number, inputDirection: -1 | 0 | 1): void {
    // Zero-gravity mode: angle lerps to 0, no game-over check, no input
    if (this.zeroGravity) {
      this.state.angle *= 0.92;
      this.state.angularVelocity *= 0.85;

      // Speed, distance, walkPhase keep updating so character walks naturally
      this.state.speed = clamp(
        (INITIAL_SPEED + this.state.elapsedTime * SPEED_INCREMENT) * this.speedMultiplier,
        INITIAL_SPEED,
        MAX_SPEED * this.speedMultiplier
      );
      this.state.distance += (this.state.speed / 100) * dt;
      this.state.elapsedTime += dt;
      const cycleFreq = this.state.speed / 80;
      this.state.walkPhase += cycleFreq * dt * Math.PI * 2;
      return;
    }

    const { angle } = this.state;

    // Difficulty scaling based on current distance and time
    const diffConfig = this.difficultyManager.getConfig(
      this.state.distance,
      this.state.elapsedTime
    );

    // Slope event shifts the neutral/balance point
    const effectiveAngle = angle - this.eventFrame.slopeOffset;

    // Torque from gravity (pendulum-like), scaled by difficulty
    const gravityTorque = GRAVITY * diffConfig.gravityMultiplier * this.stageMultiplier * Math.sin(effectiveAngle);

    // Torque from player input
    const inputTorque = INPUT_FORCE * this.stageMultiplier * inputDirection;

    const effectiveDamping = ANGULAR_DAMPING * diffConfig.angularDampingMultiplier;

    this.state.angularVelocity += (gravityTorque + inputTorque + this.eventFrame.windTorque) * dt;
    this.state.angularVelocity *= effectiveDamping;

    // Bump: one-shot angular velocity impulse, applied once then cleared
    if (this.eventFrame.bumpImpulse !== 0) {
      this.state.angularVelocity += this.eventFrame.bumpImpulse;
      this.eventFrame.bumpImpulse = 0;
    }

    this.state.angle += this.state.angularVelocity * dt;
    this.state.angle = clamp(this.state.angle, -MAX_ANGLE * 1.5, MAX_ANGLE * 1.5);

    if (Math.abs(this.state.angle) >= MAX_ANGLE) {
      if (this.invincible || this.coffeeShield.active) {
        // 게임오버 방지, 경계에서 반대로 튕겨냄 (완전 리셋 X)
        const sign = this.state.angle > 0 ? 1 : -1;
        this.state.angle = sign * MAX_ANGLE * 0.6;
        this.state.angularVelocity = -sign * Math.abs(this.state.angularVelocity) * 0.3;
      } else {
        this.state.isGameOver = true;
        return;
      }
    }

    // Coffee shield distance countdown
    if (this.coffeeShield.active) {
      const distanceDelta = (this.state.speed / 100) * dt;
      this.coffeeShield.remainingDistance -= distanceDelta;
      if (this.coffeeShield.remainingDistance <= 0) {
        this.coffeeShield = { active: false, remainingDistance: 0 };
      }
    }

    // Speed ramp — scaled by rank speed multiplier
    this.state.speed = clamp(
      (INITIAL_SPEED + this.state.elapsedTime * SPEED_INCREMENT) * this.speedMultiplier,
      INITIAL_SPEED,
      MAX_SPEED * this.speedMultiplier
    );

    // Distance (meters, 1 meter = some pixels, scaled)
    this.state.distance += (this.state.speed / 100) * dt;
    this.state.elapsedTime += dt;

    // Walk phase (oscillator driven by speed)
    // Divisor raised from 80 → 128 to slow the walk cycle,
    // giving the Verlet leg chain more time to swing at the tip.
    const cycleFreq = this.state.speed / 80;
    this.state.walkPhase += cycleFreq * dt * Math.PI * 2;
  }

  getState(): Readonly<PhysicsState> {
    return this.state;
  }

  getAnglePercent(): number {
    return clamp(this.state.angle / MAX_ANGLE, -1, 1);
  }

  isDangerous(): boolean {
    return Math.abs(this.state.angle) > MAX_ANGLE * 0.65;
  }
}
