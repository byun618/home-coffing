# Operations Summary — 절대 가드레일

> `docs/operations.md`의 압축본. 본 항목 위반 시 home-coffing-dev는 즉시 차단한다.
> 전문은 `docs/operations.md` 참조.

## 절대 건드리지 말 것

| 항목 | 위치 | 사유 |
|---|---|---|
| `apps/app/metro.config.js`의 watchFolders·nodeModulesPaths | Expo | SDK 52+ pnpm 자동 지원, 수동 설정은 resolve 에러 유발 |
| `apps/app/app.json`의 `experiments.autolinkingModuleResolution: true` | Expo | SDK 54 모노레포 native 중복 방지, 끄지 말 것 |
| `apps/app/babel.config.js`에 reanimated plugin 수동 추가 | Expo | `babel-preset-expo`에 이미 포함, 중복 시 깨짐 |
| `apps/app/app.json`의 `android.package` 변경 | EAS | 새 앱으로 취급, 기존 설치본 업데이트 X |
| `apps/app/app.json`의 `android.versionCode` 감소·동일 재사용 | EAS | 새 APK 충돌, 롤백도 더 높은 값으로 |
| MikroORM v7 import (`^7` 업그레이드) | API | 데코레이터 export breaking |
| `@gorhom/bottom-sheet` 신규 사용 | App | Expo Go gesture-handler 충돌 |
| `pnpm-workspace.yaml`의 `nodeLinker: hoisted` 변경 | Mono | `@nestjs/core` peer deps 평면 의존 |
| `package.json`의 `packageManager: pnpm@10.8.1` 변경 | Mono | lockfile 재생성 위험 |
| `apps/api/.env` 별도 생성 (루트 `.env` 우회) | API | MikroORM config는 `../../../.env`만 참조 |

## 패키지 설치 규칙

- Expo native 모듈: `npx expo install` (SDK 호환 자동 고정)
- 순수 JS (`@tanstack/react-query`, `zustand`, `nativewind` 등): `pnpm add`
- 혼합 호출 금지 — `pnpm add` 로 expo native 깔면 SDK 호환 X

## 배포 / 외부 명령 (사용자 권한 요청 후 실행)

- `pnpm install` (lockfile 갱신)
- `pnpm schema:update` (DB 스키마 변경 — 데이터 손실 가능. T008부터 컨테이너 부팅 시 자동 실행 안 됨, 필요 시 수동: `docker exec -it home-coffing-api pnpm schema:update`)
- `pnpm db:reset`
- `npx expo install`
- **GitHub Actions "🚀 Deploy API" workflow_dispatch** (T008부터, 메인 배포 흐름)
- `eas build`

## 인프라 토폴로지

```
[Cloudflare Tunnel] → :3011 (home-coffing-api) → MySQL :3306
```

- 운영 compose owner: `homelab-infra/services/home-coffing/docker-compose.yml` (T008부터)
- 시크릿 owner: mac mini의 `homelab-infra/services/home-coffing/.env` (gitignored)
- 이미지: mac mini local-only (`home-coffing-api:<branch>-<sha7>`, 외부 레지스트리 X)
- GHA self-hosted runner: `homelab-infra/services/_runner/` (Docker 컨테이너)
- MySQL은 homelab-infra 호스트 MySQL 공유 (`DB_HOST=host.docker.internal`)
- 스키마: `home_coffing` (단수)

## VAPID 키

- Web Push 사용. `web-push generate-vapid-keys` 후 맥미니 `.env`에 투입
- **재발급 시 구독자 전원 재구독** 필요 — 함부로 재발급 금지

## EAS Build 체크리스트

1. `eas login` / `eas init`
2. API 살아있는지 확인 (`curl https://coffee-api.chaco.cloud/api/...` 200/400 응답)
3. `cd apps/app && eas build --profile preview --platform android`
4. APK URL을 폰 브라우저에서 다운로드

## 워크트리 정리

- `git worktree remove`만. 로컬/원격 브랜치 `-d`/`--delete` **하지 않기** (PR 머지 후에도 참고용)

## 폐기된 spec 참조 — 발견 시 정정

- `spec/data-model.md` — **폐기**. 데이터 모델 SoT는 코드 ORM(`apps/api/src/common/entities/`). 결정 사유는 ticket 안.
- `spec/component-library.md` — **폐기**. 컴포넌트 카탈로그는 `spec/design-system.md`로 통합.
- `mockup.pen`, `wireframe.pen` — **폐기**. visual master는 `spec/design.pen` 단일.
