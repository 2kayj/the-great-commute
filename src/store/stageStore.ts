import { create } from 'zustand';

interface StageStore {
  currentDay: number;
  stageBaseDistance: number;
  difficultyMultiplier: number;
  usedContinue: boolean;

  advanceStage: () => void;
  continueFromCurrentDay: () => void;
  resetStage: () => void;
}

export const useStageStore = create<StageStore>((set) => ({
  currentDay: 1,
  stageBaseDistance: 0,
  difficultyMultiplier: 1.0,
  usedContinue: false,

  advanceStage: () => set((state) => ({
    currentDay: state.currentDay + 1,
    stageBaseDistance: state.stageBaseDistance + 400,
    difficultyMultiplier: state.difficultyMultiplier * 1.2,
  })),

  continueFromCurrentDay: () => set({ usedContinue: true }),

  resetStage: () => set({
    currentDay: 1,
    stageBaseDistance: 0,
    difficultyMultiplier: 1.0,
    usedContinue: false,
  }),
}));
