import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import platform from '../platform';

interface AdStore {
  totalPlayCount: number;
  shouldShowInterstitial: () => boolean;
  incrementPlayCount: () => void;
}

// 플랫폼 어댑터를 통한 광고 호출
export const showInterstitialAd = (): Promise<boolean> => {
  return platform.showInterstitialAd();
};

export const showRewardedAd = (): Promise<boolean> => {
  return platform.showRewardedAd();
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
    { name: 'office-walk-ads' }
  )
);
