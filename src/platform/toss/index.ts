/**
 * 앱인토스 플랫폼 어댑터
 *
 * - 광고: Google AdMob (loadFullScreenAd / showFullScreenAd)
 * - 결제: 앱인토스 IAP (커피 5잔 / 3,000원)
 * - 배포: 앱인토스
 */
import { loadFullScreenAd, showFullScreenAd, IAP } from '@apps-in-toss/web-framework';
import { submitGameCenterLeaderBoardScore, openGameCenterLeaderboard } from '@apps-in-toss/web-bridge';

export const PLATFORM = 'toss' as const;

// 테스트용 Ad Group ID (프로덕션 시 앱인토스 콘솔에서 발급받은 실제 ID로 교체)
const AD_GROUPS = {
  rewarded: 'ait-ad-test-rewarded-id',
  interstitial: 'ait-ad-test-interstitial-id',
};

// 커피 상품 SKU (앱인토스 콘솔에서 설정 필요)
const COFFEE_SKU = 'coffee_5cups';

// 프리로드 완료 상태 추적 (isAppsInTossAdMobLoaded 대체)
const adLoaded = {
  rewarded: false,
  interstitial: false,
};

function preloadAd(type: keyof typeof AD_GROUPS): void {
  adLoaded[type] = false;
  loadFullScreenAd({
    options: { adGroupId: AD_GROUPS[type] },
    onEvent: (event) => {
      if (event.type === 'loaded') {
        adLoaded[type] = true;
      }
    },
    onError: (e) => console.warn(`[toss] ${type === 'rewarded' ? '리워드' : '전면'} 광고 프리로드 실패:`, e),
  });
}

export function initAds(): void {
  if (!loadFullScreenAd.isSupported()) {
    console.warn('[toss] loadFullScreenAd 미지원 환경 — 광고 프리로드 건너뜀');
    return;
  }
  // 리워드 광고 미리 로드
  preloadAd('rewarded');
  // 전면 광고 미리 로드
  preloadAd('interstitial');
}

export function showRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    const doShow = () => {
      let earned = false;
      adLoaded.rewarded = false;
      const cleanup = showFullScreenAd({
        options: { adGroupId: AD_GROUPS.rewarded },
        onEvent: (event) => {
          if (event.type === 'userEarnedReward') {
            earned = true;
          }
          if (event.type === 'dismissed') {
            cleanup();
            // 다음번을 위해 프리로드
            preloadAd('rewarded');
            resolve(earned);
          }
          if (event.type === 'failedToShow') {
            cleanup();
            preloadAd('rewarded');
            resolve(false);
          }
        },
        onError: (e) => {
          console.warn('[toss] 리워드 광고 표시 실패:', e);
          cleanup();
          resolve(false);
        },
      });
    };

    if (adLoaded.rewarded) {
      doShow();
    } else {
      // 로드 후 표시
      const loadCleanup = loadFullScreenAd({
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
  });
}

export function showInterstitialAd(): Promise<boolean> {
  return new Promise((resolve) => {
    const doShow = () => {
      adLoaded.interstitial = false;
      const cleanup = showFullScreenAd({
        options: { adGroupId: AD_GROUPS.interstitial },
        onEvent: (event) => {
          if (event.type === 'dismissed') {
            cleanup();
            // 다음번을 위해 프리로드
            preloadAd('interstitial');
            resolve(true);
          }
          if (event.type === 'failedToShow') {
            cleanup();
            preloadAd('interstitial');
            resolve(false);
          }
        },
        onError: (e) => {
          console.warn('[toss] 전면 광고 표시 실패:', e);
          cleanup();
          resolve(false);
        },
      });
    };

    if (adLoaded.interstitial) {
      doShow();
    } else {
      const loadCleanup = loadFullScreenAd({
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
