import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdStore {
  totalPlayCount: number;
  shouldShowInterstitial: () => boolean;
  incrementPlayCount: () => void;
}

// Placeholder functions for actual ad SDK integration
export const showInterstitialAd = (): Promise<boolean> => {
  console.log('[Ad] Interstitial ad placeholder');
  return Promise.resolve(true);
};

export const showRewardedAd = (): Promise<boolean> => {
  console.log('[Ad] Rewarded ad placeholder');
  return Promise.resolve(true);
};

export const useAdStore = create<AdStore>()(
  persist(
    (set, get) => ({
      totalPlayCount: 0,

      shouldShowInterstitial: () => get().totalPlayCount >= 3,

      incrementPlayCount: () => set((state) => ({
        totalPlayCount: state.totalPlayCount + 1,
      })),
    }),
    {
      name: 'office-walk-ads',
    }
  )
);
