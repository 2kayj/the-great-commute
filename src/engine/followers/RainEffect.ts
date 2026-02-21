import type { PhysicsState } from '../Physics';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../utils/constants';
import { BaseFollower } from './BaseFollower';

const MAX_DROPS = 65;

// 바람 기울기: 살짝만 기울어짐
const WIND_X = 0.3;
const FALL_SPEED_MIN = 420;
const FALL_SPEED_MAX = 620;
const DROP_LENGTH_MIN = 4;
const DROP_LENGTH_MAX = 10;

// 화면보다 살짝 위에서 생성해서 끊김 없이 내려오게
const SPAWN_TOP = -30;

interface RainDrop {
  x: number;
  y: number;
  speed: number;   // px/s 낙하 속도
  length: number;  // 빗방울 선 길이
  alpha: number;   // 개별 투명도 변화 (반짝이는 느낌)
}

export class RainEffect extends BaseFollower {
  protected appearDistance = 150;
  // BaseFollower의 entranceDuration: 비가 서서히 나타나는 시간 (2초)
  protected entranceDuration = 2.0;

  private drops: RainDrop[] = [];

  // 파티클 풀 초기화
  protected onEnter(): void {
    this.drops = [];
    for (let i = 0; i < MAX_DROPS; i++) {
      this.drops.push(this.createDrop(true));
    }
  }

  protected onReset(): void {
    this.drops = [];
  }

  protected onUpdate(dt: number, _physicsState: PhysicsState): void {
    for (const drop of this.drops) {
      drop.x += WIND_X * drop.speed * dt;
      drop.y += drop.speed * dt;

      // 화면 아래나 오른쪽 밖으로 나가면 맨 위에서 재생성
      if (drop.y > CANVAS_HEIGHT + drop.length || drop.x > CANVAS_WIDTH + 20) {
        const recycled = this.createDrop(false);
        drop.x = recycled.x;
        drop.y = recycled.y;
        drop.speed = recycled.speed;
        drop.length = recycled.length;
        drop.alpha = recycled.alpha;
      }
    }
  }

  protected onRender(ctx: CanvasRenderingContext2D, _groundY: number): void {
    // entranceProgress(0→1)로 전체 비 알파를 페이드인
    const globalFade = this.entranceProgress;

    ctx.save();
    ctx.lineCap = 'round';

    for (const drop of this.drops) {
      // 빗방울 끝점 (낙하 방향으로 선 그리기)
      const endX = drop.x + WIND_X * drop.length;
      const endY = drop.y + drop.length;

      // 개별 알파 * 전체 페이드인
      const finalAlpha = drop.alpha * globalFade;

      ctx.globalAlpha = finalAlpha;
      ctx.strokeStyle = '#9BB5CE'; // 연한 청회색
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private createDrop(scatter: boolean): RainDrop {
    const speed =
      FALL_SPEED_MIN + Math.random() * (FALL_SPEED_MAX - FALL_SPEED_MIN);
    const length =
      DROP_LENGTH_MIN + Math.random() * (DROP_LENGTH_MAX - DROP_LENGTH_MIN);

    // scatter=true: 처음 생성 시 화면 전체에 랜덤 분포
    // scatter=false: 재활용 시 상단 + 약간 왼쪽에서 생성
    const x = scatter
      ? Math.random() * (CANVAS_WIDTH + 40) - 20
      : Math.random() * (CANVAS_WIDTH + 40) - 40;
    const y = scatter
      ? Math.random() * CANVAS_HEIGHT
      : SPAWN_TOP - Math.random() * 40;

    // 개별 알파: 0.35~0.75 범위로 랜덤하게 배치
    const alpha = 0.35 + Math.random() * 0.4;

    return { x, y, speed, length, alpha };
  }
}
