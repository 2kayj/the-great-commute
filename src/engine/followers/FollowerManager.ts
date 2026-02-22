import type { PhysicsState } from '../Physics';
import { DogFollower } from './DogFollower';
import { ButterflyFollower } from './ButterflyFollower';
import { RainEffect } from './RainEffect';
import { CatFollower } from './CatFollower';
import { SparrowFollower } from './SparrowFollower';
import { TurtleFollower } from './TurtleFollower';
import { FireflyFollower } from './FireflyFollower';

export class FollowerManager {
  private followers = [new DogFollower(), new ButterflyFollower(), new RainEffect(), new CatFollower(), new SparrowFollower(), new TurtleFollower(), new FireflyFollower()];

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
