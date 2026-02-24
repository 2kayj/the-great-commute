// 빌드 타임 __PLATFORM__ 변수에 따라 적절한 어댑터를 선택
// Vite define으로 주입된 값 기준으로 트리셰이킹이 적용됨
import * as toss from './toss';
import * as store from './store';
import type { PlatformAdapter } from './types';

declare const __PLATFORM__: 'toss' | 'store' | undefined;

const isToss = typeof __PLATFORM__ !== 'undefined' && __PLATFORM__ === 'toss';

const adapter: PlatformAdapter = isToss
  ? {
      PLATFORM: toss.PLATFORM,
      initAds: toss.initAds,
      showRewardedAd: toss.showRewardedAd,
      showInterstitialAd: toss.showInterstitialAd,
      purchaseCoffee: toss.purchaseCoffee,
      restorePendingPurchases: toss.restorePendingPurchases,
    }
  : {
      PLATFORM: store.PLATFORM,
      initAds: store.initAds,
      showRewardedAd: store.showRewardedAd,
      showInterstitialAd: store.showInterstitialAd,
      purchaseCoffee: store.purchaseCoffee,
      restorePendingPurchases: store.restorePendingPurchases,
    };

export default adapter;
