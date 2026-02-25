# Capacitor로 React+Vite 게임을 Google Play Store에 올리기

> 조사일: 2026-02-24
> 기준 버전: Capacitor 6/7 (최신), Node.js 22+
> 대상 프로젝트: React 19 + Vite 7 + TypeScript, 빌드 출력 `dist/`

---

## 사전 요구사항 체크리스트

| 항목 | 요구사항 | 비고 |
|------|---------|------|
| Node.js | 22 이상 | `node -v` 확인 |
| Android Studio | 2025.2.1 이상 | JDK는 자동 설치됨 - 별도 설치 불필요 |
| JDK | 17 (Android Studio 번들) | 별도 설치 불필요 |
| Google Play Developer 계정 | 필수 | $25 일회성 등록비 |
| 빌드 출력 디렉토리 | `dist/` | vite build 출력 경로 |

---

## STEP 1: Capacitor 설치 및 초기화

### 1-1. 패키지 설치

```bash
# Capacitor 코어 및 CLI 설치
npm install @capacitor/core
npm install -D @capacitor/cli

# Android 플랫폼 패키지 설치
npm install @capacitor/android
```

### 1-2. Capacitor 초기화

```bash
npx cap init
```

프롬프트에서 입력:
- App name: `허약 신입 출근 대작전` (또는 영문명)
- App Package ID: `com.yourcompany.thegreatcommute` (역도메인 형식)
- Web asset directory: `dist` (Vite 빌드 출력 경로)

### 1-3. capacitor.config.ts 설정

프로젝트 루트에 생성되는 `capacitor.config.ts` 확인 및 수정:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.thegreatcommute',
  appName: '허약 신입 출근 대작전',
  webDir: 'dist',           // Vite 빌드 출력 디렉토리
  bundledWebRuntime: false,
};

export default config;
```

### 1-4. Android 플랫폼 추가

```bash
# 먼저 Vite 빌드 실행 (dist/ 생성)
npm run build

# Android 플랫폼 추가
npx cap add android

# 웹 빌드를 네이티브 프로젝트에 동기화
npx cap sync
```

---

## STEP 2: Android 빌드 환경 설정 (Windows)

### 2-1. Android Studio 설치

1. https://developer.android.com/studio 에서 다운로드 및 설치
2. 최소 버전: **Android Studio 2025.2.1**
3. JDK는 Android Studio에 번들 포함 - 별도 설치 불필요

### 2-2. Android SDK 설치

Android Studio 실행 후:
- **Tools → SDK Manager** 이동
- SDK Platforms 탭: **Android 7.0 (API 24)** 이상 선택 (최신 안정 버전 권장: Android 16, API 36)
- SDK Tools 탭: Android SDK Build-Tools, Android Emulator, Android SDK Platform-Tools 체크

### 2-3. 환경변수 설정 (Windows)

Windows 검색에서 "시스템 환경 변수 편집" → 환경 변수 버튼:

**시스템 변수에 추가:**
```
변수명: ANDROID_HOME
변수값: C:\Users\[사용자명]\AppData\Local\Android\Sdk
```

**Path 시스템 변수에 추가:**
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

**설정 확인:**
```bash
# 새 터미널에서 확인
adb version
```

### 2-4. Windows 주의사항

- 경로에 한글/공백 포함 금지
- PowerShell과 CMD 중 환경변수가 적용된 터미널 사용
- Android Studio를 먼저 실행해 SDK 초기화 후 환경변수 설정 권장

---

## STEP 3: AdMob 플러그인 설치

### 3-1. 패키지 설치

```bash
npm install @capacitor-community/admob@6
npx cap sync
```

### 3-2. AndroidManifest.xml 수정

`android/app/src/main/AndroidManifest.xml` 파일의 `<application>` 태그 내부에 추가:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="@string/admob_app_id"/>
```

### 3-3. strings.xml에 AdMob App ID 추가

`android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">허약 신입 출근 대작전</string>
    <!-- AdMob App ID - AdMob 콘솔에서 발급받은 실제 ID로 교체 -->
    <string name="admob_app_id">ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX</string>
</resources>
```

### 3-4. 코드에서 AdMob 초기화

```typescript
import { AdMob } from '@capacitor-community/admob';

// 앱 시작 시 초기화
await AdMob.initialize({
  testingDevices: ['DEVICE_ID'], // 테스트 기기 ID (개발 중)
  initializeForTesting: true,   // 배포 시 false로 변경
});
```

### 3-5. 광고 유형별 구현 예시

```typescript
import { AdMob, InterstitialAdPluginEvents, AdLoadInfo } from '@capacitor-community/admob';

// 전면 광고 (Interstitial)
const prepareInterstitial = async () => {
  AdMob.addListener(InterstitialAdPluginEvents.Loaded, (info: AdLoadInfo) => {
    // 광고 로드 완료
  });

  await AdMob.prepareInterstitial({
    adId: 'ca-app-pub-XXXXX/XXXXX', // 실제 광고 ID
    isTesting: false,
  });
};

const showInterstitial = async () => {
  await AdMob.showInterstitial();
};
```

---

## STEP 4: IAP 플러그인 설치 (RevenueCat)

### 4-1. 패키지 설치

```bash
npm install @revenuecat/purchases-capacitor
npx cap sync
```

### 4-2. AndroidManifest.xml launchMode 확인

`android/app/src/main/AndroidManifest.xml`의 Activity 설정:

```xml
<activity
    android:name=".MainActivity"
    android:launchMode="singleTop"  <!-- standard 또는 singleTop 필수 -->
    ...>
```

> singleTop이 아니면 사용자가 뱅킹 앱으로 결제 확인 후 돌아올 때 구매가 취소될 수 있음

### 4-3. 코드 초기화

```typescript
import { Purchases } from '@revenuecat/purchases-capacitor';

// 앱 시작 시 초기화
await Purchases.configure({
  apiKey: 'your_google_play_api_key', // RevenueCat 콘솔에서 발급
});

// 상품 목록 조회
const offerings = await Purchases.getOfferings();

// 구매 실행
const purchaseResult = await Purchases.purchasePackage({
  aPackage: offerings.current?.monthly, // 또는 원하는 패키지
});
```

---

## STEP 5: 빌드 → AAB 생성 → Play Console 업로드

### 5-1. 매번 빌드할 때 실행할 명령어 순서

```bash
# 1. 웹 빌드 (dist/ 갱신)
npm run build

# 2. 네이티브 프로젝트에 동기화
npx cap sync android
```

### 5-2. Keystore 생성 (최초 1회)

Android Studio에서:
- **Build → Generate Signed Bundle / APK**
- **Create new...** 클릭
- keystore 파일 경로, 비밀번호, alias 설정 후 저장

또는 CLI로 생성:
```bash
keytool -genkeypair -v \
  -keystore release-key.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias release
```

> keystore 파일은 절대 분실하면 안 됨. 앱 업데이트에 영구 사용.

### 5-3. CLI로 서명된 AAB 빌드 (권장)

```bash
npx cap build android \
  --keystorepath /c/Users/oneci/release-key.jks \
  --keystorepass YOUR_KEYSTORE_PASSWORD \
  --keystorealias release \
  --keystorealiaspass YOUR_KEY_PASSWORD \
  --androidreleasetype AAB
```

빌드 결과물 위치:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### 5-4. Android Studio로 빌드 (대안)

```bash
# Android Studio에서 프로젝트 열기
npx cap open android
```

Android Studio에서:
1. **Build → Generate Signed Bundle / APK**
2. **Android App Bundle** 선택
3. keystore 정보 입력
4. Release 선택 → Finish
5. `android/app/release/app-release.aab` 생성

### 5-5. Google Play Console 업로드

1. https://play.google.com/console 접속
2. 앱 만들기 → 기본 정보 입력
3. 왼쪽 메뉴 **프로덕션 → 출시 만들기**
4. `.aab` 파일 업로드
5. 출시 정보 작성 (새 기능 등)
6. 검토를 위해 출시 시작

---

## 개발 워크플로 요약

```bash
# 개발 중 반복 사이클
npm run build          # 웹 앱 빌드
npx cap sync android   # 네이티브에 동기화
npx cap open android   # Android Studio 열기 (테스트)

# 또는 직접 실행
npx cap run android    # 연결된 기기에 바로 실행
```

---

## 참고 자료

- [Capacitor 공식 설치 문서](https://capacitorjs.com/docs/getting-started)
- [Capacitor Android 문서](https://capacitorjs.com/docs/android)
- [Capacitor 환경 설정](https://capacitorjs.com/docs/getting-started/environment-setup)
- [Capacitor cap build CLI](https://capacitorjs.com/docs/cli/commands/build)
- [capacitor-community/admob GitHub](https://github.com/capacitor-community/admob)
- [RevenueCat Capacitor 설치](https://www.revenuecat.com/docs/getting-started/installation/capacitor)
- [Google Play 배포 가이드](https://capacitorjs.com/docs/android/deploying-to-google-play)
