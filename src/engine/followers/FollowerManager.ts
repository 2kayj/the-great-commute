import type { PhysicsState } from '../Physics';
import { DogFollower } from './DogFollower';
import { ButterflyFollower } from './ButterflyFollower';
import { RainEffect } from './RainEffect';
import { CatFollower } from './CatFollower';
import { SparrowFollower } from './SparrowFollower';
import { TurtleFollower } from './TurtleFollower';
import { FireflyFollower } from './FireflyFollower';
import { BaseFollower } from './BaseFollower';

import {
  SlimeFollower,
  WispFollower,
  ManaDustEffect,
  MimicFollower,
  BatFollower,
  GolemChunkFollower,
  WillOWispFollower,
} from './isekai';

import {
  ProbeBotFollower,
  MiniDroneFollower,
  MicroMeteorEffect,
  SpaceCatFollower,
  TinyUFOFollower,
  CargoBoxFollower,
  FloatBeaconFollower,
} from './space';

// 월드 경계 (totalCompletedDays 기준)
// 0~20일: 회사, 21~37일: 정치, 38~63일: 이세계, 64~89일: 우주
function getWorldForDays(totalCompletedDays: number): 'company' | 'politics' | 'isekai' | 'space' {
  if (totalCompletedDays >= 64) return 'space';
  if (totalCompletedDays >= 38) return 'isekai';
  return 'company'; // 0~37: 회사/정치 모두 기존 팔로워
}

function createCompanyFollowers(): BaseFollower[] {
  return [
    new DogFollower(),
    new ButterflyFollower(),
    new RainEffect(),
    new CatFollower(),
    new SparrowFollower(),
    new TurtleFollower(),
    new FireflyFollower(),
  ];
}

function createIsekaiFollowers(): BaseFollower[] {
  return [
    new SlimeFollower(),
    new WispFollower(),
    new ManaDustEffect(),
    new MimicFollower(),
    new BatFollower(),
    new GolemChunkFollower(),
    new WillOWispFollower(),
  ];
}

function createSpaceFollowers(): BaseFollower[] {
  return [
    new ProbeBotFollower(),
    new MiniDroneFollower(),
    new MicroMeteorEffect(),
    new SpaceCatFollower(),
    new TinyUFOFollower(),
    new CargoBoxFollower(),
    new FloatBeaconFollower(),
  ];
}

export class FollowerManager {
  private followers: BaseFollower[] = createCompanyFollowers();

  // Day 1 fixed offsets (original appear distances relative to stage start)
  private readonly DAY1_OFFSETS = [25, 50, 75, 100, 125, 150, 175];

  // 현재 세팅된 월드 (불필요한 재생성 방지)
  private currentWorld: 'company' | 'politics' | 'isekai' | 'space' = 'company';

  update(dt: number, physicsState: PhysicsState): void {
    for (const f of this.followers) f.update(dt, physicsState);
  }

  render(ctx: CanvasRenderingContext2D, groundY: number): void {
    for (const f of this.followers) f.render(ctx, groundY);
  }

  reset(): void {
    for (const f of this.followers) f.reset();
  }

  setupForStage(stageBaseDistance: number, currentDay: number, totalCompletedDays: number): void {
    // 월드가 바뀌었으면 팔로워 배열 교체
    const world = getWorldForDays(totalCompletedDays);
    if (world !== this.currentWorld) {
      switch (world) {
        case 'isekai':
          this.followers = createIsekaiFollowers();
          break;
        case 'space':
          this.followers = createSpaceFollowers();
          break;
        default:
          this.followers = createCompanyFollowers();
          break;
      }
      this.currentWorld = world;
    }

    if (currentDay === 1) {
      // Day 1: fixed order
      for (let i = 0; i < this.followers.length; i++) {
        this.followers[i].setAppearDistance(stageBaseDistance + this.DAY1_OFFSETS[i]);
        this.followers[i].reset();
      }
    } else {
      // Day 2+: shuffle followers (except 파티클 이펙트) then assign offsets
      // RainEffect / ManaDustEffect / MicroMeteorEffect 는 위치 무관 이펙트이므로
      // 셔플에서 제외하고 랜덤 위치에 삽입
      const effectClasses = [RainEffect, ManaDustEffect, MicroMeteorEffect];
      const effect = this.followers.find(f =>
        effectClasses.some(cls => f instanceof cls)
      );
      const others = this.followers.filter(f =>
        !effectClasses.some(cls => f instanceof cls)
      );

      // Fisher-Yates shuffle
      for (let i = others.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [others[i], others[j]] = [others[j], others[i]];
      }

      // Insert effect at random position
      if (effect) {
        const effectIndex = Math.floor(Math.random() * (others.length + 1));
        others.splice(effectIndex, 0, effect);
      }

      // Assign distances: 25, 50, 75, 100, 125, 150, 175
      for (let i = 0; i < others.length; i++) {
        others[i].setAppearDistance(stageBaseDistance + (i + 1) * 25);
        others[i].reset();
      }

      this.followers = others;
    }
  }
}
