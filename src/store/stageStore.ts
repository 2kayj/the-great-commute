import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LOOP_CYCLE_DAYS } from '../data/rankTable';

interface StageStore {
  currentDay: number;
  stageBaseDistance: number;
  difficultyMultiplier: number;
  usedContinue: boolean;
  continueDistance: number;
  totalCompletedDays: number;
  loopCount: number;

  advanceStage: () => void;
  continueFromCurrentDay: (distance: number) => void;
  resetStage: () => void;
  resetAll: () => void;
}

export const useStageStore = create<StageStore>()(
  persist(
    (set) => ({
      currentDay: 1,
      stageBaseDistance: 0,
      difficultyMultiplier: 1.0,
      usedContinue: false,
      continueDistance: 0,
      totalCompletedDays: 0,
      loopCount: 0,

      advanceStage: () => set((state) => {
        const nextTotalDays = state.totalCompletedDays + 1;
        const crossedLoopBoundary = nextTotalDays % LOOP_CYCLE_DAYS === 0;
        return {
          currentDay: state.currentDay + 1,
          stageBaseDistance: state.stageBaseDistance + 200,
          difficultyMultiplier: state.difficultyMultiplier * 1.2,
          totalCompletedDays: nextTotalDays,
          loopCount: crossedLoopBoundary ? state.loopCount + 1 : state.loopCount,
          continueDistance: 0,
        };
      }),

      continueFromCurrentDay: (distance: number) => set({ usedContinue: true, continueDistance: distance }),

      resetStage: () => set({
        currentDay: 1,
        stageBaseDistance: 0,
        difficultyMultiplier: 1.0,
        usedContinue: false,
        continueDistance: 0,
      }),

      resetAll: () => set({
        currentDay: 1,
        stageBaseDistance: 0,
        difficultyMultiplier: 1.0,
        usedContinue: false,
        continueDistance: 0,
        totalCompletedDays: 0,
        loopCount: 0,
      }),
    }),
    { name: 'stage-store-v2' },
  ),
);
