import type { WorldPhase } from '../../types/rank.types';

export interface ThemeColors {
  sky: string;
  skyGradientEnd?: string;
  ground: string;
  groundFill: string;
  buildingFill: string;
  buildingStroke: string;
  windowFill: string;
  cloudFill?: string;
  cloudStroke?: string;
}

export interface BackgroundTheme {
  world: WorldPhase;
  subTheme?: string;
  colors: ThemeColors;
  renderSky(ctx: CanvasRenderingContext2D, time: number): void;
  renderExtraBack?(ctx: CanvasRenderingContext2D, time: number): void;
  renderExtraFront?(ctx: CanvasRenderingContext2D, time: number): void;

  /**
   * Optional override for how individual background buildings are drawn.
   * If not provided, BackgroundRenderer uses the default city-building style.
   */
  drawBuilding?(
    ctx: CanvasRenderingContext2D,
    bx: number,
    topY: number,
    width: number,
    bottomY: number,
    wobble: number[],
    time: number,
    isFar: boolean
  ): void;

  /**
   * Optional override for how the goal building is drawn.
   * If not provided, BackgroundRenderer uses the default office building style.
   */
  drawGoalBuilding?(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    topY: number,
    width: number,
    height: number,
    bottomY: number,
    wobble: number[],
    windows: { x: number; y: number; w: number; h: number }[],
    time: number
  ): void;
}
