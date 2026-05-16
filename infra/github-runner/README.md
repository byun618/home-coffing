# GitHub Actions Self-hosted Runner (Docker)

`myoung34/github-runner` 컨테이너 기반. 맥미니에서 docker-compose로 띄워서 `byun618/home-coffing` repo의 워크플로를 처리한다.

## 셋업 (최초 1회)

### 1. PAT 발급
GitHub Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token:
- Note: `home-coffing GHA runner registration`
- Expiration: 1년 또는 No expiration
- Scopes: **`repo`** (full)

(Fine-grained PAT 선호 시: byun618/home-coffing repo만 선택 + Repository permissions의 **Administration: Read and write** + **Metadata: Read-only**)

### 2. .env 작성
```bash
cd /Users/homelab/repos/byun618/home-coffing/infra/github-runner
cp .env.example .env
# .env 열어서 GH_RUNNER_PAT 값 채우기
```

### 3. 기동
```bash
docker-compose up -d
docker-compose logs -f
```

`√ Connected to GitHub` + `Listening for Jobs` 메시지 확인.

GitHub.com → byun618/home-coffing → Settings → Actions → Runners 에서 `home-coffing-mac-mini` runner가 **Idle** 상태로 보이면 완료.

## 운영

### 로그 보기
```bash
docker-compose logs -f
docker-compose logs --tail 100
```

### 재시작 (설정 변경 후)
```bash
docker-compose up -d --force-recreate
```

### 컨테이너 진입 (디버깅)
```bash
docker exec -it home-coffing-runner bash
```

### 업데이트 (myoung34 이미지 새 버전)
```bash
docker-compose pull
docker-compose up -d
```

## 구조 메모

- `/var/run/docker.sock` 마운트 — runner가 host docker daemon 직접 조작 (build/push/compose 모두 host에서 실행됨)
- `/Users/homelab/repos/byun618/home-coffing` 동일 경로 bind mount — 워크플로의 `cd ~/repos/...` 같은 명령이 host와 컨테이너에서 동일 결과
- `EPHEMERAL: false` — job 끝나도 runner 살아 있음. 단순 운영. true로 바꾸면 job마다 재기동 (격리↑, 복잡도↑)
- `DISABLE_AUTO_UPDATE: true` — runner agent 자동 업데이트 끄기. 이미지 pull로 명시적 업데이트
- runner-work는 named volume — job간 캐시 등 누적

## 함정

- **PAT 만료 시 자동 재등록 실패** → GitHub Runners 페이지에서 offline. PAT 갱신 + `docker-compose restart`
- **host docker daemon이 죽으면 runner도 정지** — Docker Desktop 켜져 있어야 함
- **컨테이너 내부에서 ssh/sudo 안 됨** — workflow의 deploy step에서 sudo·ssh 명령 쓰면 실패. mount된 디렉토리 직접 조작 + docker socket으로 host daemon 호출만
