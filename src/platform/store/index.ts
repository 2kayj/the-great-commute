/**
 * 앱스토어 플랫폼 어댑터
 *
 * - 광고: AdMob
 * - 결제: Google Play Billing / Apple IAP (커피 5잔 / 3,000원)
 * - 배포: Google Play Store, Apple App Store
 */

export const PLATFORM = 'store' as const;

// TODO: AdMob 초기화
export function initAds(): void {
  console.log('[store] AdMob 초기화');
}

// TODO: Google Play / Apple IAP 결제
export function purchaseCoffee(): Promise<boolean> {
  console.log('[store] IAP 커피 구매');
  return Promise.resolve(false);
}

// TODO: 리워드 광고 (AdMob)
export function showRewardedAd(): Promise<boolean> {
  console.log('[store] AdMob 리워드 광고 표시');
  return Promise.resolve(false);
}
