# Operations

> 이 문서는 home-coffing을 다시 띄우거나 디버깅할 때 알아야 할 **비명시적 운영 지식**만 모은다.
> 기능 설계/UX 결정은 의도적으로 제외한다 (brain 레포의 `projects/home-coffing/`가 원전).

---

## 모노레포 / 셋업

### Node / pnpm 버전 고정
- Node 20 + pnpm 10.8.1. `package.json`의 `packageManager: pnpm@10.8.1`가 원전이며 Docker base 이미지도 `corepack prepare pnpm@10.8.1`로 맞춘다. 다른 버전에서 `pnpm install` 시 lockfile이 재생성될 수 있으니 고정값 유지.
- 출처: `package.json`, `Dockerfile`

### pnpm workspace `nodeLinker: hoisted`
- `pnpm-workspace.yaml`에 `nodeLinker: hoisted`가 들어 있다. `@nestjs/core`가 peer deps를 평면으로 올려야 동작하는 케이스 대응 차원이며, `package.json`의 `pnpm.onlyBuiltDependencies`도 `@nestjs/core`만 명시되어 있음. Expo 쪽은 SDK 54라서 hoisted여도 문제없음(아래 항목 참고).
- 출처: `pnpm-workspace.yaml`, `package.json`

### Expo SDK 52+는 pnpm 모노레포 자동 지원
- `metro.config.js`에 `watchFolders`, `nodeModulesPaths` 수동 설정 **하지 말 것**. SDK 52부터 Expo/Metro가 pnpm isolated 구조를 자동 감지. 수동 설정은 오히려 `Unable to resolve ../../App` 에러 유발 경험 있음.
- 현재 `apps/app/metro.config.js`는 `withNativeWind`로 래핑만 하고 watchFolders 등은 건드리지 않는다 — 이 상태를 유지할 것.
- 문제 생기면 `pnpm exec expo start --clear`로 캐시 먼저 제거.
- 출처: 메모리 `feedback_pnpm_expo.md`, `apps/app/metro.config.js`

### SDK 54 autolinkingModuleResolution
- `apps/app/app.json`의 `experiments.autolinkingModuleResolution: true`는 모노레포에서 같은 native 모듈이 중복 설치되는 것을 막기 위한 SDK 54 신규 플래그. 끄지 말 것.
- 출처: `apps/app/app.json`, brain `sprints/02/dev/migration-plan.md`

### Expo 패키지 설치는 `npx expo install` 사용
- Expo 생태계(native 모듈 포함: `expo-router`, `react-native-reanimated`, `@react-native-community/datetimepicker` 등)는 `pnpm add`가 아니라 `npx expo install`로 설치. SDK 54 호환 버전을 자동 고정해준다.
- 순수 JS 패키지(`@tanstack/react-query`, `zustand`, `react-hook-form`, `nativewind` 등)만 `pnpm add` 사용.
- 출처: brain `sprints/02/dev/migration-plan.md`

### Reanimated v4 / babel-preset-expo
- SDK 54는 New Architecture가 기본 ON이고 `react-native-reanimated` v4 대응 완료. `babel.config.js`에 reanimated plugin을 **수동으로 추가하지 말 것** — `babel-preset-expo`에 이미 포함되어 있어 중복되면 오히려 깨진다.
- 출처: brain `sprints/02/dev/migration-plan.md`

---

## 의존성 버전 핀

### MikroORM은 v6 고정 (^6)
- `@mikro-orm/core`, `@mikro-orm/mysql`, `@mikro-orm/nestjs`, `@mikro-orm/migrations`, `@mikro-orm/cli` 전부 `^6`. v7은 데코레이터 export 구조가 breaking change라서 `Entity`, `PrimaryKey` 등이 `has no exported member` 에러로 터진다. NestJS 11 + v6.6.x에서 정상 동작 확인.
- 올릴 때는 v7 stable + 공식 migration guide 확인 후.
- 출처: 메모리 `feedback_mikroorm_v7_breaking.md`, `apps/api/package.json`

### 바텀시트: `@gorhom/bottom-sheet` 대신 RN 내장 `Modal`
- 원래 `@gorhom/bottom-sheet`로 시작했다가 **Expo Go에서 `react-native-gesture-handler` TurboModule 충돌**로 크래시. RN 내장 `Modal` + `Animated`로 교체함. `package.json`에는 `@gorhom/bottom-sheet`가 남아 있지만 화면에서는 쓰지 않는 상태. 새로 바텀시트 작성 시 Modal 패턴 따라갈 것.
- 출처: git log `a6bc039 바텀시트를 RN Modal로 전환 (Expo Go 호환)`, brain `sprints/02/plan.md`

---

## 환경 변수

### 루트 `.env` — API + docker-compose 공용
| 키 | 의미 |
|---|---|
| `DB_HOST` | API 컨테이너 내부에선 `host.docker.internal`로 덮어씀 (docker-compose.yml) |
| `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | homelab-infra MySQL 접속 정보. 기본 스키마 `home_coffing` |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web Push. `web-push generate-vapid-keys`로 생성해서 **맥미니 배포 환경에 투입** (재발급 시 구독자 전원 재구독 필요) |

- MikroORM config(`apps/api/src/mikro-orm.config.ts`)는 `../../../.env`(레포 루트) 한 파일을 본다. `apps/api/.env`를 따로 두면 로드되지 않음.
- 출처: `.env.example`, `docker-compose.yml`, `apps/api/src/mikro-orm.config.ts`

### `apps/app/.env` — Expo 앱
- `EXPO_PUBLIC_API_URL` — Cloudflare Tunnel로 노출된 API 엔드포인트. `EXPO_PUBLIC_` 접두어가 있어야 런타임 번들에 주입됨.
- 로컬 dev 시에도 맥북 로컬 IP 대신 Cloudflare Tunnel URL을 그대로 쓰는 게 편함(LTE/WiFi 무관).
- EAS Build는 `.env`를 번들에 안 쓰고 **`eas.json`의 `env` 블록**을 사용 — 두 곳을 동기화해야 한다.
- 출처: `apps/app/.env.example`, `apps/app/eas.json`

---

## 인프라 / 배포

### 구성

```
[Cloudflare Tunnel] → :3010 (Next.js web) → /api/[...] proxy → :3011 (NestJS api) → MySQL :3306
```

- 맥미니에서 docker-compose로 `home-coffing-api`(:3011→3001), `home-coffing-web`(:3010→3000) 2개 컨테이너 운영.
- MySQL은 컨테이너가 아니라 **homelab-infra의 맥미니 호스트 MySQL**(`~/repos/byun618/homelab-infra/docker/compose.yaml`)을 공유. 그래서 api 컨테이너는 `extra_hosts`로 `host.docker.internal:host-gateway`를 받고, `DB_HOST=host.docker.internal`로 접근한다.
- 스키마 이름은 `home_coffing` (단수). homelab MySQL에서 수동 생성 필요.
- 출처: `docker-compose.yml`, 메모리 `user_dev_environment.md`, brain plan

### 배포 명령
- `pnpm docker:deploy` = `git pull && docker-compose up -d --build`. 맥미니에서 이 한 줄로 배포.
- 컨테이너 진입 시 `apps/api`는 시작 전에 **`pnpm schema:update`를 자동 실행** (Dockerfile `CMD`). 엔티티 구조가 바뀌면 배포만 해도 스키마가 따라온다. 반대로 파괴적 변경(컬럼 drop 등)은 데이터 손실 가능하니 주의.
- 출처: `Dockerfile`, `package.json`

### Turbo prune 기반 multi-stage Dockerfile
- `Dockerfile`의 `ARG APP`으로 api/web 둘 다 한 파일로 빌드. `turbo prune @home-coffing/${APP} --docker`로 대상 앱 의존성만 뽑아내서 설치 레이어 캐시 극대화. 수정 시 prune 단계가 깨지지 않도록 주의.
- 출처: `Dockerfile`

---

## EAS Build (안드로이드 APK 사이드로드)

### 프로파일
- `eas.json`에 `preview` / `production` 둘 다 `distribution: internal` + `android.buildType: apk`. 스토어 업로드 없이 EAS가 발급하는 URL에서 직접 APK 다운로드.
- 두 프로파일의 `EXPO_PUBLIC_API_URL`이 현재 `https://coffee-api.chaco.cloud/api`로 하드코딩되어 있음 — 엔드포인트 변경 시 여기도 같이 바꿀 것.
- 출처: `apps/app/eas.json`

### 첫 빌드 체크리스트
1. `eas login` / `eas init` (프로젝트 id는 이미 `app.json`에 주입: `e86d28f1-...`)
2. 맥미니 docker-compose 살아있는지, Cloudflare Tunnel 연결 살아있는지 확인 (`curl https://coffee-api.chaco.cloud/api/beans`)
3. `cd apps/app && eas build --profile preview --platform android`
4. 완료 URL을 폰 브라우저에서 열어 APK 설치 (갤럭시: "출처 불명 앱 허용" 한 번 설정)
- 출처: brain `sprints/02/dev/deployment.md`

### 업데이트 시 반드시 `versionCode` 증가
- APK 재빌드 시 `app.json`의 `android.versionCode`를 +1 해야 한다. 같은 값으로 재빌드하면 새 APK를 깔아도 구버전과 충돌. 롤백 시에도 `versionCode`를 더 낮추면 안 되고, **이전 코드 + 더 높은 versionCode**로 새 APK를 만들어야 한다.
- 출처: brain `sprints/02/dev/deployment.md`

### `android.package` 변경 금지
- 현재 `com.byun618.homecoffing`. 변경하면 완전히 새 앱으로 취급되어 기존 설치본이 업데이트되지 않음.
- 출처: `apps/app/app.json`, brain `sprints/02/dev/deployment.md`

### OTA 미적용 (Phase 2 이월)
- `expo-updates` 세팅 없음 → JS만 바뀐 경우에도 현재는 풀 APK 재빌드가 유일한 경로.
- 출처: brain `sprints/02/plan.md`, `sprints/02/dev/deployment.md`

---

## 개발 환경 (변상현 개인)

- 맥북(M) ↔ 안드로이드폰(Expo Go) 동일 WiFi에서 실기기 테스트. Android Studio는 쓰지 않음.
- 맥미니는 홈 서버 (docker-compose 기반). 홈 커핑 DB/컨테이너가 여기에 산다.
- DB GUI는 DataGrip.
- 출처: 메모리 `user_dev_environment.md`

---

## 모노레포 운영 팁

### 워크트리 정리 시 브랜치 건드리지 않기
- `git worktree remove`만 실행. 로컬/원격 브랜치는 `-d`/`--delete` **하지 않는다** (PR 머지 후에도 참고용으로 남겨두는 선호).
- 출처: 메모리 `feedback_worktree_cleanup.md`

### 스키마 조작 스크립트 (루트에서 실행)

```
pnpm schema:create   # 전체 생성
pnpm schema:update   # 엔티티 diff 적용 (Dockerfile runner가 자동 실행하는 것과 동일)
pnpm schema:drop     # 전체 drop
pnpm db:reset        # drop + create (로컬 리셋용)
```

- 출처: `package.json`
