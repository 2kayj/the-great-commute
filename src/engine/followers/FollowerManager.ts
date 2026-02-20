import type { PhysicsState } from '../Physics';
import { DogFollower } from './DogFollower';
import { ButterflyFollower } from './ButterflyFollower';

export class FollowerManager {
  private followers = [new DogFollower(), new ButterflyFollower()];

  update(dt: number, physicsState: PhysicsState): void {
    for (const f of this.followers) f.update(dt, physicsState);
  }

  render(ctx: CanvasRenderingContext2D, groundY: number): void {
    for (const f of this.followers) f.render(ctx, groundY);
  }

  reset(): void {
    for (const f of this.followers) f.reset();
  }
}
