import type { PhysicsState } from '../Physics';
import { DogFollower } from './DogFollower';
import { ButterflyFollower } from './ButterflyFollower';
import { RainEffect } from './RainEffect';
import { CatFollower } from './CatFollower';
import { SparrowFollower } from './SparrowFollower';
import { TurtleFollower } from './TurtleFollower';
import { FireflyFollower } from './FireflyFollower';
import { BaseFollower } from './BaseFollower';

export class FollowerManager {
  private followers: BaseFollower[] = [
    new TurtleFollower(),      // 50m
    new ButterflyFollower(),   // 100m
    new RainEffect(),          // 150m
    new CatFollower(),         // 200m
    new SparrowFollower(),     // 250m
    new DogFollower(),         // 300m
    new FireflyFollower(),     // 350m
  ];

  // Day 1 fixed offsets (original appear distances relative to stage start)
  private readonly DAY1_OFFSETS = [50, 100, 150, 200, 250, 300, 350];

  update(dt: number, physicsState: PhysicsState): void {
    for (const f of this.followers) f.update(dt, physicsState);
  }

  render(ctx: CanvasRenderingContext2D, groundY: number): void {
    for (const f of this.followers) f.render(ctx, groundY);
  }

  reset(): void {
    for (const f of this.followers) f.reset();
  }

  setupForStage(stageBaseDistance: number, currentDay: number): void {
    if (currentDay === 1) {
      // Day 1: fixed order - Turtle, Butterfly, Rain, Cat, Sparrow, Dog, Firefly
      for (let i = 0; i < this.followers.length; i++) {
        this.followers[i].setAppearDistance(stageBaseDistance + this.DAY1_OFFSETS[i]);
        this.followers[i].reset();
      }
    } else {
      // Day 2+: shuffle followers (except RainEffect) then assign 50,100,150... offsets
      // Separate rain from others
      const rain = this.followers.find(f => f instanceof RainEffect)!;
      const others = this.followers.filter(f => !(f instanceof RainEffect));

      // Fisher-Yates shuffle
      for (let i = others.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [others[i], others[j]] = [others[j], others[i]];
      }

      // Insert rain at a random position
      const rainIndex = Math.floor(Math.random() * (others.length + 1));
      others.splice(rainIndex, 0, rain);

      // Assign distances: 50, 100, 150, 200, 250, 300, 350
      for (let i = 0; i < others.length; i++) {
        others[i].setAppearDistance(stageBaseDistance + (i + 1) * 50);
        others[i].reset();
      }

      // Update followers array to match new order
      this.followers = others;
    }
  }
}
