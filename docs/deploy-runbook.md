# Deploy Runbook — 단순 케이스 (데이터 이관 없음)

> ticket 배포 시 사용. **전제:**
> - 새 ticket의 변경이 컬럼/테이블의 단순 **추가·삭제** (entity diff만 — schema:update가 자동 처리)
> - 기존 row의 의미 변환·재배선·dedup 등은 **없음**
> - seed 스크립트는 있어도 됨 (idempotent universe 추가)
>
> 데이터 이관(rename, dedup, backfill, rewire 등)이 들어가는 ticket은 dev-plan.md에 명시되며, 이 런북으로 처리하지 말 것 — ticket별 마이그레이션 SQL 별도 작성.
>
> 시스템 자체에 대한 비명시적 운영 지식은 [`operations.md`](./operations.md) 참고.

---

## 0. 사전 점검 (배포 전 1~2분)

```bash
ssh homelab 'cd ~/repos/byun618/home-coffing && git log --oneline -3'
```

각 ticket의 `~/brain/projects/home-coffing/tickets/NNN/dev-plan.md §스키마 변경` 확인:
- 데이터 변환 작업이 있는 ticket인지 키워드 검색: `migrate-`, `backfill`, `dedup`, `rename`, `rewire`, `manual SQL` → **있으면 이 런북 적용 불가**
- 위 키워드 없고 entity diff뿐이면 그대로 진행

---

## 1. 백업 (필수 — 안전망)

```bash
ssh homelab 'export PATH=/opt/homebrew/bin:$PATH; cd ~/repos/byun618/home-coffing && set -a; source .env; set +a; \
  docker exec -i docker-mysql-1 mysqldump --no-tablespaces --single-transaction --routines --triggers \
    -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > ~/backup-pre-TXXX-$(date +%Y%m%d-%H%M).sql'
```

데이터 이관이 없어도 schema:update 자동 column drop은 비가역. 항상 백업.

---

## 2. 코드 동기화 + (seed 있으면) 실행

```bash
# pnpm install — host에서 ts-node 돌릴 수 있게
ssh homelab 'bash -lc "source ~/.nvm/nvm.sh && cd ~/repos/byun618/home-coffing && git pull && pnpm install --frozen-lockfile"'

# seed 스크립트가 있으면 (idempotent upsert이므로 안전)
ssh homelab 'bash -lc "source ~/.nvm/nvm.sh && cd ~/repos/byun618/home-coffing/apps/api && pnpm exec ts-node src/scripts/seed-XXX.ts"'
```

- SSH 비대화 PATH 함정: `bash -lc "source ~/.nvm/nvm.sh && ..."` 패턴 필수
- `pnpm --filter ... ts-node` ❌ — `pnpm exec ts-node`로 직접 호출
- seed는 컨테이너 재기동 전에 호스트에서 실행 (entity가 최종 형태라 schema:update 후에 돌려도 무관하지만, 어차피 동일 결과)

---

## 3. 컨테이너 빌드 + 재기동

```bash
ssh homelab 'bash -lc "source ~/.nvm/nvm.sh && export PATH=/opt/homebrew/bin:\$PATH && cd ~/repos/byun618/home-coffing && pnpm docker:deploy"'
```

- `pnpm docker:deploy` = `git pull && docker-compose up -d --build`
- 부팅 시 `pnpm schema:update` 자동 실행 — entity ↔ DB diff (컬럼 add/drop, 인덱스 등) 자동 반영
- ⚠ **NOT NULL 컬럼 신규 추가** 시 entity에 `default` 명시되어 있는지 확인 — 없으면 existing rows에서 violation

배포 후 health check:
```bash
ssh homelab 'export PATH=/opt/homebrew/bin:$PATH; sleep 8 && docker logs home-coffing-api --tail 60'
```
- `MikroORM successfully connected to database` 확인 (schema:update 통과)
- `Nest application successfully started` 확인
- 새 모듈 라우트 매핑 로그 확인

---

## 4. ⚠ Cloudflare Tunnel 점검 (인프라 구조 변경 시 필수)

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

## 5. orphan 컨테이너 정리

docker-compose에서 서비스 제거했을 때만:
```bash
docker rm -f <orphan-container-name>
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

`eas.json` production env (`EXPO_PUBLIC_API_URL=https://coffee-api.chaco.cloud/api`) 변경 안 했으면 그대로 OK.

---

## 7. 흔히 빠지는 함정

| 함정 | 증상 | 해결 |
|---|---|---|
| SSH 비대화 PATH | `command not found: pnpm/docker/node` | `bash -lc "source ~/.nvm/nvm.sh"` + `export PATH=/opt/homebrew/bin:$PATH` |
| `pnpm install` 누락 | seed 스크립트 module not found | docker:deploy 전에 호스트에서 install |
| `~/.cloudflared/config.yml` 수정해도 반영 X | tunnel 변경 안 먹음 | daemon은 `/etc/cloudflared/config.yml` 읽음 |
| docker-compose 서비스 삭제 후 tunnel 죽음 | 502 | cloudflared config의 해당 hostname 라우팅도 같이 수정 |
| NOT NULL 컬럼 추가 with no default | schema:update fail on existing rows | entity에 `= default값` 명시 |
| orphan 컨테이너 방치 | 리소스만 점유, 라우팅 안 됨 | `docker rm -f` |

---

## 변경 이력

| 날짜 | 변경 내용 | 사유 |
|------|----------|------|
| 2026-05-16 | 초기 작성 | T002→T005 통합 배포 사례 기반 (sprint 후 cumulative ticket 배포). 데이터 이관 없는 케이스 한정. |
