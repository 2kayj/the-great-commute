export type WorldPhase = 'company' | 'politics' | 'isekai' | 'space';

export type CharacterItem = 'coffee' | 'sword' | 'flag';

export type EventType = 'bump' | 'wind' | 'slope';

export interface RankDef {
  id: string;
  name: string;
  world: WorldPhase;
  cumulativeDays: number;
  item: CharacterItem;
  unlocksEvent?: EventType;
  speedMultiplier: number;
}

export interface LoopState {
  loopCount: number;
  eventIntensity: number;
}
