import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RecentRecord {
  distance: number;
  maxDay: number;
}

interface RecordStore {
  bestDistance: number;
  bestDay: number;
  bestTotalDays: number;
  recentRecords: RecentRecord[];

  submitRecord: (distance: number, maxDay: number, totalCompletedDays: number) => boolean;
  clearRecords: () => void;
}

export const useRecordStore = create<RecordStore>()(
  persist(
    (set, get) => ({
      bestDistance: 0,
      bestDay: 0,
      bestTotalDays: 0,
      recentRecords: [],

      submitRecord: (distance: number, maxDay: number, totalCompletedDays: number): boolean => {
        const { bestDistance, bestDay, bestTotalDays, recentRecords } = get();
        const rounded = Math.floor(distance);
        const isNew = rounded > bestDistance;

        set({
          bestDistance: isNew ? rounded : bestDistance,
          bestDay: maxDay > bestDay ? maxDay : bestDay,
          bestTotalDays: totalCompletedDays > bestTotalDays ? totalCompletedDays : bestTotalDays,
          recentRecords: [{ distance: rounded, maxDay }, ...recentRecords].slice(0, 5),
        });

        return isNew;
      },

      clearRecords: () => set({ bestDistance: 0, bestDay: 0, bestTotalDays: 0, recentRecords: [] }),
    }),
    {
      name: 'office-walk-records',
    }
  )
);
