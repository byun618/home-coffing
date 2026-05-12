# Client Stack — apps/app (Expo)

> client-engineer가 작업 시 참고. **Expo 앱이 단일 클라이언트** (T005에서 apps/web 폐기).

## apps/app — Expo SDK 54

### 디렉토리 구조

```
apps/app/
├── app/                  # expo-router 라우트
│   ├── (main)/           # 인증 후
│   ├── (public)/         # 인증 전
│   ├── beans/            # 원두 화면
│   ├── records/          # 소비 기록
│   ├── _layout.tsx
│   ├── account.tsx
│   ├── cafe-settings.tsx
│   └── notifications.tsx
├── src/
│   ├── components/
│   └── lib/              # api 클라이언트, 훅
├── assets/
├── app.json
├── eas.json
├── metro.config.js       # NativeWind 래핑만
├── babel.config.js
└── tailwind.config.js
```

### 절대 건드리지 말 것

- **`metro.config.js`의 watchFolders·nodeModulesPaths** — Expo SDK 52+는 pnpm 자동 지원
- **`app.json`의 `experiments.autolinkingModuleResolution: true`** — SDK 54 모노레포 native 모듈 중복 방지
- **`babel.config.js`에 reanimated plugin 수동 추가** — `babel-preset-expo`에 이미 포함
- **`app.json`의 `android.package`** — 변경하면 새 앱으로 취급
- **`app.json`의 `android.versionCode`** — 빌드마다 +1만 (롤백 시에도 더 높은 값)

### 패키지 설치 규칙

- **Expo 생태계** (native 모듈, `expo-router`, `react-native-reanimated`, `@react-native-community/datetimepicker` 등): `npx expo install`
- **순수 JS** (`@tanstack/react-query`, `zustand`, `react-hook-form`, `nativewind` 등): `pnpm add`

### 바텀시트

`@gorhom/bottom-sheet` 사용 금지 (Expo Go에서 `react-native-gesture-handler` TurboModule 충돌). RN 내장 `Modal` + `Animated` 패턴.
기존 패턴: `apps/app/src/components/` 하위의 Modal 컴포넌트 참고.

### API 호출

`apps/app/src/lib/api/` 하위에 tanstack-query 훅 단위로:
```typescript
export function useBeans() {
  return useQuery({ queryKey: ['beans'], queryFn: fetchBeans });
}
```

직접 fetch 금지 — 항상 훅으로 래핑.

### Auth 흐름

- access token: 메모리 (또는 dev-plan에 따라 expo-secure-store)
- refresh token: expo-secure-store
- 401 → refresh 1회 → 실패 시 (public)/login 강제 이동

### 환경 변수

- `apps/app/.env`의 `EXPO_PUBLIC_API_URL`
- EAS Build는 `eas.json`의 `env` 블록 (별도 동기화 필요)
- 로컬 dev에서도 Cloudflare Tunnel URL 권장 (LTE/WiFi 무관)

## shared-types 사용

`packages/shared-types`에서 import:
```typescript
import type { BeanResponse, CreateBeanDto } from '@home-coffing/shared-types';
```

서버 DTO와 어긋날 위험 방지. 클라이언트에서 임의 정의 금지.

## 디자인 톤·컴포넌트 카탈로그

- **`spec/design-system.md`** — 톤·원칙 + 컴포넌트 카탈로그 (옛 spec/component-library.md는 폐기)
- **`spec/design.pen`** — visual master, screen frames(S##), Pencil MCP로만 접근
- **`spec/design-system.pen`** — 컴포넌트 visual
- **디자인 토큰** (색·간격·폰트) — `apps/app/tailwind.config.js` (spec엔 카탈로그 없음)

## 화면 ID(S##) ↔ 라우트 매핑

- design.pen의 frame 이름이 S## (예: S02 = Home Tab)
- screens.md에 각 탭/스크린이 어느 S##인지 표기
- 코드 라우트 변경 시 design.pen S## 매핑이 어긋나지 않는지 확인

## 변상현 개인 코드 스타일

- `as` 단언 기피
- 파라미터 2개 이상이면 단일 객체
- 수정 범위 최소화
- 불필요한 추상화 지양
