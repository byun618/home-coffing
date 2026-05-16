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
[GitHub Actions workflow_dispatch]
  ├─ build (self-hosted on 맥미니)
  │  └─ docker build → GHCR push (ghcr.io/byun618/home-coffing-api)
  └─ deploy (self-hosted on 맥미니)
     ├─ git pull
     ├─ docker-compose pull api
     └─ docker-compose up -d api
```

- **schema:update는 컨테이너 부팅에서 분리됨** — 사람이 필요한 ticket에서만 수동 실행
- 이미지 태그: `latest` + `<branch>-<sha7>` (롤백용)

---

## 0. 사전 점검 (배포 전 1~2분)

각 ticket의 `~/brain/projects/home-coffing/tickets/NNN/dev-plan.md §스키마 변경` 확인:
- 데이터 변환 작업이 있는 ticket인지 키워드 검색: `migrate-`, `backfill`, `dedup`, `rename`, `rewire`, `manual SQL` → **있으면 이 런북 적용 불가**
- 위 키워드 없고 entity diff뿐이면 그대로 진행

```bash
ssh homelab 'cd ~/repos/byun618/home-coffing && git log --oneline -3'
```

---

## 1. 백업 (필수 — 안전망)

```bash
ssh homelab 'export PATH=/opt/homebrew/bin:$PATH; cd ~/repos/byun618/home-coffing && set -a; source .env; set +a; \
  docker exec -i docker-mysql-1 mysqldump --no-tablespaces --single-transaction --routines --triggers \
    -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > ~/backup-pre-TXXX-$(date +%Y%m%d-%H%M).sql'
```

데이터 이관이 없어도 schema:update 시 column drop은 비가역. 항상 백업.

---

## 2. (seed 스크립트가 있다면) 호스트에서 실행

```bash
# pnpm install (ts-node 실행용)
ssh homelab 'bash -lc "source ~/.nvm/nvm.sh && cd ~/repos/byun618/home-coffing && git pull && pnpm install --frozen-lockfile"'

# seed 스크립트 (idempotent upsert)
ssh homelab 'bash -lc "source ~/.nvm/nvm.sh && cd ~/repos/byun618/home-coffing/apps/api && pnpm exec ts-node src/scripts/seed-XXX.ts"'
```

함정:
- SSH 비대화 PATH: `bash -lc "source ~/.nvm/nvm.sh && ..."` 패턴 필수
- `pnpm --filter ... ts-node` ❌ — `pnpm exec ts-node`로 직접 호출

---

## 3. 자동 배포 트리거 (메인 흐름)

**GitHub.com → `byun618/home-coffing` → Actions → "🚀 Deploy API" → Run workflow**
- 브랜치 `main` 선택 → Run
- 진행 상황을 Actions UI에서 확인 (build → deploy → summary)

배포 완료 후 자동 점검:
- summary job이 step summary에 결과 출력
- 맥미니에서 추가 health check:
```bash
ssh homelab 'export PATH=/opt/homebrew/bin:$PATH; docker logs home-coffing-api --tail 50'
```
- `Nest application successfully started` 확인

---

## 4. schema 변경 수동 적용 (스키마 변경 ticket인 경우만)

> 자동 schema:update는 T008에서 제거됨. 스키마 변경이 있는 ticket은 배포 후 수동 실행.

```bash
ssh homelab 'export PATH=/opt/homebrew/bin:$PATH; docker exec -it home-coffing-api pnpm schema:update'
```

⚠ **NOT NULL 컬럼 신규 추가** 시 entity에 `default` 명시 안 되어 있으면 existing rows에서 violation 발생. 사전에 entity 코드 확인.

---

## 5. ⚠ Cloudflare Tunnel 점검 (인프라 구조 변경 시 필수)

**평소(docker-compose 서비스 변동 없음): skip 가능.**
**docker-compose에서 서비스 추가·삭제했으면 반드시 점검.**

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

## 6. orphan 컨테이너 정리

docker-compose에서 서비스 제거했을 때만:
```bash
docker rm -f <orphan-container-name>
```

---

## 7. 클라이언트 (앱) 배포 — 맥북 로컬

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

`eas.json` production env (`EXPO_PUBLIC_API_URL=https://coffee-api.chaco.cloud/api`) 변경 안 했으면 그대로 OK.

---

## 8. 롤백

GHCR에 모든 빌드가 `<branch>-<sha7>` 태그로 보관됨.

```bash
ssh homelab
cd ~/repos/byun618/home-coffing
API_IMAGE_TAG=main-abc1234 docker-compose up -d api
```

이전 태그 목록 확인: GitHub.com → `byun618/home-coffing` → 우측 Packages → `home-coffing-api` → Versions

---

## 9. 수동 fallback (GHA / runner 다운 시)

self-hosted runner나 GHA가 동작 안 할 때만 사용:

```bash
ssh homelab 'bash -lc "source ~/.nvm/nvm.sh && export PATH=/opt/homebrew/bin:\$PATH && cd ~/repos/byun618/home-coffing && pnpm docker:deploy:local"'
```

- `docker:deploy:local` = `git pull && docker-compose build && docker-compose up -d`
- GHCR pull 없이 맥미니에서 직접 빌드. **이미지가 GHCR에 push 안 됨** — 임시 복구용
- 그 다음 GHA가 살아나면 다시 정상 흐름으로 복귀

---

## 10. 흔히 빠지는 함정

| 함정 | 증상 | 해결 |
|---|---|---|
| SSH 비대화 PATH | `command not found: pnpm/docker/node` | `bash -lc "source ~/.nvm/nvm.sh"` + `export PATH=/opt/homebrew/bin:$PATH` |
| `pnpm install` 누락 | seed 스크립트 module not found | seed 실행 전 호스트에서 install |
| `~/.cloudflared/config.yml` 수정해도 반영 X | tunnel 변경 안 먹음 | daemon은 `/etc/cloudflared/config.yml` 읽음 |
| docker-compose 서비스 삭제 후 tunnel 죽음 | 502 | cloudflared config의 해당 hostname 라우팅도 같이 수정 |
| NOT NULL 컬럼 추가 with no default | schema:update fail on existing rows | entity에 `= default값` 명시 |
| orphan 컨테이너 방치 | 리소스만 점유, 라우팅 안 됨 | `docker rm -f` |
| schema:update 깜빡 | API는 떠 있지만 새 컬럼/테이블 없어서 500 | 스키마 변경 ticket이면 §4 수동 실행 |
| GHCR pull 실패 | manifest unknown / unauthorized | 맥미니에 `docker login ghcr.io` 1회 (PAT, read:packages) |

---

## 변경 이력

| 날짜 | 변경 내용 | 사유 |
|------|----------|------|
| 2026-05-16 | 초기 작성 | T002→T005 통합 배포 사례 기반. 데이터 이관 없는 케이스 한정. |
| 2026-05-16 | T008 자동 배포 흐름 반영 | GHA self-hosted + GHCR 도입. 메인 흐름은 workflow_dispatch. 수동 fallback은 §9로 분리. schema:update 자동 실행 제거 → §4로 분리. 롤백 절차 §8 신규. |
