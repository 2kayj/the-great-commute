import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ItemStore {
  coffeeCount: number;
  coffeeUsedThisRun: boolean;
  addCoffee: (amount: number) => void;
  consumeCoffee: () => boolean;
  resetRunFlags: () => void;
}

export const useItemStore = create<ItemStore>()(
  persist(
    (set, get) => ({
      coffeeCount: 3, // 테스트용 초기값 (배포 시 0으로 변경)
      coffeeUsedThisRun: false,

      addCoffee: (amount: number) => set((state) => ({
        coffeeCount: state.coffeeCount + amount,
      })),

      consumeCoffee: () => {
        const state = get();
        if (state.coffeeCount <= 0 || state.coffeeUsedThisRun) return false;
        set({ coffeeCount: state.coffeeCount - 1, coffeeUsedThisRun: true });
        return true;
      },

      resetRunFlags: () => set({ coffeeUsedThisRun: false }),
    }),
    { name: 'item-store' },
  ),
);
