# 개발 환경 셋업 가이드

## 사전 조건

| 도구 | 최소 버전 | 확인 명령 |
|------|----------|---------|
| Node.js | >= 20 | `node -v` |
| pnpm | >= 9 | `pnpm -v` |
| Docker | 최신 | `docker -v` |
| AWS CLI | >= 2 | `aws --version` |
| Git | >= 2.40 | `git --version` |

### pnpm 설치 (미설치 시)
```bash
npm install -g pnpm
```

---

## 초기 설치

```bash
# 저장소 클론
git clone <repo-url>
cd aws-board-backend

# 의존성 설치
pnpm install

# 환경변수 설정
cp .env.example .env
# .env 파일을 열어 값 입력
```

---

## 환경변수 설정 (.env)

```env
# 데이터베이스
DATABASE_URL="postgresql://user:password@localhost:5432/board_db"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="1d"

# AWS
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="ap-northeast-2"
AWS_S3_BUCKET="your-bucket-name"

# 서버
PORT=3000
```

> **주의**: `.env` 파일은 절대 git에 커밋하지 않는다. `.gitignore`에 포함되어 있다.

---

## 로컬 PostgreSQL (Docker)

### Docker로 PostgreSQL 실행

```bash
# PostgreSQL 컨테이너 실행
docker run -d \
  --name board-postgres \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=board_db \
  -p 5432:5432 \
  postgres:16

# 컨테이너 상태 확인
docker ps

# 컨테이너 중지/재시작
docker stop board-postgres
docker start board-postgres
```

### docker-compose 사용 (선택)

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: board_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
docker-compose up -d
```

---

## Prisma 설정

```bash
# Prisma 클라이언트 생성 (스키마 변경 후 필수)
pnpm prisma generate

# 개발 환경 마이그레이션 적용
pnpm prisma migrate dev --name init

# Prisma Studio (데이터 브라우저)
pnpm prisma studio

# 마이그레이션 상태 확인
pnpm prisma migrate status
```

---

## 개발 서버 실행

```bash
# 개발 서버 (watch 모드)
pnpm start:dev

# 프로덕션 빌드
pnpm build

# 프로덕션 서버
pnpm start:prod
```

서버 시작 후:
- API: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/docs`

---

## IDE 설정 (VS Code)

### 권장 확장 프로그램

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "ms-azuretools.vscode-docker"
  ]
}
```

### 설정 (.vscode/settings.json)

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## 주요 스크립트

| 명령어 | 설명 |
|--------|------|
| `pnpm start:dev` | 개발 서버 실행 (watch) |
| `pnpm build` | TypeScript 빌드 |
| `pnpm lint` | ESLint 검사 및 자동 수정 |
| `pnpm test` | 단위 테스트 실행 |
| `pnpm test:cov` | 테스트 커버리지 |
| `pnpm test:e2e` | E2E 테스트 |
| `pnpm prisma generate` | Prisma 클라이언트 생성 |
| `pnpm prisma migrate dev` | 개발 마이그레이션 |
| `pnpm prisma studio` | Prisma Studio 실행 |

---

## AWS CLI 설정 (로컬 S3 연동)

```bash
# AWS CLI 설정
aws configure
# AWS Access Key ID: (입력)
# AWS Secret Access Key: (입력)
# Default region name: ap-northeast-2
# Default output format: json

# 설정 확인
aws sts get-caller-identity
```

### LocalStack (AWS 로컬 에뮬레이션, 선택)

```bash
# LocalStack 실행
docker run -d \
  --name localstack \
  -p 4566:4566 \
  localstack/localstack

# S3 버킷 생성 (LocalStack)
aws --endpoint-url=http://localhost:4566 s3 mb s3://local-board-bucket
```

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| DB 연결 실패 | Docker 컨테이너 미실행 | `docker start board-postgres` |
| Prisma 클라이언트 오류 | generate 미실행 | `pnpm prisma generate` |
| 포트 3000 충돌 | 다른 프로세스 사용 중 | `.env`에서 `PORT` 변경 |
| JWT 오류 | `JWT_SECRET` 미설정 | `.env`에 `JWT_SECRET` 설정 |

---

## EC2 서버 초기 설정

GitHub Actions CD 파이프라인으로 자동 배포되기 전, EC2 서버에 아래 초기 설정을 **1회만** 수행한다.

### 1. Node.js 20 설치 (nvm 사용)

```bash
# nvm 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Node.js 20 설치 및 기본값 지정
nvm install 20
nvm use 20
nvm alias default 20

# 확인
node -v   # v20.x.x
```

### 2. pnpm 설치

```bash
npm install -g pnpm

# 확인
pnpm -v
```

### 3. PM2 설치

```bash
npm install -g pm2

# 확인
pm2 -v
```

### 4. 저장소 클론

```bash
cd ~
git clone <repo-url> aws-board-backend
cd aws-board-backend
```

### 5. .env 파일 설정

```bash
cp .env.example .env
vi .env   # 또는 nano .env
```

EC2 서버의 `.env`에 아래 항목을 실제 값으로 채운다:

```env
DATABASE_URL="postgresql://user:password@<RDS-ENDPOINT>:5432/board_db"
JWT_SECRET="production-secret-key"
JWT_EXPIRES_IN="1d"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="ap-northeast-2"
AWS_S3_BUCKET="your-s3-bucket-name"
PORT=3000
```

> `.env` 파일은 git에 커밋하지 않는다. EC2 서버에서만 직접 관리한다.

### 6. 최초 배포 (수동 1회)

```bash
# 의존성 설치
pnpm install --frozen-lockfile --prod

# Prisma 클라이언트 생성
pnpm prisma generate

# 초기 DB 마이그레이션 적용
pnpm prisma migrate deploy

# TypeScript 빌드
pnpm build

# PM2로 앱 시작
pm2 start dist/main.js --name board-api
```

### 7. PM2 시작 프로그램 등록 (서버 재부팅 시 자동 시작)

```bash
# 현재 shell에 맞는 startup 명령 출력 후 실행
pm2 startup
# 출력된 sudo 명령을 복사하여 실행 (예: sudo env PATH=...)

# 현재 PM2 프로세스 목록 저장
pm2 save

# 앱 상태 확인
pm2 status
pm2 logs board-api
```

### 8. EC2 보안 그룹 설정

AWS 콘솔 → EC2 → 보안 그룹 → Inbound 규칙 추가:

| 유형 | 포트 | 소스 | 설명 |
|------|------|------|------|
| SSH | 22 | 내 IP (또는 배포 서버 IP) | SSH 접속 |
| 사용자 지정 TCP | 3000 | 0.0.0.0/0 | API 서버 |

> 도메인 + Nginx 리버스 프록시 사용 시 포트 80/443을 열고 3000은 내부 접근만 허용한다.

### 9. EC2 → GitHub SSH 접근 허용 (git pull 용)

GitHub Actions의 deploy job은 EC2 서버 내에서 `git pull`을 실행한다. EC2에서 GitHub에 접근할 수 있어야 한다.

```bash
# EC2에서 SSH 키 생성
ssh-keygen -t ed25519 -C "ec2-deploy"

# 공개 키 출력 후 GitHub → Settings → Deploy keys에 등록
cat ~/.ssh/id_ed25519.pub
```

또는 HTTPS + GitHub Personal Access Token 방식을 사용할 수 있다.
