import { INITIAL_SPEED, MAX_SPEED } from '../utils/constants';
import { clamp, smoothstep } from '../utils/math';

export interface DifficultyConfig {
  speed: number;
  gravityMultiplier: number;
  angularDampingMultiplier: number;
  backgroundLabel: string;
}

export class DifficultyManager {
  getConfig(distance: number, elapsedTime: number): DifficultyConfig {
    const speed = clamp(
      INITIAL_SPEED + elapsedTime * 4,
      INITIAL_SPEED,
      MAX_SPEED
    );

    let gravityMultiplier = 1.0;
    let angularDampingMultiplier = 1.0;

    if (distance > 50) {
      const t = smoothstep(50, 200, distance);
      gravityMultiplier = 1.0 + t * 0.5;
      angularDampingMultiplier = 1.0 - t * 0.08;
    }

    if (distance > 200) {
      const t = smoothstep(200, 500, distance);
      gravityMultiplier = 1.5 + t * 0.8;
      angularDampingMultiplier = 0.92 - t * 0.07;
    }

    let backgroundLabel = '주택가';
    if (distance >= 100 && distance < 300) backgroundLabel = '상업지구';
    if (distance >= 300) backgroundLabel = '오피스';

    return {
      speed,
      gravityMultiplier,
      angularDampingMultiplier,
      backgroundLabel,
    };
  }

  getSpeedMultiplier(elapsedTime: number): number {
    return clamp(1.0 + elapsedTime * 0.04, 1.0, 2.0);
  }
}
