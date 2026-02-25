// 빌드 타임 __PLATFORM__ 변수에 따라 적절한 어댑터를 선택
// 토스 어댑터는 동적 import로 로드 — SDK가 일반 브라우저에서 크래시하는 것을 방지
import * as store from './store';
import type { PlatformAdapter } from './types';

declare const __PLATFORM__: 'toss' | 'store' | undefined;

const isToss = typeof __PLATFORM__ !== 'undefined' && __PLATFORM__ === 'toss';

// store 어댑터를 기본값으로 사용, 토스 환경이면 덮어씀
const adapter: PlatformAdapter = {
  PLATFORM: store.PLATFORM,
  initAds: store.initAds,
  showRewardedAd: store.showRewardedAd,
  showInterstitialAd: store.showInterstitialAd,
  purchaseCoffee: store.purchaseCoffee,
  restorePendingPurchases: store.restorePendingPurchases,
  submitScore: store.submitScore,
  openLeaderboard: store.openLeaderboard,
};

if (isToss) {
  // 동적 import — 토스 WebView 밖에서는 로드하지 않음
  import('./toss').then((toss) => {
    adapter.PLATFORM = toss.PLATFORM;
    adapter.initAds = toss.initAds;
    adapter.showRewardedAd = toss.showRewardedAd;
    adapter.showInterstitialAd = toss.showInterstitialAd;
    adapter.purchaseCoffee = toss.purchaseCoffee;
    adapter.restorePendingPurchases = toss.restorePendingPurchases;
    adapter.submitScore = toss.submitScore;
    adapter.openLeaderboard = toss.openLeaderboard;
    // 동적 로드 후 초기화
    adapter.initAds();
    adapter.restorePendingPurchases();
  }).catch((e) => {
    console.warn('[platform] 토스 SDK 로드 실패 (일반 브라우저 환경):', e);
  });
}

export default adapter;
