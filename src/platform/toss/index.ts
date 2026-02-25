/**
 * 앱인토스 플랫폼 어댑터
 *
 * - 광고: Google AdMob (GoogleAdMob)
 * - 결제: 앱인토스 IAP (커피 5잔 / 3,000원)
 * - 배포: 앱인토스
 */
import { GoogleAdMob, IAP } from '@apps-in-toss/web-framework';
import { submitGameCenterLeaderBoardScore, openGameCenterLeaderboard } from '@apps-in-toss/web-bridge';

export const PLATFORM = 'toss' as const;

// 테스트용 Ad Group ID (프로덕션 시 앱인토스 콘솔에서 발급받은 실제 ID로 교체)
const AD_GROUPS = {
  rewarded: 'ait-ad-test-rewarded-id',
  interstitial: 'ait-ad-test-interstitial-id',
};

// 커피 상품 SKU (앱인토스 콘솔에서 설정 필요)
const COFFEE_SKU = 'coffee_5cups';

export function initAds(): void {
  // 리워드 광고 미리 로드
  GoogleAdMob.loadAppsInTossAdMob({
    options: { adGroupId: AD_GROUPS.rewarded },
    onEvent: () => {},
    onError: (e) => console.warn('[toss] 리워드 광고 프리로드 실패:', e),
  });
  // 전면 광고 미리 로드
  GoogleAdMob.loadAppsInTossAdMob({
    options: { adGroupId: AD_GROUPS.interstitial },
    onEvent: () => {},
    onError: (e) => console.warn('[toss] 전면 광고 프리로드 실패:', e),
  });
}

export function showRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    // 로드 안 됐으면 먼저 로드 후 표시, 로드됐으면 바로 표시
    GoogleAdMob.isAppsInTossAdMobLoaded({ adGroupId: AD_GROUPS.rewarded })
      .then((loaded) => {
        const doShow = () => {
          let earned = false;
          const cleanup = GoogleAdMob.showAppsInTossAdMob({
            options: { adGroupId: AD_GROUPS.rewarded },
            onEvent: (event) => {
              if (event.type === 'userEarnedReward') {
                earned = true;
              }
              if (event.type === 'dismissed' || event.type === 'failedToShow') {
                cleanup();
                // 다음번을 위해 프리로드
                GoogleAdMob.loadAppsInTossAdMob({
                  options: { adGroupId: AD_GROUPS.rewarded },
                  onEvent: () => {},
                  onError: () => {},
                });
                resolve(earned);
              }
            },
            onError: (e) => {
              console.warn('[toss] 리워드 광고 표시 실패:', e);
              cleanup();
              resolve(false);
            },
          });
        };

        if (loaded) {
          doShow();
        } else {
          // 로드 후 표시
          const loadCleanup = GoogleAdMob.loadAppsInTossAdMob({
            options: { adGroupId: AD_GROUPS.rewarded },
            onEvent: (event) => {
              if (event.type === 'loaded') {
                loadCleanup();
                doShow();
              }
            },
            onError: (e) => {
              console.warn('[toss] 리워드 광고 로드 실패:', e);
              loadCleanup();
              resolve(false);
            },
          });
        }
      })
      .catch((e) => {
        console.warn('[toss] 리워드 광고 로드 상태 확인 실패:', e);
        resolve(false);
      });
  });
}

export function showInterstitialAd(): Promise<boolean> {
  return new Promise((resolve) => {
    GoogleAdMob.isAppsInTossAdMobLoaded({ adGroupId: AD_GROUPS.interstitial })
      .then((loaded) => {
        const doShow = () => {
          const cleanup = GoogleAdMob.showAppsInTossAdMob({
            options: { adGroupId: AD_GROUPS.interstitial },
            onEvent: (event) => {
              if (event.type === 'dismissed' || event.type === 'failedToShow') {
                cleanup();
                // 다음번을 위해 프리로드
                GoogleAdMob.loadAppsInTossAdMob({
                  options: { adGroupId: AD_GROUPS.interstitial },
                  onEvent: () => {},
                  onError: () => {},
                });
                resolve(event.type === 'dismissed');
              }
            },
            onError: (e) => {
              console.warn('[toss] 전면 광고 표시 실패:', e);
              cleanup();
              resolve(false);
            },
          });
        };

        if (loaded) {
          doShow();
        } else {
          const loadCleanup = GoogleAdMob.loadAppsInTossAdMob({
            options: { adGroupId: AD_GROUPS.interstitial },
            onEvent: (event) => {
              if (event.type === 'loaded') {
                loadCleanup();
                doShow();
              }
            },
            onError: (e) => {
              console.warn('[toss] 전면 광고 로드 실패:', e);
              loadCleanup();
              resolve(false);
            },
          });
        }
      })
      .catch((e) => {
        console.warn('[toss] 전면 광고 로드 상태 확인 실패:', e);
        resolve(false);
      });
  });
}

export function purchaseCoffee(): Promise<boolean> {
  return new Promise((resolve) => {
    const cleanup = IAP.createOneTimePurchaseOrder({
      options: {
        sku: COFFEE_SKU,
        processProductGrant: (_params: { orderId: string }) => {
          return true;
        },
      },
      onEvent: (_event) => {
        cleanup();
        resolve(true);
      },
      onError: (_error) => {
        cleanup();
        resolve(false);
      },
    });
  });
}

export async function restorePendingPurchases(): Promise<void> {
  try {
    const pending = await IAP.getPendingOrders();
    const orders = pending?.orders ?? [];
    for (const order of orders) {
      await IAP.completeProductGrant({ params: { orderId: order.orderId } });
    }
  } catch (e) {
    console.warn('[toss] 미지급 주문 복원 실패:', e);
  }
}

export async function submitScore(score: number): Promise<boolean> {
  try {
    const result = await submitGameCenterLeaderBoardScore({ score: String(score) });
    return result?.statusCode === 'SUCCESS';
  } catch (e) {
    console.warn('[toss] 리더보드 점수 제출 실패:', e);
    return false;
  }
}

export async function openLeaderboard(): Promise<void> {
  try {
    await openGameCenterLeaderboard();
  } catch (e) {
    console.warn('[toss] 리더보드 열기 실패:', e);
  }
}
