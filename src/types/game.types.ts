export type GamePhase = 'ready' | 'countdown' | 'playing' | 'over' | 'stage-transition' | 'promotion' | 'cutscene';

export interface Vec2 {
  x: number;
  y: number;
}

export interface VerletNode {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  pinned: boolean;
}

export interface GameState {
  phase: GamePhase;
  distance: number;
  elapsedTime: number;
  angle: number;
  angularVelocity: number;
  speed: number;
  walkPhase: number;
  isNewRecord: boolean;
}

export interface RecordState {
  bestDistance: number;
  recentRecords: number[];
}

export interface InputState {
  direction: -1 | 0 | 1;
  isPressed: boolean;
}

export interface BuildingData {
  x: number;
  topY: number;
  width: number;
  windows: { x: number; y: number; w: number; h: number }[];
  wobble: number[];
}

export interface CloudData {
  x: number;
  y: number;
  scale: number;
  speed: number;
  seed: number;
}
