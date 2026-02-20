import { create } from 'zustand';
import type { GamePhase } from '../types/game.types';

interface GameStore {
  phase: GamePhase;
  distance: number;
  elapsedTime: number;
  isNewRecord: boolean;

  setPhase: (phase: GamePhase) => void;
  setDistance: (distance: number) => void;
  setElapsedTime: (elapsedTime: number) => void;
  setIsNewRecord: (isNewRecord: boolean) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  phase: 'ready',
  distance: 0,
  elapsedTime: 0,
  isNewRecord: false,

  setPhase: (phase) => set({ phase }),
  setDistance: (distance) => set({ distance }),
  setElapsedTime: (elapsedTime) => set({ elapsedTime }),
  setIsNewRecord: (isNewRecord) => set({ isNewRecord }),
  resetGame: () => set({
    phase: 'ready',
    distance: 0,
    elapsedTime: 0,
    isNewRecord: false,
  }),
}));
