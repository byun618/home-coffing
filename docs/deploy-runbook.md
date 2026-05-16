# Deploy Runbook — 단순 케이스 (데이터 이관 없음)

> ticket 배포 시 사용. **전제:**
> - 새 ticket의 변경이 컬럼/테이블의 단순 **추가·삭제** (entity diff만 — `pnpm schema:update`로 처리 가능)
> - 기존 row의 의미 변환·재배선·dedup 등은 **없음**
> - seed 스크립트는 있어도 됨 (idempotent universe 추가)
>
> 데이터 이관(rename, dedup, backfill, rewire 등)이 들어가는 ticket은 dev-plan.md에 명시되며, 이 런북으로 처리하지 말 것 — ticket별 마이그레이션 SQL 별도 작성.
>
> 시스템 자체에 대한 비명시적 운영 지식은 [`operations.md`](./operations.md) 참고.

---

## 배포 아키텍처 (T008부터)

```
[GitHub Actions workflow_dispatch on home-coffing repo]
  ├─ build (self-hosted runner, mac mini)
  │  └─ docker build → mac mini local docker daemon (외부 registry X)
  └─ deploy (self-hosted runner, mac mini)
     ├─ cd /Users/homelab/repos/byun618/homelab-infra/services/home-coffing
     └─ API_IMAGE_TAG=<sha> docker compose up -d api
```

- **이미지는 mac mini local-only** (GHCR 등 외부 레지스트리 안 씀)
- **운영 compose는 `homelab-infra/services/home-coffing/`** 가 owner. home-coffing repo는 빌드용
- **시크릿(`.env`)은 mac mini** (`homelab-infra/services/home-coffing/.env`)
- **schema:update는 자동 실행 안 됨** — 필요 시 수동

---

## 0. 사전 점검 (배포 전 1~2분)

각 ticket의 `~/brain/projects/home-coffing/tickets/NNN/dev-plan.md §스키마 변경` 확인:
- 데이터 변환 작업이 있는 ticket인지 키워드 검색: `migrate-`, `backfill`, `dedup`, `rename`, `rewire`, `manual SQL` → **있으면 이 런북 적용 불가**
- 위 키워드 없고 entity diff뿐이면 그대로 진행

---

## 1. 백업 (필수 — 안전망)

```bash
ssh homelab 'export PATH=/opt/homebrew/bin:$PATH; cd ~/repos/byun618/homelab-infra/services/home-coffing && set -a; source .env; set +a; \
  docker exec -i docker-mysql-1 mysqldump --no-tablespaces --single-transaction --routines --triggers \
    -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > ~/backup-pre-TXXX-$(date +%Y%m%d-%H%M).sql'
```

---

## 2. (seed 스크립트가 있다면) ad-hoc 실행

seed 스크립트는 home-coffing repo의 `apps/api/src/scripts/`에 있음. mac mini에 코드 레포가 없으므로 임시 클론 or 로컬 mac에서 ts-node 실행 후 결과를 SQL로 dump해서 적용 — ticket마다 판단.

> 이 흐름은 향후 별도 ticket으로 자동화 가능 (e.g., workflow_dispatch로 seed 스크립트 실행 job).

---

## 3. 자동 배포 트리거 (메인 흐름)

**GitHub.com → `byun618/home-coffing` → Actions → "🚀 Deploy API" → Run workflow**
- 브랜치 `main` 선택 → Run

배포 완료 후 점검:
```bash
ssh homelab 'export PATH=/opt/homebrew/bin:$PATH; docker logs home-coffing-api --tail 50'
```
- `Nest application successfully started` 확인

---

## 4. schema 변경 수동 적용 (스키마 변경 ticket인 경우만)

> 자동 schema:update는 T008에서 제거됨.

```bash
ssh homelab 'export PATH=/opt/homebrew/bin:$PATH; docker exec -it home-coffing-api pnpm schema:update'
```

⚠ **NOT NULL 컬럼 신규 추가** 시 entity에 `default` 명시 안 되어 있으면 existing rows에서 violation. 사전에 entity 코드 확인.

---

## 5. ⚠ Cloudflare Tunnel 점검 (인프라 구조 변경 시 필수)

평소(라우팅 변동 없음): skip 가능.

```bash
# 실제 사용 중인 config (daemon은 /etc/ 쪽 읽음, ~/ 가 아님)
sudo cat /etc/cloudflared/config.yml

# 필요 시 수정 후
sudo launchctl kickstart -k system/com.cloudflare.cloudflared
```

**외부 도달 확인 (맥북에서):**
```bash
curl -sS -o /dev/null -w "%{http_code}\n" -X POST https://coffee-api.chaco.cloud/api/auth/login \
  -H "Content-Type: application/json" -d "{}"
# 400 OK / 502 tunnel 끊김
```

---

## 6. 클라이언트 (앱) 배포 — 맥북 로컬

API entity·DTO 변경으로 shared-types/queries가 갱신됐다면 새 APK 빌드 필요:

```bash
cd /Users/byun/repos/byun618/home-coffing/apps/app
eas build --profile production --platform android
```

빌드 완료 후:
```bash
eas build:list --platform android --limit 5
# Artifact URL → 폰에서 다운로드
```

---

## 7. 롤백

`docker images home-coffing-api`로 mac mini 로컬 이미지 목록 확인 → 원하는 태그로:

```bash
ssh homelab
cd ~/repos/byun618/homelab-infra/services/home-coffing
API_IMAGE_TAG=main-abc1234 docker compose up -d api
```

> 워크플로의 디스크 정리 step이 untagged + 30일 경과 이미지만 prune하므로 태그된 이미지는 보존됨. 단 mac mini disk 한도 고려해 가끔 수동 정리 권장.

---

## 8. 수동 fallback (GHA / runner 다운 시)

self-hosted runner나 GHA가 동작 안 할 때만 사용. mac mini에서 직접 빌드:

```bash
ssh homelab
# 임시로 home-coffing 코드 받기
git clone https://github.com/byun618/home-coffing.git /tmp/home-coffing
cd /tmp/home-coffing
# 빌드
export PATH=/opt/homebrew/bin:$PATH
SHA=$(git rev-parse --short HEAD)
docker build --build-arg APP=api -t home-coffing-api:main-$SHA -t home-coffing-api:latest .
# 배포
cd ~/repos/byun618/homelab-infra/services/home-coffing
API_IMAGE_TAG=main-$SHA docker compose up -d api
# 정리
rm -rf /tmp/home-coffing
```

---

## 9. 흔히 빠지는 함정

| 함정 | 증상 | 해결 |
|---|---|---|
| SSH 비대화 PATH | `command not found: docker/pnpm/node` | `export PATH=/opt/homebrew/bin:$PATH` + `bash -lc "source ~/.nvm/nvm.sh"` |
| `~/.cloudflared/config.yml` 수정해도 반영 X | tunnel 변경 안 먹음 | daemon은 `/etc/cloudflared/config.yml` 읽음 |
| Cloudflared 라우팅 hostname → 서비스 변경 시 | 502 | `/etc/cloudflared/config.yml` 수정 + `launchctl kickstart -k` |
| NOT NULL 컬럼 추가 with no default | schema:update fail on existing rows | entity에 `= default값` 명시 |
| schema:update 깜빡 | API는 떠 있지만 새 컬럼/테이블 없어서 500 | 스키마 변경 ticket이면 §4 수동 실행 |
| 디스크 누적 | mac mini 용량 부족 | `docker image prune -af --filter "until=720h"` 또는 오래된 태그 명시 삭제 |
| runner 컨테이너 다운 | 워크플로 큐에 쌓이고 안 실행 | `cd ~/repos/byun618/homelab-infra/services/_runner && docker compose up -d` |

---

## 변경 이력

| 날짜 | 변경 내용 | 사유 |
|------|----------|------|
| 2026-05-16 | 초기 작성 | T002→T005 통합 배포 사례 기반. 데이터 이관 없는 케이스 한정. |
| 2026-05-16 | T008 자동 배포 흐름 반영 (1차) | GHA self-hosted + GHCR 안. 자동 schema:update 제거. |
| 2026-05-16 | T008 local-only + homelab-infra 분리로 갱신 | GHCR 폐기 → mac mini local 이미지 관리. 운영 compose는 homelab-infra/services/ 가 owner. home-coffing repo는 build 전용. |
