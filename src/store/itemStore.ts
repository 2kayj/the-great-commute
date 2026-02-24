import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ItemStore {
  coffeeCount: number;
  addCoffee: (amount: number) => void;
  consumeCoffee: () => boolean;
}

export const useItemStore = create<ItemStore>()(
  persist(
    (set, get) => ({
      coffeeCount: 3, // 첫 시작 시 3잔 지급 (persist로 이후 유지)

      addCoffee: (amount: number) => set((state) => ({
        coffeeCount: state.coffeeCount + amount,
      })),

      consumeCoffee: () => {
        const state = get();
        if (state.coffeeCount <= 0) return false;
        set({ coffeeCount: state.coffeeCount - 1 });
        return true;
      },
    }),
    { name: 'item-store' },
  ),
);
