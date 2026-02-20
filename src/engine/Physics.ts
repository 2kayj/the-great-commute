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
    const { angle } = this.state;

    // Torque from gravity (pendulum-like)
    const gravityTorque = GRAVITY * Math.sin(angle);

    // Torque from player input
    const inputTorque = INPUT_FORCE * inputDirection;

    this.state.angularVelocity += (gravityTorque + inputTorque) * dt;
    this.state.angularVelocity *= ANGULAR_DAMPING;

    this.state.angle += this.state.angularVelocity * dt;
    this.state.angle = clamp(this.state.angle, -MAX_ANGLE * 1.5, MAX_ANGLE * 1.5);

    if (Math.abs(this.state.angle) >= MAX_ANGLE) {
      this.state.isGameOver = true;
      return;
    }

    // Speed ramp
    this.state.speed = clamp(
      INITIAL_SPEED + this.state.elapsedTime * SPEED_INCREMENT,
      INITIAL_SPEED,
      MAX_SPEED
    );

    // Distance (meters, 1 meter = some pixels, scaled)
    this.state.distance += (this.state.speed / 100) * dt;
    this.state.elapsedTime += dt;

    // Walk phase (oscillator driven by speed)
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
