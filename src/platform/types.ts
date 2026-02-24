/**
 * 플랫폼 어댑터 공통 인터페이스
 */

export type PlatformType = 'toss' | 'store';

export interface PlatformAdapter {
  PLATFORM: PlatformType;
  initAds: () => void;
  purchaseCoffee: () => Promise<boolean>;
  showRewardedAd: () => Promise<boolean>;
}
