/**
 * 플랫폼 어댑터 공통 인터페이스
 */

export type PlatformType = 'toss' | 'store';

export interface PlatformAdapter {
  PLATFORM: PlatformType;
  initAds: () => void;
  showRewardedAd: () => Promise<boolean>;
  showInterstitialAd: () => Promise<boolean>;
  purchaseCoffee: () => Promise<boolean>;
  restorePendingPurchases: () => Promise<void>;
}
