# 앱인토스 인앱 결제(IAP) SDK 개발 가이드

작성일: 2026-02-24
출처:
- [앱인토스 개발자센터 IAP 개요](https://developers-apps-in-toss.toss.im/iap/intro.html)
- [IAP 개발 가이드](https://developers-apps-in-toss.toss.im/iap/develop.html)
- [IAP 콘솔 가이드](https://developers-apps-in-toss.toss.im/iap/console.html)
- [IAP SDK 레퍼런스](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱%20결제/IAP.md)
- [IAP QA 가이드](https://developers-apps-in-toss.toss.im/iap/qa.html)
- [GitHub 예제](https://github.com/toss/apps-in-toss-examples)

---

## 1. IAP 개요

앱인토스 인앱 결제는 토스 앱 내에서 유료 상품을 구매할 수 있는 결제 방식이다. Apple/Google 스토어 결제 시스템을 통하며, 토스가 중간에서 결제 처리를 담당한다.

### 1.1 우리 게임의 IAP 목표

**허약 신입 출근 대작전** 게임에서의 IAP 활용:
- 커피 5잔 = 3,000원 (소모성 아이템)
- 커피는 위험 상태 자동 발동 쉴드 아이템

### 1.2 아이템 유형

| 유형 | 설명 | 우리 게임 적용 |
|------|------|--------------|
| **소모성 (Consumable)** | 사용하면 소진, 재구매 가능 | 커피 (게임 쉴드) |
| **비소모성 (Non-consumable)** | 한 번 구매 후 영구 사용 | 광고 제거 (추후) |

### 1.3 수수료 구조

- **앱마켓 수수료**: 15%
- **토스 수수료**: 5%
- **총 수수료**: 20%
- 예) 3,000원 판매 시 실수령액: 2,400원

---

## 2. SDK 설치 및 설정

### 2.1 패키지 설치

```bash
npm install @apps-in-toss/web-framework
```

IAP 기능은 `@apps-in-toss/web-framework`에 포함되어 있다. 별도 패키지 불필요.

### 2.2 SDK 지원 버전

- 토스앱 5.219.0 버전부터 지원
- 지원하지 않는 버전에서는 `undefined` 반환 (버전 체크 필수)

### 2.3 IAP Import 방법

```typescript
// WebView 방식 (우리 게임은 이것 사용)
import { IAP } from '@apps-in-toss/web-framework';
```

---

## 3. 핵심 API 레퍼런스

### 3.1 IAP 메서드 목록

| 메서드 | 설명 | 최소 버전 |
|--------|------|---------|
| `getProductItemList()` | 구매 가능한 상품 목록 조회 | 5.219.0 |
| `createOneTimePurchaseOrder()` | 결제창 표시 및 결제 처리 | 5.219.0 |
| `getPendingOrders()` | 결제 완료 미지급 주문 조회 | Android 5.234.0 / iOS 5.231.0 |
| `completeProductGrant()` | 상품 지급 완료 처리 | Android 5.231.0 / iOS 5.231.0 |
| `getCompletedOrRefundedOrders()` | 완료/환불 주문 목록 조회 | Android 5.231.0 / iOS 5.231.0 |

---

### 3.2 getProductItemList()

콘솔에 등록된 구매 가능한 상품 목록을 조회한다.

**함수 시그니처:**
```typescript
function getProductItemList(): Promise<{ products: IapProductListItem[] } | undefined>;
```

**반환 타입:**
```typescript
interface IapProductListItem {
  sku: string;          // 상품 고유 ID (콘솔에서 설정)
  displayAmount: string; // 표시 가격 (예: "3,000원")
  displayName: string;   // 표시 이름 (예: "커피 5잔")
  iconUrl: string;       // 상품 아이콘 URL
  description: string;   // 상품 설명
}
```

**사용 예시:**
```typescript
import { IAP } from '@apps-in-toss/web-framework';

async function fetchProducts() {
  const response = await IAP.getProductItemList();
  return response?.products ?? [];
}

// React에서 사용
const [products, setProducts] = useState<IapProductListItem[]>([]);

useEffect(() => {
  IAP.getProductItemList().then(response => {
    setProducts(response?.products ?? []);
  });
}, []);
```

---

### 3.3 createOneTimePurchaseOrder()

결제창을 표시하고 인앱 결제를 처리하는 핵심 함수.

**함수 시그니처:**
```typescript
function createOneTimePurchaseOrder(
  params: IapCreateOneTimePurchaseOrderOptions
): () => void;  // cleanup 함수 반환
```

**파라미터 타입:**
```typescript
interface IapCreateOneTimePurchaseOrderOptions {
  sku: string;  // 구매할 상품의 SKU
  processProductGrant: (orderId: string) => boolean | Promise<boolean>;  // 상품 지급 콜백
  onEvent: (data: IapOrderSuccessData) => void;  // 결제 성공 이벤트
  onError: (error: unknown) => void;             // 에러 처리
}
```

**성공 응답 데이터:**
```typescript
interface IapOrderSuccessData {
  orderId: string;         // 주문 ID
  displayName: string;     // 상품명
  displayAmount: string;   // 결제 금액 (표시용)
  amount: number;          // 결제 금액 (숫자)
  currency: string;        // 통화 (KRW)
  fraction: number;        // 소수점 자릿수
  miniAppIconUrl: string | null;  // 앱 아이콘
}
```

**중요: SDK 1.1.3 버전부터 결제 성공 시 `processProductGrant` 콜백이 자동 실행되며, 지급 완료 후 `onEvent` 콜백이 호출된다.**

**JavaScript 구현 예시:**
```javascript
import { IAP } from '@apps-in-toss/web-framework';

let cleanup = null;

function buyCoffee(sku) {
  // 기존 결제 정리
  if (cleanup) {
    cleanup();
    cleanup = null;
  }

  cleanup = IAP.createOneTimePurchaseOrder({
    sku: sku,  // 예: 'coffee_5cups'

    // 상품 지급 처리 (결제 성공 시 자동 호출)
    processProductGrant: async (orderId) => {
      try {
        // 서버에 상품 지급 처리 요청
        const response = await fetch('/api/grant-product', {
          method: 'POST',
          body: JSON.stringify({ orderId, sku }),
          headers: { 'Content-Type': 'application/json' }
        });
        return response.ok;  // true: 지급 성공
      } catch (error) {
        console.error('상품 지급 실패:', error);
        return false;
      }
    },

    // 전체 완료 이벤트
    onEvent: (data) => {
      console.log('결제 및 지급 완료:', data.orderId);
      // 게임 내 아이템 반영 (로컬)
      addCoffeeToGame(5);
      showPurchaseSuccess();
    },

    // 에러 처리
    onError: (error) => {
      console.error('결제 오류:', error);
      // 취소/실패 처리
      showPurchaseFailed();
    }
  });
}
```

**React Hook 구현 예시:**
```typescript
import { useCallback } from 'react';
import { IAP } from '@apps-in-toss/web-framework';
import { useGameStore } from '../store/gameStore';

export function usePurchaseCoffee() {
  const { addCoffee } = useGameStore();

  const purchaseCoffee = useCallback(() => {
    const cleanup = IAP.createOneTimePurchaseOrder({
      sku: 'coffee_5cups',  // 콘솔에서 설정한 SKU

      processProductGrant: async (orderId: string) => {
        try {
          // 서버에 지급 처리 (백엔드 없으면 로컬 처리)
          addCoffee(5);
          return true;
        } catch {
          return false;
        }
      },

      onEvent: (data) => {
        console.log('커피 5잔 구매 완료!', data.orderId);
        // UI 피드백
      },

      onError: (error) => {
        console.error('구매 실패:', error);
        // 취소 또는 실패 처리
      }
    });

    return cleanup;  // 컴포넌트 언마운트 시 cleanup() 호출
  }, [addCoffee]);

  return { purchaseCoffee };
}
```

---

### 3.4 getPendingOrders()

결제는 완료되었으나 상품이 아직 지급되지 않은 주문을 조회한다. 앱 재시작 시 미지급 주문을 복원하는 데 사용한다.

**함수 시그니처:**
```typescript
function getPendingOrders(): Promise<{ orders: Order[] } | undefined>;

interface Order {
  orderId: string;
  sku: string;  // SDK 1.4.2+, Android 5.234.0+, iOS 5.231.0+
}
```

**사용 예시:**
```javascript
import { IAP } from '@apps-in-toss/web-framework';

async function restorePurchases() {
  try {
    const pendingOrders = await IAP.getPendingOrders();

    if (pendingOrders?.orders) {
      for (const order of pendingOrders.orders) {
        // 지급 처리
        await grantProduct(order.orderId, order.sku);
        // 지급 완료 표시
        await IAP.completeProductGrant({ params: { orderId: order.orderId } });
      }
    }
  } catch (error) {
    console.error('주문 복원 실패:', error);
  }
}
```

---

### 3.5 completeProductGrant()

미지급 주문에 상품을 지급하고 완료 처리한다.

**함수 시그니처:**
```typescript
function completeProductGrant(params: {
  params: {
    orderId: string;
  };
}): Promise<boolean | undefined>;
```

**사용 예시:**
```typescript
import { IAP } from '@apps-in-toss/web-framework';

async function handleGrantProduct(orderId: string) {
  try {
    await IAP.completeProductGrant({ params: { orderId } });
    console.log('상품 지급 완료 처리 성공');
  } catch (error) {
    console.error('지급 완료 처리 실패:', error);
  }
}
```

---

## 4. 결제 흐름 전체 구현

### 4.1 결제 흐름도

```
사용자가 "커피 구매" 버튼 클릭
  ↓
createOneTimePurchaseOrder() 호출
  ↓
토스 결제창 표시 (Apple Pay / Google Pay / 토스 카드)
  ↓
사용자 결제 승인
  ↓
processProductGrant() 자동 호출 (SDK 1.1.3+)
  ↓
서버에 아이템 지급 처리
  ↓
onEvent() 콜백 호출
  ↓
게임 내 커피 개수 +5
```

### 4.2 앱 시작 시 미지급 주문 복원 흐름

```
앱 시작
  ↓
getPendingOrders() 호출
  ↓
미지급 주문 있으면
  ↓
상품 지급 처리
  ↓
completeProductGrant() 호출
```

---

## 5. 허약 신입 게임 완전 구현 예시

### 5.1 IAP 훅 (useIAP.ts)

```typescript
// src/hooks/useIAP.ts
import { useState, useCallback, useEffect } from 'react';
import { IAP } from '@apps-in-toss/web-framework';
import { useGameStore } from '../store/gameStore';

const COFFEE_SKU = 'coffee_5cups';  // 콘솔에서 설정한 SKU

export function useIAP() {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const { addCoffee } = useGameStore();

  // 앱 시작 시 상품 목록 로드 + 미지급 주문 복원
  useEffect(() => {
    const init = async () => {
      // 상품 목록 조회
      const productList = await IAP.getProductItemList();
      setProducts(productList?.products ?? []);

      // 미지급 주문 복원
      await restorePendingOrders();
    };

    init().catch(console.error);
  }, []);

  // 미지급 주문 복원
  const restorePendingOrders = async () => {
    try {
      const pendingOrders = await IAP.getPendingOrders();
      if (!pendingOrders?.orders?.length) return;

      for (const order of pendingOrders.orders) {
        // 커피 지급
        if (order.sku === COFFEE_SKU) {
          addCoffee(5);
        }
        // 완료 처리
        await IAP.completeProductGrant({ params: { orderId: order.orderId } });
        console.log('미지급 주문 복원 완료:', order.orderId);
      }
    } catch (error) {
      console.error('주문 복원 실패:', error);
    }
  };

  // 커피 구매
  const purchaseCoffee = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    let cleanup: (() => void) | null = null;

    try {
      cleanup = IAP.createOneTimePurchaseOrder({
        sku: COFFEE_SKU,

        processProductGrant: async (orderId: string) => {
          // 서버가 없으므로 로컬 상태에 바로 반영
          // 서버가 생기면 여기서 API 호출
          console.log('상품 지급 처리:', orderId);
          return true;
        },

        onEvent: (data) => {
          // 결제 + 지급 모두 완료
          addCoffee(5);
          console.log('커피 5잔 구매 완료!', data.orderId, data.displayAmount);
          setIsLoading(false);
        },

        onError: (error) => {
          console.error('구매 오류:', error);
          setIsLoading(false);
          // 사용자에게 오류 메시지 표시
        }
      });
    } catch (error) {
      console.error('결제 초기화 실패:', error);
      setIsLoading(false);
    }

    return () => {
      cleanup?.();
    };
  }, [isLoading, addCoffee]);

  return {
    isLoading,
    products,
    purchaseCoffee,
    restorePendingOrders
  };
}
```

### 5.2 상점 화면 (ShopScreen.tsx)

```typescript
// src/screens/ShopScreen.tsx
import React from 'react';
import { useIAP } from '../hooks/useIAP';
import { useGameStore } from '../store/gameStore';

export function ShopScreen() {
  const { isLoading, products, purchaseCoffee } = useIAP();
  const { coffeeCount } = useGameStore();

  const coffeeProduct = products.find(p => p.sku === 'coffee_5cups');

  return (
    <div className="shop-screen">
      <h2>상점</h2>

      <div className="current-items">
        <p>현재 커피: <strong>{coffeeCount}잔</strong></p>
      </div>

      <div className="shop-items">
        <div className="shop-item">
          <img src="/assets/coffee-icon.png" alt="커피" />
          <div className="item-info">
            <h3>커피 5잔</h3>
            <p>위험할 때마다 자동으로 사용되는 생존 쉴드</p>
            <span className="price">
              {coffeeProduct?.displayAmount ?? '3,000원'}
            </span>
          </div>
          <button
            className="buy-btn"
            onClick={purchaseCoffee}
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '구매하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. 콘솔에서 상품 등록 방법

### 6.1 사전 요건

1. **사업자 정보 등록** (필수) - 콘솔 > 정보 탭
2. **정산 정보 입력** - 통장 사본의 예금주명과 정확히 일치해야 함 (검토: 영업일 2~3일)

### 6.2 상품 등록 항목

| 항목 | 요건 |
|------|------|
| 상품 유형 | 소모성 / 비소모성 선택 |
| SKU | 코드에서 사용할 상품 고유 ID (예: `coffee_5cups`) |
| 상품명 | 실제 제공 내용과 일치, 과장 금지 |
| 상품 이미지 | 1024×1024px, 저작권 문제 없음 |
| 공급가 | 400~1,400,000원, 10원 단위 (커피 5잔 = 3,000원 설정) |
| 판매가 | 공급가에 부가가치세 자동 계산 포함 |

### 6.3 테스트 환경

- 샌드박스 환경에서는 **노출 상태가 ON인 상품만** 조회 가능
- 실제 결제 없이 테스트 가능 (샌드박스 모드)

---

## 7. IAP QA 체크리스트

### 기본 연동
- [ ] 구매 금액이 결제창과 일치하는지 확인
- [ ] 인앱 결제 정상 처리 확인
- [ ] 결제 후 아이템 지급 및 게임 내 반영 확인
- [ ] 결제 취소 시 상점 화면으로 정상 복귀
- [ ] 에러 발생 시 사용자에게 명확한 메시지 표시

### 데이터/권한
- [ ] 재설치/기기 변경 시 비소모성 아이템 복원 테스트
- [ ] 중복 구매/지급 방지 로직 확인

### 안정성
- [ ] 네트워크 오류 시 재시도/복원 흐름 확인
- [ ] 앱 재시작/백그라운드 전환 시 상태 일관성 유지
- [ ] `getPendingOrders()` 로 미지급 주문 복원 동작 확인

### 운영 팁
- orderId는 단건-단결제 원칙으로 운영
- 모든 처리 결과를 서버에 영구 저장 (서버 있을 경우)
- 소모성 아이템은 멱등성 설계 (중복 클릭 방지)

---

## 8. 주의사항 및 금지사항

### 필수 준수
- 결제 진행 중 배경음악/효과음 일시 정지 필수 (검수 항목)
- 결제 완료 후 음악/영상 자동 재개
- 결제/인증 프로세스 중 광고 삽입 금지

### 제약사항
- 게임 아이템에는 IAP 사용 (토스페이 사용 불가)
- 현금성/환금성 이벤트 불가
- 게임 아이템, 기프티콘, 상품권 현금화 불가

---

## 9. 토스페이 vs IAP 비교 (우리 게임 기준)

| 항목 | IAP | 토스페이 |
|------|-----|---------|
| **적용 대상** | 게임 아이템 (커피, 코인 등) | 실물 상품, 서비스 |
| **우리 게임** | 사용해야 함 | 사용 불가 |
| **수수료** | 앱마켓 15% + 토스 5% = 20% | 별도 수수료 |
| **결제 방식** | Apple Pay / Google Pay / 토스 | 토스페이먼츠 |
| **SDK** | `IAP` from `@apps-in-toss/web-framework` | `TossPay` from 동일 패키지 |

**결론: 커피(게임 아이템) 구매는 반드시 IAP를 사용해야 한다.**

---

## 10. 참고 링크

- [IAP 이해하기](https://developers-apps-in-toss.toss.im/iap/intro.html)
- [IAP 개발 가이드](https://developers-apps-in-toss.toss.im/iap/develop.html)
- [IAP 콘솔 가이드](https://developers-apps-in-toss.toss.im/iap/console.html)
- [IAP QA 가이드](https://developers-apps-in-toss.toss.im/iap/qa.html)
- [IAP SDK 레퍼런스](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱%20결제/IAP.md)
- [createOneTimePurchaseOrder 레퍼런스](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱%20결제/createOneTimePurchaseOrder.md)
- [getPendingOrders 레퍼런스](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱%20결제/getPendingOrders.md)
- [completeProductGrant 레퍼런스](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱%20결제/completeProductGrant.md)
- [GitHub 예제 (with-in-app-purchase)](https://github.com/toss/apps-in-toss-examples)

---

**마지막 업데이트:** 2026-02-24
