# 앱인토스 인앱 광고 SDK 개발 가이드

작성일: 2026-02-24
출처: [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/), [앱인토스 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)

---

## 1. 광고 SDK 개요

### 1.1 통합 SDK 개념
앱인토스는 **인앱 광고 2.0 ver2** 통합 SDK를 제공하며, 다음 두 광고 네트워크를 통합합니다:
- **토스 애즈 (Toss Ads)**: 한국 내 기본 광고 네트워크
- **구글 애드몹 (Google AdMob)**: 토스 애즈 미지원 환경의 폴백

**작동 방식:**
```
앱 실행
  ↓
토스 애즈 광고 호출 시도
  ↓
├─ 성공 → 토스 애즈 광고 표시
└─ 실패 → AdMob 광고로 자동 전환
```

### 1.2 지원하는 광고 유형

| 광고 타입 | 설명 | 특징 | 수익성 |
|-----------|------|------|--------|
| **전면형 (Interstitial)** | 화면 전체를 덮는 광고 | 화면 전환 시점(게임 오버, 스테이지 완료 등)에 자연스럽게 노출 | 높음 |
| **보상형 (Rewarded)** | 사용자가 선택해서 시청하는 광고 | "광고를 보면 보상 제공"의 구조로 자발적 참여 유도 | 매우 높음 |
| **배너 (Banner)** | 콘텐츠 상단/하단에 고정된 광고 | 항상 노출되는 안정적 수익원 | 낮음~중간 |

**권장 사용 전략:**
- 보상형 광고 → ARPU(사용자당 매출) 극대화
- 전면형 광고 → 자연스러운 사용자 경험 + 중간 수익
- 배너 광고 → 보조 수익원

---

## 2. SDK 설치 및 설정

### 2.1 패키지 설치

```bash
npm install @apps-in-toss/web-framework
```

또는 yarn/pnpm 사용 시:
```bash
yarn add @apps-in-toss/web-framework
pnpm add @apps-in-toss/web-framework
```

### 2.2 기본 Import

```javascript
// React 프로젝트
import {
  loadAppsInTossAdMob,
  showAppsInTossAdMob,
  isAppsInTossAdMobLoaded
} from '@apps-in-toss/web-framework';

// 또는 개별 import
import { loadAppsInTossAdMob } from '@apps-in-toss/web-framework/ads';
```

### 2.3 WebView 환경 설정

앱인토스는 **WebView 기반** 환경에서 동작합니다. HTML5 Canvas 기반 React 게임은 WebView 방식으로 등록하면 자동으로 작동합니다.

**WebView 환경 특성:**
- 토스 앱 내부의 WebView에서 실행
- 따라서 별도의 권한 요청이나 네이티브 코드 불필요
- 직접 광고 API만으로 구현 가능

---

## 3. 보상형(Rewarded) 광고 구현

### 3.1 기본 구현 패턴

```javascript
// 1단계: 광고 미리 로드
async function loadRewardedAd() {
  try {
    const adUnitId = 'ait-ad-test-rewarded-id'; // 테스트 ID 사용
    // 또는 운영 ID: 콘솔에서 생성한 실제 광고 그룹 ID

    await loadAppsInTossAdMob({
      adUnitId: adUnitId,
      adType: 'rewarded' // 보상형 광고
    });

    console.log('보상형 광고 로드 성공');
  } catch (error) {
    console.error('광고 로드 실패:', error);
  }
}

// 2단계: 광고 표시 및 보상 처리
async function showRewardedAd() {
  try {
    // 광고가 이미 로드되었는지 확인
    const isLoaded = await isAppsInTossAdMobLoaded({
      adUnitId: 'ait-ad-test-rewarded-id',
      adType: 'rewarded'
    });

    if (!isLoaded) {
      console.log('광고가 준비되지 않았습니다');
      return;
    }

    // 광고 표시
    const result = await showAppsInTossAdMob({
      adUnitId: 'ait-ad-test-rewarded-id',
      adType: 'rewarded'
    });

    // 3단계: 콜백 처리 - 사용자가 광고를 완료했는지 확인
    if (result.completed === true) {
      // ✅ 광고 완료: 사용자에게 보상 지급
      console.log('사용자가 광고를 완료했습니다');
      grantReward();
    } else {
      // ❌ 광고 미완료: 보상 미지급
      console.log('사용자가 광고를 건너뛰었습니다');
    }

  } catch (error) {
    console.error('광고 표시 실패:', error);
  }
}

// 보상 지급 함수
function grantReward() {
  // 게임 내 보상 로직
  // 예: 골드 100개 지급, 스태미나 회복 등
  gameState.addGold(100);
  gameState.restoreStamina();
  showRewardNotification('광고 보상을 받았습니다!');
}

// 4단계: 사용자 인터랙션에 따라 호출
document.getElementById('watchAdButton').addEventListener('click', async () => {
  // 광고 미리 로드 (필요시)
  await loadRewardedAd();

  // 광고 표시
  await showRewardedAd();
});
```

### 3.2 React Hook 형태의 구현

```javascript
import { useState, useCallback } from 'react';
import { loadAppsInTossAdMob, showAppsInTossAdMob, isAppsInTossAdMobLoaded } from '@apps-in-toss/web-framework';

function RewardedAdButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  const AD_UNIT_ID = 'ait-ad-test-rewarded-id';

  // 광고 미리 로드
  const handleLoadAd = useCallback(async () => {
    try {
      setIsLoading(true);
      await loadAppsInTossAdMob({
        adUnitId: AD_UNIT_ID,
        adType: 'rewarded'
      });
      setIsAdLoaded(true);
    } catch (error) {
      console.error('광고 로드 실패:', error);
      setIsAdLoaded(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 광고 표시 및 보상 처리
  const handleShowAd = useCallback(async () => {
    try {
      setIsLoading(true);

      // 광고가 로드되어 있는지 확인
      const loaded = await isAppsInTossAdMobLoaded({
        adUnitId: AD_UNIT_ID,
        adType: 'rewarded'
      });

      if (!loaded) {
        alert('광고가 준비 중입니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      // 광고 표시
      const result = await showAppsInTossAdMob({
        adUnitId: AD_UNIT_ID,
        adType: 'rewarded'
      });

      // 보상 처리
      if (result && result.completed === true) {
        handleGrantReward();
      }

      // 다시 광고를 로드해 다음 시청에 대비
      await handleLoadAd();

    } catch (error) {
      console.error('광고 표시 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGrantReward = () => {
    console.log('보상을 지급했습니다');
    // 게임 상태 업데이트 로직
  };

  return (
    <div className="reward-ad-container">
      <button
        onClick={handleLoadAd}
        disabled={isLoading || isAdLoaded}
      >
        {isLoading ? '광고 준비 중...' : '광고 준비'}
      </button>

      <button
        onClick={handleShowAd}
        disabled={isLoading || !isAdLoaded}
      >
        {isLoading ? '처리 중...' : '광고 보기 (보상 받기)'}
      </button>
    </div>
  );
}

export default RewardedAdButton;
```

---

## 4. 전면형(Interstitial) 광고 구현

### 4.1 기본 구현 패턴

```javascript
// 1단계: 전면형 광고 로드
async function loadInterstitialAd() {
  try {
    const adUnitId = 'ait-ad-test-interstitial-id'; // 테스트 ID

    await loadAppsInTossAdMob({
      adUnitId: adUnitId,
      adType: 'interstitial'
    });

    console.log('전면형 광고 로드 성공');
  } catch (error) {
    console.error('광고 로드 실패:', error);
  }
}

// 2단계: 게임 오버 또는 화면 전환 시점에 광고 표시
async function showInterstitialAd() {
  try {
    // 광고 표시
    await showAppsInTossAdMob({
      adUnitId: 'ait-ad-test-interstitial-id',
      adType: 'interstitial'
    });

    console.log('전면형 광고 표시됨');

    // 광고 표시 후 계속 진행
    // (전면형 광고는 보상이 없으므로 콜백 처리 불필요)

  } catch (error) {
    console.error('광고 표시 실패:', error);
  }
}

// 게임 오버 함수에서 호출
function handleGameOver() {
  console.log('게임 오버');

  // 광고 표시 (자동으로 UI가 일시 중지될 수 있음)
  showInterstitialAd();

  // 광고 표시 후 메인 메뉴로 돌아가기
  setTimeout(() => {
    goToMainMenu();
  }, 500);
}
```

### 4.2 권장 표시 시점

| 시점 | 사용자 경험 | 권장도 |
|------|-----------|-------|
| **게임 오버** | 자연스러운 중단점 | ⭐⭐⭐⭐⭐ |
| **스테이지 완료** | 승리 후 다음 진행 전 | ⭐⭐⭐⭐⭐ |
| **메인 메뉴로 복귀** | 게임 재시작 직전 | ⭐⭐⭐⭐ |
| **레벨 선택 화면** | 레벨 시작 전 | ⭐⭐⭐ |
| **게임 중** | 사용자 방해 (비권장) | ❌ |
| **결제/인증 중** | 정책 위반 | ❌❌❌ |

---

## 5. 배너 광고 구현

### 5.1 기본 HTML 구현

```html
<!-- HTML -->
<div id="banner-ad-container" style="
  width: 100%;
  height: 50px;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
">
  <!-- 광고가 여기에 로드됨 -->
</div>

<script>
import { loadAppsInTossAdMob } from '@apps-in-toss/web-framework';

async function loadBannerAd() {
  try {
    await loadAppsInTossAdMob({
      adUnitId: 'ait-ad-test-banner-id',
      adType: 'banner',
      containerElementId: 'banner-ad-container'
    });

    console.log('배너 광고 로드 완료');
  } catch (error) {
    console.error('배너 광고 로드 실패:', error);
  }
}

// 페이지 로드 시 실행
loadBannerAd();
</script>
```

### 5.2 React 구현

```javascript
import { useEffect } from 'react';
import { loadAppsInTossAdMob } from '@apps-in-toss/web-framework';

function BannerAd() {
  useEffect(() => {
    const loadBanner = async () => {
      try {
        await loadAppsInTossAdMob({
          adUnitId: 'ait-ad-test-banner-id',
          adType: 'banner',
          containerElementId: 'banner-container'
        });
      } catch (error) {
        console.error('배너 광고 로드 실패:', error);
      }
    };

    loadBanner();
  }, []);

  return (
    <div
      id="banner-container"
      style={{
        width: '100%',
        height: '50px',
        backgroundColor: '#f0f0f0',
        marginTop: '10px'
      }}
    />
  );
}

export default BannerAd;
```

---

## 6. 핵심 API 레퍼런스

### 6.1 loadAppsInTossAdMob

광고를 미리 로드하여 필요한 시점에 빠르게 표시할 수 있도록 준비합니다.

```javascript
await loadAppsInTossAdMob({
  adUnitId: string,        // 광고 단위 ID (테스트: 'ait-ad-test-rewarded-id')
  adType: 'rewarded' | 'interstitial' | 'banner',
  containerElementId?: string  // 배너 광고의 경우만 필요
});
```

**매개변수:**
- `adUnitId`: 콘솔에서 생성한 광고 그룹 ID 또는 테스트 ID
- `adType`: 광고 유형 (보상형, 전면형, 배너)
- `containerElementId`: 배너 광고를 표시할 DOM 요소 ID

**반환값:**
- Promise 해석 시 광고 로드 완료

**예시:**
```javascript
await loadAppsInTossAdMob({
  adUnitId: 'ait-ad-test-rewarded-id',
  adType: 'rewarded'
});
```

### 6.2 showAppsInTossAdMob

로드된 광고를 사용자에게 표시합니다. 보상형 광고의 경우 완료 여부 결과를 반환합니다.

```javascript
const result = await showAppsInTossAdMob({
  adUnitId: string,
  adType: 'rewarded' | 'interstitial' | 'banner'
});

// result = {
//   completed: true | false  (보상형 광고에만 해당)
// }
```

**반환 객체:**
```javascript
{
  completed: boolean  // true: 광고 완료, false: 사용자가 중단
}
```

**예시:**
```javascript
const result = await showAppsInTossAdMob({
  adUnitId: 'ait-ad-test-rewarded-id',
  adType: 'rewarded'
});

if (result.completed) {
  console.log('보상 지급');
} else {
  console.log('광고 중단');
}
```

### 6.3 isAppsInTossAdMobLoaded

광고가 로드되어 표시할 준비가 되었는지 확인합니다.

```javascript
const isLoaded = await isAppsInTossAdMobLoaded({
  adUnitId: string,
  adType: 'rewarded' | 'interstitial' | 'banner'
});

// isLoaded = true | false
```

**반환값:**
- `true`: 광고 준비 완료, 즉시 표시 가능
- `false`: 광고 로드 중 또는 실패

**예시:**
```javascript
if (await isAppsInTossAdMobLoaded({ adUnitId: 'ait-ad-test-rewarded-id', adType: 'rewarded' })) {
  showAdButton.disabled = false;
} else {
  showAdButton.disabled = true;
}
```

---

## 7. 테스트 및 운영 환경 설정

### 7.1 테스트 ID (개발 환경)

**필수 사항:** 개발 중에는 반드시 테스트 ID를 사용해야 합니다. 운영 ID를 사용하면 계정이 제재될 수 있습니다.

```javascript
// ✅ 개발 중 사용 (테스트)
const testIds = {
  rewarded: 'ait-ad-test-rewarded-id',
  interstitial: 'ait-ad-test-interstitial-id',
  banner: 'ait-ad-test-banner-id'
};

// ❌ 개발 중 금지 (운영 ID)
// 콘솔에서 생성한 실제 광고 ID는 배포 후 사용
```

### 7.2 운영 ID 획득 절차

1. **사업자 등록** (미등록시 불가)
   - 앱인토스 콘솔 > 정보 탭에서 사업자 정보 등록

2. **정산 정보 등록**
   - 콘솔 > 정보 탭 > 정산 정보 입력
   - 검수: 평균 2-3 영업일

3. **광고 그룹 생성**
   - 콘솔 > 광고 탭 > 광고 그룹 생성
   - 광고 타입: Interstitial, Rewarded, Banner
   - 보상형 광고: 보상 이름과 수량 설정 (예: "골드 x100")
   - 광고 ID 등록: 구글 등록 완료까지 최대 2시간

4. **코드에서 ID 사용**
   ```javascript
   // 실제 광고 ID로 변경
   const liveIds = {
     rewarded: 'your-live-rewarded-ad-id',
     interstitial: 'your-live-interstitial-ad-id'
   };
   ```

---

## 8. 광고 정책 및 주의사항

### 8.1 필수 준수 사항

**✅ 반드시 해야 할 것:**

1. **테스트 ID 사용**
   - 개발 중에는 테스트 ID만 사용
   - 운영 중에는 공식 광고 ID 사용

2. **광고 완료 후 보상 지급**
   ```javascript
   // 올바른 구현
   if (result.completed === true) {
     grantReward();  // ✅ 광고 완료 후에만 지급
   }
   ```

3. **자연스러운 표시 시점**
   - 게임 오버, 스테이지 완료 등 자연스러운 중단점
   - 사용자가 예상하는 시점에만 광고 표시

4. **UI 및 사용자 경험 보호**
   - 광고 라벨 유지 (예: "[광고]" 표시)
   - 광고 기본 동작 변경 금지 (클릭, 닫기 등)
   - 백버튼 동작 정상 유지

**❌ 절대 금지:**

1. **조기 종료/실패 시 보상 지급**
   ```javascript
   // ❌ 틀린 구현
   showAppsInTossAdMob(...);
   grantReward();  // 광고 완료 확인 없이 지급 금지
   ```

2. **자동 클릭, 자동 새로고침**
   - 클릭 트래픽 조작은 정책 위반

3. **비활성 링크 구조**
   - 광고 클릭 후 사용자가 갈 수 없는 곳 (404, 빈 페이지 등)

4. **결제/인증 중 광고 삽입**
   - 사용자가 선택 중일 때 광고 표시 금지

5. **광고 UI 위장**
   - 광고를 게임 콘텐츠처럼 표현 금지
   - "광고" 표시 숨김 금지

### 8.2 Google AdMob 정책

앱인토스는 Google AdMob 정책을 준수합니다:
- [AdMob 프로그램 정책](https://support.google.com/admob/answer/6128543)
- 명확한 광고/콘텐츠 구분
- 클릭 인센티브 금지 (보상 광고 제외)
- 트래픽 조작 금지

---

## 9. 수익화 최적화 전략

### 9.1 보상형 광고로 LTV 극대화

```javascript
// 게임 내 자연스러운 포인트에서 보상형 광고 제안
class GameMonetization {

  // 스태미나 소진 → 광고로 회복
  async recoverStaminaWithAd() {
    const loaded = await isAppsInTossAdMobLoaded({
      adUnitId: this.rewardedAdId,
      adType: 'rewarded'
    });

    if (loaded) {
      const result = await showAppsInTossAdMob({
        adUnitId: this.rewardedAdId,
        adType: 'rewarded'
      });

      if (result.completed) {
        this.restoreStamina(100);
        this.showNotification('광고 시청으로 스태미나 100 회복!');
      }
    }
  }

  // 게임 오버 → 전면형 광고 + 재시작 유도
  async handleGameOver() {
    await showAppsInTossAdMob({
      adUnitId: this.interstitialAdId,
      adType: 'interstitial'
    });

    setTimeout(() => {
      this.showRetryDialog();  // "다시 시작" 버튼 유도
    }, 500);
  }

  // 상점 → 배너 광고로 지속적 수익
  showShop() {
    // 상점 상단에 배너 광고 항상 표시
    this.loadBannerAd();
  }
}
```

### 9.2 수익화 예상치

| 광고 유형 | ARPU 기여도 | 특징 |
|-----------|-----------|------|
| 보상형 | ★★★★★ (가장 높음) | 사용자 자발적 참여로 높은 eCPM |
| 전면형 | ★★★★ | 자연스러운 중단점에서 안정적 수익 |
| 배너 | ★★ | 보조 수익원 |

**2026년 앱인토스 IAA 현황:**
- 기본 수수료: 15%
- 베타 기간: 현재 무료 (2월 기준)
- Toss Ads eCPM: AdMob보다 한국 지역에서 높은 편

---

## 10. 트러블슈팅

### 10.1 광고가 로드되지 않음

**현상:**
```javascript
isAppsInTossAdMobLoaded() → false
```

**원인 및 해결:**

| 원인 | 확인 방법 | 해결 방법 |
|------|---------|---------|
| **테스트 ID 잘못됨** | 콘솔 로그 확인 | 정확한 테스트 ID 사용: `ait-ad-test-rewarded-id` |
| **네트워크 연결 없음** | 인터넷 상태 확인 | Wi-Fi 또는 셀룰러 연결 확인 |
| **광고 서버 지역 제한** | VPN 사용 확인 | VPN 제거 (토스는 한국 기반) |
| **SDK 버전 오래됨** | `npm list @apps-in-toss/web-framework` | `npm update @apps-in-toss/web-framework` |

### 10.2 테스트 ID로만 광고 로드됨

**현상:**
```javascript
// 테스트 ID로는 성공
await loadAppsInTossAdMob({ adUnitId: 'ait-ad-test-rewarded-id', ... })  // ✅

// 운영 ID로는 실패
await loadAppsInTossAdMob({ adUnitId: 'my-live-ad-id', ... })  // ❌
```

**원인:**
- 콘솔에서 생성한 광고 ID가 아직 구글 등록 중 (최대 2시간)
- 사업자 등록 미완료
- 정산 정보 미등록

**해결:**
1. 콘솔에서 광고 그룹 생성 후 2시간 대기
2. 사업자 등록 확인: 콘솔 > 정보 탭
3. 정산 정보 입력 및 검수 완료 (2-3 영업일)

### 10.3 보상이 지급되지 않음

**현상:**
```javascript
result.completed === false  // 사용자가 광고를 본 것 같은데...
```

**원인:**

| 상황 | 해결 방법 |
|------|---------|
| **사용자가 광고 중간에 종료** | `result.completed === false` 정상 동작 |
| **네트워크 끊김** | 재시도 로직 구현 필요 |
| **콜백 미처리** | `result.completed` 체크 후에만 보상 지급 |

**올바른 구현:**
```javascript
const result = await showAppsInTossAdMob({
  adUnitId: myRewardedId,
  adType: 'rewarded'
});

// ✅ 명시적으로 completed 체크
if (result && result.completed === true) {
  await saveRewardToServer();  // 데이터베이스에 저장
  updateGameUI();
}
```

### 10.4 WebView 환경에서 작동 안 함

**현상:**
```javascript
// 일반 브라우저에서는 작동하는데 WebView에서는 작동하지 않음
showAppsInTossAdMob() → Error
```

**원인:**
- WebView에서는 앱인토스 API만 사용 가능
- 일반 브라우저 환경 불가

**해결:**
```javascript
// 환경 감지 후 조건부 로드
async function tryLoadAd() {
  if (isAppsInTossEnvironment()) {  // WebView 확인
    await loadAppsInTossAdMob(...);
  } else {
    console.log('앱인토스 WebView 환경에서만 작동합니다');
  }
}

// WebView 환경 확인 (앱인토스 제공 API)
function isAppsInTossEnvironment() {
  return typeof window !== 'undefined' && window.appsInToss !== undefined;
}
```

---

## 11. 실제 구현 예제: 허약 신입 게임

### 11.1 React 게임에 광고 통합

```javascript
// src/hooks/useAppsInTossAds.ts
import { useCallback, useRef } from 'react';
import {
  loadAppsInTossAdMob,
  showAppsInTossAdMob,
  isAppsInTossAdMobLoaded
} from '@apps-in-toss/web-framework';

interface AdConfig {
  rewarded: string;
  interstitial: string;
  banner: string;
}

const AD_CONFIG: AdConfig = {
  rewarded: 'ait-ad-test-rewarded-id',      // 개발: 테스트 ID
  interstitial: 'ait-ad-test-interstitial-id',
  banner: 'ait-ad-test-banner-id'
};

export function useAppsInTossAds() {
  const isLoadingRef = useRef(false);

  // 보상형 광고
  const showRewardedAd = useCallback(async (onReward?: () => void) => {
    try {
      const loaded = await isAppsInTossAdMobLoaded({
        adUnitId: AD_CONFIG.rewarded,
        adType: 'rewarded'
      });

      if (!loaded) {
        console.warn('광고가 준비되지 않았습니다');
        return false;
      }

      const result = await showAppsInTossAdMob({
        adUnitId: AD_CONFIG.rewarded,
        adType: 'rewarded'
      });

      if (result?.completed) {
        onReward?.();
        // 다음 광고 미리 로드
        preloadRewardedAd();
        return true;
      }
      return false;
    } catch (error) {
      console.error('보상형 광고 실패:', error);
      return false;
    }
  }, []);

  // 전면형 광고
  const showInterstitialAd = useCallback(async () => {
    try {
      await showAppsInTossAdMob({
        adUnitId: AD_CONFIG.interstitial,
        adType: 'interstitial'
      });
    } catch (error) {
      console.error('전면형 광고 실패:', error);
    }
  }, []);

  // 광고 미리 로드
  const preloadRewardedAd = useCallback(async () => {
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      await loadAppsInTossAdMob({
        adUnitId: AD_CONFIG.rewarded,
        adType: 'rewarded'
      });
    } catch (error) {
      console.error('광고 미리로드 실패:', error);
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  return {
    showRewardedAd,
    showInterstitialAd,
    preloadRewardedAd
  };
}
```

### 11.2 게임 오버 화면에 광고 통합

```javascript
// src/screens/GameOverScreen.tsx
import React, { useEffect } from 'react';
import { useAppsInTossAds } from '../hooks/useAppsInTossAds';

interface GameOverScreenProps {
  score: number;
  onRetry: () => void;
  onGoHome: () => void;
}

export function GameOverScreen({ score, onRetry, onGoHome }: GameOverScreenProps) {
  const { showInterstitialAd, preloadRewardedAd } = useAppsInTossAds();

  useEffect(() => {
    // 게임 오버 후 전면형 광고 표시
    showInterstitialAd();

    // 보상형 광고 미리 로드 (메인 메뉴에서 사용)
    preloadRewardedAd();
  }, [showInterstitialAd, preloadRewardedAd]);

  return (
    <div className="game-over-container">
      <h1>게임 오버!</h1>
      <p className="score">스코어: {score}</p>

      <button className="retry-btn" onClick={onRetry}>
        다시 시작
      </button>

      <button className="home-btn" onClick={onGoHome}>
        메인으로
      </button>
    </div>
  );
}
```

### 11.3 메인 메뉴에 보상형 광고 추가

```javascript
// src/screens/MainMenuScreen.tsx
import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useAppsInTossAds } from '../hooks/useAppsInTossAds';

export function MainMenuScreen() {
  const { gold, addGold } = useGameStore();
  const { showRewardedAd, preloadRewardedAd } = useAppsInTossAds();

  const handleWatchAd = async () => {
    const success = await showRewardedAd(() => {
      // 광고 완료 콜백
      addGold(100);
      showNotification('광고 시청으로 금화 100을 받았습니다!');
    });

    if (!success) {
      showNotification('광고 시청 실패');
    }
  };

  React.useEffect(() => {
    // 메인 메뉴 로드 시 광고 미리 준비
    preloadRewardedAd();
  }, [preloadRewardedAd]);

  return (
    <div className="main-menu">
      <div className="header">
        <h1>허약 신입 출근 대작전</h1>
      </div>

      <div className="player-stats">
        <p>금화: <span>{gold}</span></p>
      </div>

      <div className="buttons">
        <button className="play-btn">시작</button>

        <button className="reward-btn" onClick={handleWatchAd}>
          광고 보기 (금화 +100)
        </button>

        <button className="settings-btn">설정</button>
      </div>
    </div>
  );
}
```

---

## 12. 데이터 분석 및 모니터링

### 12.1 콘솔 수익 대시보드

앱인토스 콘솔에서 제공하는 수익 분석:

```
콘솔 → 수익 탭 → 광고 성과 분석
├─ 노출 수 (Impressions)
├─ 클릭 수 (Clicks)
├─ 클릭률 (CTR)
├─ eCPM (1,000회 노출당 수익)
└─ 예상 수익
```

**월별 수익 정산:**
- 집계 기간: 1일 ~ 말일
- 수익 반영: 다음 달 1일
- 입금 처리: 해당 월 말일까지

### 12.2 커스텀 이벤트 로깅

```javascript
// src/utils/adLogger.ts
interface AdEvent {
  type: 'load' | 'show' | 'complete' | 'skip' | 'error';
  adType: 'rewarded' | 'interstitial' | 'banner';
  timestamp: number;
  duration?: number;
}

class AdLogger {
  private events: AdEvent[] = [];

  logEvent(event: AdEvent) {
    this.events.push({
      ...event,
      timestamp: Date.now()
    });

    // 서버에 전송 (분석용)
    this.sendToServer(event);
  }

  private async sendToServer(event: AdEvent) {
    // 게임 분석 서버에 전송
    await fetch('/api/analytics/ads', {
      method: 'POST',
      body: JSON.stringify(event)
    });
  }
}

export const adLogger = new AdLogger();
```

---

## 13. 참고 자료

### 공식 문서
- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [개발하기 가이드](https://developers-apps-in-toss.toss.im/ads/develop.html)
- [콘솔 설정 가이드](https://developers-apps-in-toss.toss.im/ads/console.html)

### 커뮤니티
- [앱인토스 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)
- [GitHub 예제](https://github.com/toss/apps-in-toss-examples)

### 외부 자료
- [Google AdMob 정책](https://support.google.com/admob/answer/6128543)
- [Google AdMob 보상형 광고 가이드](https://admob.google.com/intl/ko/home/resources/rewarded-ads-playbook/)

---

## 14. 빠른 시작 체크리스트

### 개발 환경 설정
- [ ] `npm install @apps-in-toss/web-framework` 설치
- [ ] 테스트 ID 획득: `ait-ad-test-rewarded-id` 등
- [ ] 게임 코드에 광고 Hook 추가

### 테스트 단계
- [ ] 보상형 광고 호출 테스트 (결과: `completed` 확인)
- [ ] 전면형 광고 호출 테스트
- [ ] 배너 광고 로드 테스트
- [ ] 네트워크 끊김 상황 테스트

### 운영 준비
- [ ] 사업자 등록
- [ ] 정산 정보 등록
- [ ] 광고 그룹 생성 (콘솔)
- [ ] 테스트 ID를 운영 ID로 변경
- [ ] 보상 규정 설정 (보상형 광고)

### 출시
- [ ] 광고 정책 준수 최종 확인
- [ ] 모든 광고 기능 QA 완료
- [ ] 앱인토스 콘솔에서 배포

---

**마지막 업데이트:** 2026-02-24
**다음 검토:** 광고 정책 변경 시 또는 SDK 메이저 업데이트 시
