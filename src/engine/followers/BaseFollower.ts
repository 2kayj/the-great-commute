import type { PhysicsState } from '../Physics';

export type FollowerState = 'hidden' | 'entering' | 'following';

export abstract class BaseFollower {
  protected time = 0;
  protected appearDistance: number = 0;
  protected state: FollowerState = 'hidden';
  protected entranceProgress = 0;
  protected entranceDuration = 0.8; // seconds
  protected screenX = 0;
  protected screenY = 0;

  update(dt: number, physicsState: PhysicsState): void {
    this.time += dt;

    if (this.state === 'hidden') {
      if (physicsState.distance >= this.appearDistance) {
        this.state = 'entering';
        this.entranceProgress = 0;
        this.onEnter();
      }
      return;
    }

    if (this.state === 'entering') {
      this.entranceProgress = Math.min(1, this.entranceProgress + dt / this.entranceDuration);
      if (this.entranceProgress >= 1) this.state = 'following';
    }

    if (!physicsState.isGameOver) {
      this.onUpdate(dt, physicsState);
    }
  }

  render(ctx: CanvasRenderingContext2D, groundY: number): void {
    if (this.state === 'hidden') return;
    this.onRender(ctx, groundY);
  }

  reset(): void {
    this.state = 'hidden';
    this.entranceProgress = 0;
    this.time = 0;
    this.onReset();
  }

  protected abstract onUpdate(dt: number, physicsState: PhysicsState): void;
  protected abstract onRender(ctx: CanvasRenderingContext2D, groundY: number): void;
  protected onEnter(): void {}
  setAppearDistance(distance: number): void {
    this.appearDistance = distance;
  }

  protected onReset(): void {}
}
