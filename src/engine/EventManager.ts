import type { EventType } from '../types/rank.types';

interface ActiveBump {
  impulse: number;
  applied: boolean;
}

interface ActiveWind {
  torque: number;
  duration: number;
  elapsed: number;
}

interface ActiveSlope {
  offset: number;
  duration: number;
  elapsed: number;
}

export interface EventFrame {
  bumpImpulse: number;
  windTorque: number;
  slopeOffset: number;
}

interface SpawnThresholds {
  bump: number;
  wind: number;
  slope: number;
}

export class EventManager {
  private unlockedEvents: Set<EventType> = new Set();
  private intensityMultiplier: number = 1.0;

  private activeBump: ActiveBump | null = null;
  private activeWind: ActiveWind | null = null;
  private activeSlope: ActiveSlope | null = null;

  private lastSpawnDistance: SpawnThresholds = { bump: 0, wind: 0, slope: 0 };
  private nextSpawnDistance: SpawnThresholds = { bump: 0, wind: 0, slope: 0 };

  private lastBumpTime: number = 0;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.activeBump = null;
    this.activeWind = null;
    this.activeSlope = null;
    this.lastSpawnDistance = { bump: 0, wind: 0, slope: 0 };
    this.nextSpawnDistance = {
      bump: this.randomBetween(40, 75),
      wind: this.randomBetween(60, 100),
      slope: this.randomBetween(75, 125),
    };
    this.lastBumpTime = 0;
  }

  setUnlockedEvents(events: EventType[]): void {
    this.unlockedEvents = new Set(events);
  }

  setIntensityMultiplier(mult: number): void {
    this.intensityMultiplier = mult;
  }

  update(dt: number, distance: number): EventFrame {
    const frame: EventFrame = { bumpImpulse: 0, windTorque: 0, slopeOffset: 0 };

    // --- Bump ---
    if (this.unlockedEvents.has('bump')) {
      if (this.activeBump === null && distance >= this.nextSpawnDistance.bump) {
        const magnitude = this.randomBetween(0.3, 0.8) * Math.min(this.intensityMultiplier, 3.0);
        const direction = Math.random() < 0.5 ? 1 : -1;
        this.activeBump = { impulse: magnitude * direction, applied: false };
        this.lastSpawnDistance.bump = distance;
        this.nextSpawnDistance.bump = distance + this.randomBetween(40, 75);
      }

      if (this.activeBump !== null && !this.activeBump.applied) {
        frame.bumpImpulse = this.activeBump.impulse;
        this.activeBump.applied = true;
        this.lastBumpTime = Date.now();
        this.activeBump = null;
      }
    }

    // --- Wind ---
    if (this.unlockedEvents.has('wind')) {
      if (this.activeWind === null && distance >= this.nextSpawnDistance.wind) {
        const magnitude = this.randomBetween(0.5, 1.5) * Math.min(this.intensityMultiplier, 3.0);
        const direction = Math.random() < 0.5 ? 1 : -1;
        const duration = this.randomBetween(3, 6);
        this.activeWind = { torque: magnitude * direction, duration, elapsed: 0 };
        this.lastSpawnDistance.wind = distance;
        this.nextSpawnDistance.wind = distance + this.randomBetween(60, 100);
      }

      if (this.activeWind !== null) {
        this.activeWind.elapsed += dt;
        frame.windTorque = this.activeWind.torque;
        if (this.activeWind.elapsed >= this.activeWind.duration) {
          this.activeWind = null;
        }
      }
    }

    // --- Slope ---
    if (this.unlockedEvents.has('slope')) {
      if (this.activeSlope === null && distance >= this.nextSpawnDistance.slope) {
        const magnitude = this.randomBetween(0.03, 0.08) * Math.min(this.intensityMultiplier, 4.0);
        const direction = Math.random() < 0.5 ? 1 : -1;
        const duration = this.randomBetween(5, 8);
        this.activeSlope = { offset: magnitude * direction, duration, elapsed: 0 };
        this.lastSpawnDistance.slope = distance;
        this.nextSpawnDistance.slope = distance + this.randomBetween(75, 125);
      }

      if (this.activeSlope !== null) {
        this.activeSlope.elapsed += dt;
        frame.slopeOffset = this.activeSlope.offset;
        if (this.activeSlope.elapsed >= this.activeSlope.duration) {
          this.activeSlope = null;
        }
      }
    }

    return frame;
  }

  isWindActive(): boolean {
    return this.activeWind !== null;
  }

  getWindDirection(): number {
    if (this.activeWind === null) return 0;
    return this.activeWind.torque > 0 ? 1 : -1;
  }

  isSlopeActive(): boolean {
    return this.activeSlope !== null;
  }

  getSlopeDirection(): number {
    if (this.activeSlope === null) return 0;
    return this.activeSlope.offset > 0 ? 1 : -1;
  }

  getLastBumpTime(): number {
    return this.lastBumpTime;
  }

  private randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}
