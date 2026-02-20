import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RecordStore {
  bestDistance: number;
  recentRecords: number[];

  submitRecord: (distance: number) => boolean;
  clearRecords: () => void;
}

export const useRecordStore = create<RecordStore>()(
  persist(
    (set, get) => ({
      bestDistance: 0,
      recentRecords: [],

      submitRecord: (distance: number): boolean => {
        const { bestDistance, recentRecords } = get();
        const rounded = Math.floor(distance);
        const isNew = rounded > bestDistance;

        set({
          bestDistance: isNew ? rounded : bestDistance,
          recentRecords: [rounded, ...recentRecords].slice(0, 5),
        });

        return isNew;
      },

      clearRecords: () => set({ bestDistance: 0, recentRecords: [] }),
    }),
    {
      name: 'office-walk-records',
    }
  )
);
