import { INITIAL_SPEED, MAX_SPEED } from '../utils/constants';
import { clamp, smoothstep } from '../utils/math';

export interface DifficultyConfig {
  speed: number;
  gravityMultiplier: number;
  angularDampingMultiplier: number;
  dampingBonus: number;  // additional reduction to angular damping (0 = no change)
  backgroundLabel: string;
}

export class DifficultyManager {
  private rankDampingPenalty: number = 0;

  setRankDampingPenalty(penalty: number): void {
    this.rankDampingPenalty = penalty;
  }

  getConfig(distance: number, elapsedTime: number): DifficultyConfig {
    const speed = clamp(
      INITIAL_SPEED + elapsedTime * 4,
      INITIAL_SPEED,
      MAX_SPEED
    );

    let gravityMultiplier = 1.0;
    let angularDampingMultiplier = 1.0;

    if (distance > 25) {
      const t = smoothstep(25, 100, distance);
      gravityMultiplier = 1.0 + t * 0.5;
      angularDampingMultiplier = 1.0 - t * 0.08;
    }

    if (distance > 100) {
      const t = smoothstep(100, 250, distance);
      gravityMultiplier = 1.5 + t * 0.8;
      angularDampingMultiplier = 0.92 - t * 0.07;
    }

    angularDampingMultiplier -= this.rankDampingPenalty;

    let backgroundLabel = '주택가';
    if (distance >= 50 && distance < 150) backgroundLabel = '상업지구';
    if (distance >= 150) backgroundLabel = '오피스';

    return {
      speed,
      gravityMultiplier,
      angularDampingMultiplier,
      dampingBonus: this.rankDampingPenalty,
      backgroundLabel,
    };
  }

  getSpeedMultiplier(elapsedTime: number): number {
    return clamp(1.0 + elapsedTime * 0.04, 1.0, 2.0);
  }
}
