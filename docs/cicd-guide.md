# CI/CD 설정 가이드

## 전체 파이프라인 흐름

```
PR (feature/* → main)
  └── CI 실행: lint → type-check → test → build
        └── 통과 시 PR 머지 가능

main 브랜치 push (PR 머지)
  └── CI 실행: lint → type-check → test → build
        └── 통과 시 → deploy job 실행: EC2 자동 배포
```

> PR 시에는 배포가 실행되지 않는다. main 브랜치에 push(=PR 머지)될 때만 CD가 동작한다.

---

## CI 단계

`.github/workflows/ci.yml`의 `lint`, `type-check`, `test`, `build` job이 순서대로 실행된다.

### 1. Lint
```bash
pnpm lint
```
ESLint + Prettier 규칙 검사. 오류 시 파이프라인 중단.

### 2. Type Check
```bash
pnpm tsc --noEmit
```
TypeScript 타입 오류 검사. `noImplicitAny: true` 포함.

### 3. Test
```bash
pnpm test
```
Jest 단위 테스트 전체 실행.

### 4. Build
```bash
pnpm build
```
`dist/` 폴더로 TypeScript 컴파일. 빌드 성공 여부 확인.

---

## CD 단계 (EC2 자동 배포)

`build` job 성공 후, main 브랜치 push 이벤트에서만 `deploy` job이 실행된다.

### deploy job 실행 순서

| 단계 | 명령 | 설명 |
|------|------|------|
| 1 | SSH 키 설정 | GitHub Secret의 PEM 키로 EC2 접속 준비 |
| 2 | `git pull origin main` | EC2 서버에서 최신 코드 fetch |
| 3 | `pnpm install --frozen-lockfile --prod` | 프로덕션 의존성만 설치 |
| 4 | `pnpm prisma generate` | Prisma 클라이언트 재생성 |
| 5 | `pnpm prisma migrate deploy` | 운영 DB 마이그레이션 자동 적용 |
| 6 | `pnpm build` | TypeScript → dist/ 컴파일 |
| 7 | `pm2 reload <app-name>` | PM2 무중단 재시작 |
| 8 | `pm2 save` | PM2 프로세스 목록 저장 |

---

## GitHub Secrets 등록 방법

GitHub Repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### CI용 Secrets

| Secret 키 | 설명 |
|-----------|------|
| `DATABASE_URL` | 테스트용 DB URL (단위 테스트에서 Mock 사용 시 불필요) |
| `JWT_SECRET` | JWT 시크릿 (테스트용) |
| `JWT_EXPIRES_IN` | JWT 만료 시간 |
| `AWS_ACCESS_KEY_ID` | AWS 액세스 키 |
| `AWS_SECRET_ACCESS_KEY` | AWS 시크릿 키 |
| `AWS_REGION` | AWS 리전 |
| `AWS_S3_BUCKET` | S3 버킷 이름 |

### CD용 Secrets (EC2 배포)

| Secret 키 | 예시 값 | 설명 |
|-----------|---------|------|
| `EC2_HOST` | `3.34.xxx.xxx` | EC2 퍼블릭 IP 또는 도메인 |
| `EC2_USER` | `ec2-user` 또는 `ubuntu` | SSH 접속 사용자 |
| `EC2_SSH_KEY` | (PEM 파일 전체 내용) | EC2 SSH 프라이빗 키 |
| `EC2_PORT` | `22` | SSH 포트 |
| `EC2_APP_DIR` | `/home/ec2-user/aws-board-backend` | EC2 내 앱 디렉토리 경로 |
| `EC2_APP_NAME` | `board-api` | PM2 앱 이름 |

> `EC2_SSH_KEY`는 PEM 파일 내용 전체(`-----BEGIN RSA PRIVATE KEY-----` 포함)를 Secret 값으로 등록한다.

---

## EC2 서버 사전 준비

배포 전 EC2 서버에 아래 항목이 준비되어 있어야 한다. 상세 설치 절차는 [dev-environment.md](dev-environment.md)의 **EC2 서버 초기 설정** 섹션을 참조한다.

- [ ] Node.js 20 설치 (nvm 권장)
- [ ] pnpm 설치
- [ ] PM2 설치
- [ ] 저장소 클론 완료 (`EC2_APP_DIR` 경로에 위치)
- [ ] `.env` 파일 설정 완료 (DATABASE_URL, JWT_SECRET, AWS 키 등)
- [ ] 최초 배포 1회 수동 실행 완료
- [ ] PM2 시작 프로그램 등록 완료 (`pm2 startup`)
- [ ] EC2 보안 그룹: 포트 22(SSH), 3000(API) inbound 허용

---

## 배포 흐름 요약

```
개발자: feature/* 브랜치에서 개발
    ↓
PR 생성 (feature/* → main)
    ↓
GitHub Actions CI 자동 실행 (lint → type-check → test → build)
    ↓
CI 통과 + 리뷰어 승인
    ↓
main 브랜치로 PR 머지
    ↓
GitHub Actions CD 자동 실행 (deploy job)
    ↓
EC2 서버: git pull → pnpm install → prisma migrate deploy → build → pm2 reload
    ↓
배포 완료
```

---

## 마이그레이션 자동화

배포 파이프라인에서 `pnpm prisma migrate deploy`가 자동 실행된다.

- `prisma migrate deploy`는 미적용 마이그레이션 파일만 순서대로 적용한다.
- 새 마이그레이션을 생성하지 않으며, 개발 중 `prisma migrate dev`로 생성된 파일만 적용한다.
- 마이그레이션이 없으면 no-op으로 통과하므로 매 배포마다 실행해도 안전하다.

---

## 롤백 방법

### PM2 롤백 (빠른 방법)
```bash
# EC2 서버에서 직접 실행
ssh ec2-user@<EC2_HOST>
cd /home/ec2-user/aws-board-backend

# 이전 커밋으로 되돌리기
git log --oneline -5          # 롤백 대상 커밋 해시 확인
git checkout <commit-hash>    # 특정 커밋으로 체크아웃
pnpm install --frozen-lockfile --prod
pnpm build
pm2 reload board-api
```

### 이전 커밋으로 재배포 (GitHub Flow)
```bash
# main 브랜치에서 revert 커밋 생성
git revert HEAD
git push origin main
# → GitHub Actions CD가 자동으로 EC2에 재배포
```

---

## 브랜치 보호 규칙

`main` 브랜치에 다음 보호 규칙을 설정한다:

- PR 필수 (직접 push 금지)
- CI 통과 필수 (lint, type-check, test, build 모두 통과)
- 최소 1명 리뷰어 승인 필요
