# 플랫폼 분기 가이드

## 레포 구조

```
tenqube/the-great-commute (모노레포)
├── src/                    # 게임 코어 (공유)
│   ├── engine/             # 물리/렌더링 엔진
│   ├── screens/            # 화면 컴포넌트
│   ├── store/              # Zustand 스토어
│   ├── data/               # 랭크/스테이지 데이터
│   └── platform/           # 플랫폼별 어댑터
│       ├── types.ts        # 공통 인터페이스
│       ├── toss/index.ts   # 앱인토스 (토스 애즈, 토스페이먼츠)
│       └── store/index.ts  # 앱스토어 (AdMob, IAP)
├── vite.config.ts          # 기본 빌드 (GitHub Pages 데모)
├── vite.config.toss.ts     # 앱인토스 빌드 (TODO)
└── vite.config.store.ts    # 앱스토어 빌드 (TODO)
```

## 빌드 명령 (예정)

```bash
npm run build          # GitHub Pages 데모 (현재)
npm run build:toss     # 앱인토스 배포
npm run build:store    # 앱스토어 배포
```

## 플랫폼별 차이

| 항목 | 앱인토스 (toss) | 앱스토어 (store) |
|------|----------------|-----------------|
| 광고 SDK | 토스 애즈 SDK | AdMob |
| 결제 | 토스페이먼츠 | Google Play Billing / Apple IAP |
| 배포 | 앱인토스 | Google Play / App Store |
| 커피 가격 | 3,000원 (5잔) | 3,000원 (5잔) |

## 리모트 구성

```bash
origin   → 2kayj/the-great-commute (개인, GitHub Pages 데모)
tenqube  → tenqube/the-great-commute (회사, 프로덕션)
```

## 플랫폼 어댑터 사용법

각 플랫폼 어댑터는 동일한 인터페이스(`PlatformAdapter`)를 구현합니다.
빌드 시 환경변수 또는 vite define으로 플랫폼을 주입하면,
런타임에 적절한 어댑터가 로드됩니다.

```typescript
// 예시: 빌드 시점에 결정
import * as platform from './platform/toss';  // or './platform/store'
platform.initAds();
```
