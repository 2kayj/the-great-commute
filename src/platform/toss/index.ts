/**
 * 앱인토스 플랫폼 어댑터
 *
 * - 광고: 토스 애즈 SDK
 * - 결제: 토스페이먼츠 (커피 5잔 / 3,000원)
 * - 배포: 앱인토스
 */

export const PLATFORM = 'toss' as const;

// TODO: 토스 애즈 SDK 연동
export function initAds(): void {
  console.log('[toss] 토스 애즈 SDK 초기화');
}

// TODO: 토스페이먼츠 결제
export function purchaseCoffee(): Promise<boolean> {
  console.log('[toss] 토스페이먼츠 커피 구매');
  return Promise.resolve(false);
}

// TODO: 리워드 광고 (토스 애즈)
export function showRewardedAd(): Promise<boolean> {
  console.log('[toss] 리워드 광고 표시');
  return Promise.resolve(false);
}
