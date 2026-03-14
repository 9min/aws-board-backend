# AWS 기반 게시판 API

![CI](https://github.com/9min/aws-board-backend/actions/workflows/ci.yml/badge.svg)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![pnpm](https://img.shields.io/badge/pnpm-9-F69220?logo=pnpm)

> NestJS + Prisma + AWS 인프라 기반 게시판 REST API 서버

---

## 목차

- [기술 스택](#기술-스택)
- [아키텍처](#아키텍처)
- [데이터 모델](#데이터-모델)
- [프로젝트 구조](#프로젝트-구조)
- [빠른 시작](#빠른-시작)
- [환경변수](#환경변수)
- [API 엔드포인트](#api-엔드포인트)
  - [서버 정보](#서버-정보)
  - [응답 형식](#응답-형식)
  - [인증 방식](#인증-방식)
  - [Auth (인증)](#auth-인증)
  - [Posts (게시글)](#posts-게시글)
  - [Comments (댓글)](#comments-댓글)
  - [Files (파일 업로드)](#files-파일-업로드)
- [CI/CD 파이프라인](#cicd-파이프라인)
- [개발 가이드](#개발-가이드)

---

## 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| Runtime | Node.js | 20 |
| Framework | NestJS | 11 |
| ORM | Prisma | 6 |
| Database | PostgreSQL (AWS RDS) | 16 |
| 인증 | JWT (passport-jwt) | - |
| 파일 스토리지 | AWS S3 (Presigned URL) | - |
| 유효성 검사 | class-validator + class-transformer | - |
| API 문서 | Swagger (@nestjs/swagger) | - |
| 패키지 매니저 | pnpm | 9 |
| 테스트 | Jest | 30 |

---

## 아키텍처

```
                    ┌─────────────────────────────────────┐
                    │            Client (Browser/App)      │
                    └──────────────────┬──────────────────┘
                                       │ HTTP REST
                    ┌──────────────────▼──────────────────┐
                    │          NestJS API Server           │
                    │   (EC2 · PM2 · port 3000)            │
                    │                                      │
                    │  ┌─────────┐  ┌──────────────────┐  │
                    │  │  Auth   │  │  ResponseInterc. │  │
                    │  │  Guard  │  │  HttpExcepFilter │  │
                    │  └─────────┘  └──────────────────┘  │
                    │                                      │
                    │  ┌────────┐ ┌─────────┐ ┌───────┐  │
                    │  │  Auth  │ │  Posts  │ │Files  │  │
                    │  │ Module │ │ Module  │ │Module │  │
                    │  └────────┘ └─────────┘ └───┬───┘  │
                    └──────────────────┬───────────┼──────┘
                                       │           │ Presigned URL
                    ┌──────────────────▼──────┐    │
                    │    AWS RDS PostgreSQL   │    │ S3 Direct Upload
                    │    (Prisma ORM)         │    │ (Client → S3)
                    └─────────────────────────┘    │
                                       ┌───────────▼──────┐
                                       │    AWS S3 Bucket  │
                                       │  (파일 영구 저장)  │
                                       └──────────────────┘
```

---

## 데이터 모델

```mermaid
erDiagram
    User {
        Int id PK
        String email UK
        String password
        String nickname
        DateTime createdAt
        DateTime updatedAt
    }

    Post {
        Int id PK
        String title
        String content
        Int viewCount
        Int authorId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Comment {
        Int id PK
        String content
        Int postId FK
        Int authorId FK
        DateTime createdAt
        DateTime updatedAt
    }

    FileAttachment {
        Int id PK
        String url
        String key UK
        Int postId FK
        DateTime createdAt
    }

    User ||--o{ Post : "작성"
    User ||--o{ Comment : "작성"
    Post ||--o{ Comment : "포함 (cascade)"
    Post ||--o{ FileAttachment : "첨부 (cascade)"
```

---

## 프로젝트 구조

```
aws-board-backend/
├── .github/workflows/ci.yml     # GitHub Actions CI/CD
├── prisma/
│   ├── schema.prisma            # Prisma 스키마 (DB 모델 정의)
│   └── migrations/              # 마이그레이션 파일 (자동 생성)
├── src/
│   ├── main.ts                  # 애플리케이션 진입점
│   ├── app.module.ts            # 루트 모듈
│   ├── auth/                    # 인증 (JWT 회원가입/로그인)
│   │   ├── dto/                 # RegisterDto, LoginDto
│   │   ├── guards/              # JwtAuthGuard
│   │   └── strategies/          # JwtStrategy (passport)
│   ├── posts/                   # 게시글 CRUD + 페이지네이션
│   │   └── dto/                 # CreatePostDto, UpdatePostDto, PostQueryDto
│   ├── comments/                # 댓글 CRUD
│   │   └── dto/                 # CreateCommentDto, UpdateCommentDto
│   ├── files/                   # S3 Presigned URL + 첨부파일 연결
│   │   └── dto/                 # CreatePresignedUrlDto, AttachFileDto
│   ├── prisma/                  # PrismaModule (@Global), PrismaService
│   ├── config/                  # 환경변수 설정 팩토리
│   └── common/
│       ├── decorators/          # @CurrentUser() 커스텀 데코레이터
│       ├── filters/             # HttpExceptionFilter (에러 응답 통일)
│       └── interceptors/        # ResponseInterceptor (성공 응답 통일)
├── test/                        # E2E 테스트
├── .env.example                 # 환경변수 템플릿
├── docker-compose.yml           # 로컬 PostgreSQL 컨테이너
└── package.json
```

### 레이어 구조

```
Controller  →  Service  →  PrismaService  →  PostgreSQL (AWS RDS)
(HTTP 라우팅)   (비즈니스 로직)   (DB 접근)
```

---

## 빠른 시작

### 사전 요구사항

- Node.js 20+
- pnpm 9+
- Docker Desktop (로컬 PostgreSQL용)

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone <repo-url>
cd aws-board-backend

# 2. 환경변수 설정
cp .env.example .env
# .env 파일을 열어 값 입력

# 3. 의존성 설치
pnpm install

# 4. 로컬 PostgreSQL 실행 + 개발 서버 시작 (한 번에)
pnpm dev
```

> `pnpm dev`는 Docker로 PostgreSQL 컨테이너를 시작하고, NestJS를 watch 모드로 실행합니다.

### DB 마이그레이션

```bash
pnpm prisma:migrate
```

### Swagger API 문서 확인

```
http://localhost:3000/api/docs
```

---

## 환경변수

`.env.example`을 복사해 `.env`를 생성합니다.

```bash
cp .env.example .env
```

| 변수명 | 설명 | 예시 | 필수 |
|--------|------|------|------|
| `DATABASE_URL` | PostgreSQL 연결 URL | `postgresql://user:pass@localhost:5432/db` | ✅ |
| `JWT_SECRET` | JWT 서명 키 (충분히 긴 임의 문자열) | `super-secret-key-32chars` | ✅ |
| `JWT_EXPIRES_IN` | JWT 만료 시간 | `1d` | ✅ |
| `AWS_REGION` | AWS 리전 | `ap-northeast-2` | ✅ |
| `AWS_ACCESS_KEY_ID` | AWS 액세스 키 ID | - | ✅ |
| `AWS_SECRET_ACCESS_KEY` | AWS 시크릿 액세스 키 | - | ✅ |
| `AWS_S3_BUCKET` | S3 버킷 이름 | `my-board-bucket` | ✅ |

> 보안 주의: `.env` 파일은 절대 git에 커밋하지 않습니다.

---

## API 엔드포인트

### 서버 정보

| 환경 | URL |
|------|-----|
| 프로덕션 | `http://3.38.166.223:3000` |
| 로컬 | `http://localhost:3000` |
| Swagger 문서 | `http://3.38.166.223:3000/api/docs` |

---

### 응답 형식

모든 응답은 동일한 구조를 따릅니다.

**성공 응답**

```json
{
  "data": { ... },
  "error": null,
  "meta": null
}
```

**에러 응답**

```json
{
  "data": null,
  "error": {
    "message": "에러 메시지",
    "code": "UNAUTHORIZED"
  },
  "meta": null
}
```

**주요 에러 코드**

| HTTP 상태 | code | 설명 |
|-----------|------|------|
| 400 | `BAD_REQUEST` | 유효성 검사 실패 |
| 401 | `UNAUTHORIZED` | 인증 실패 또는 토큰 없음 |
| 403 | `FORBIDDEN` | 권한 없음 (타인 리소스) |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 409 | `CONFLICT` | 중복 데이터 (이메일 중복 등) |

---

### 인증 방식

로그인 후 발급받은 `accessToken`을 요청 헤더에 포함합니다.

```
Authorization: Bearer <accessToken>
```

인증이 필요한 API는 🔒 표시되어 있습니다.

---

### Auth (인증)

#### 회원가입

```
POST /auth/register
```

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "홍길동"
}
```

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| email | string | ✅ | 이메일 형식 |
| password | string | ✅ | 8~20자 |
| nickname | string | ✅ | 2~20자 |

**Response (201)**

```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "홍길동",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "error": null,
  "meta": null
}
```

---

#### 로그인

```
POST /auth/login
```

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200)**

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "error": null,
  "meta": null
}
```

> `accessToken`은 JWT 토큰이며, 이후 인증이 필요한 요청에 사용합니다.

---

### Posts (게시글)

#### 게시글 목록 조회

```
GET /posts
```

**Query Parameters**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| limit | number | ❌ | 10 | 페이지당 게시글 수 |
| page | number | ❌ | - | 페이지 번호 (offset 페이지네이션, 1 이상) |
| cursor | number | ❌ | - | 이전 페이지 마지막 게시글 ID (cursor 페이지네이션) |
| search | string | ❌ | - | 검색 키워드 (제목+내용) |
| sort | string | ❌ | `latest` | 정렬 방식: `latest` \| `views` |

> `page`와 `cursor`는 동시에 사용하지 않습니다. `page`가 있으면 offset 페이지네이션, 없으면 cursor 페이지네이션으로 동작합니다.

**예시**

```
GET /posts?limit=10&sort=latest
GET /posts?page=1&limit=10&sort=latest
GET /posts?limit=10&cursor=20&sort=latest
GET /posts?search=검색어&limit=10&sort=views
```

**Response (200) — offset 페이지네이션 (`page` 파라미터 사용 시)**

```json
{
  "data": {
    "items": [
      {
        "id": 21,
        "title": "게시글 제목",
        "content": "게시글 내용",
        "viewCount": 42,
        "authorId": 1,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "author": { "id": 1, "nickname": "홍길동" }
      }
    ],
    "total": 100,
    "page": 1,
    "totalPages": 10,
    "limit": 10
  },
  "error": null,
  "meta": null
}
```

**Response (200) — cursor 페이지네이션 (기본 동작)**

```json
{
  "data": {
    "items": [
      {
        "id": 21,
        "title": "게시글 제목",
        "content": "게시글 내용",
        "viewCount": 42,
        "authorId": 1,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "author": { "id": 1, "nickname": "홍길동" }
      }
    ],
    "nextCursor": 11
  },
  "error": null,
  "meta": null
}
```

> `nextCursor`가 `null`이면 마지막 페이지입니다.

---

#### 게시글 상세 조회

```
GET /posts/:id
```

**Response (200)**

```json
{
  "data": {
    "id": 1,
    "title": "게시글 제목",
    "content": "게시글 내용",
    "viewCount": 43,
    "authorId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "author": { "id": 1, "nickname": "홍길동" },
    "attachments": [
      {
        "id": 1,
        "url": "https://bucket.s3.ap-northeast-2.amazonaws.com/uploads/1/uuid.jpg",
        "key": "uploads/1/uuid.jpg"
      }
    ]
  },
  "error": null,
  "meta": null
}
```

> 조회할 때마다 `viewCount`가 1 증가합니다.

---

#### 게시글 작성 🔒

```
POST /posts
```

**Request Body**

```json
{
  "title": "게시글 제목",
  "content": "게시글 내용"
}
```

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| title | string | ✅ | 1~100자 |
| content | string | ✅ | 1자 이상 |

**Response (201)**: 생성된 게시글 객체 반환

---

#### 게시글 수정 🔒

```
PATCH /posts/:id
```

**Request Body** (수정할 필드만 포함)

```json
{
  "title": "수정된 제목",
  "content": "수정된 내용"
}
```

> 작성자 본인만 수정 가능합니다. 타인 요청 시 `403 FORBIDDEN`을 반환합니다.

**Response (200)**: 수정된 게시글 객체 반환

---

#### 게시글 삭제 🔒

```
DELETE /posts/:id
```

> 작성자 본인만 삭제 가능합니다. 게시글 삭제 시 연결된 댓글 및 S3 파일도 함께 삭제됩니다.

**Response (204)**: 본문 없음

---

### Comments (댓글)

#### 댓글 목록 조회

```
GET /posts/:postId/comments
```

**Response (200)**

```json
{
  "data": [
    {
      "id": 1,
      "content": "댓글 내용입니다.",
      "postId": 1,
      "authorId": 2,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "author": { "id": 2, "nickname": "댓글작성자" }
    }
  ],
  "error": null,
  "meta": null
}
```

---

#### 댓글 작성 🔒

```
POST /posts/:postId/comments
```

**Request Body**

```json
{
  "content": "댓글 내용입니다."
}
```

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| content | string | ✅ | 1~500자 |

**Response (201)**: 생성된 댓글 객체 반환

---

#### 댓글 수정 🔒

```
PATCH /posts/:postId/comments/:commentId
```

**Request Body**

```json
{
  "content": "수정된 댓글 내용"
}
```

> 작성자 본인만 수정 가능합니다.

**Response (200)**: 수정된 댓글 객체 반환

---

#### 댓글 삭제 🔒

```
DELETE /posts/:postId/comments/:commentId
```

> 작성자 본인만 삭제 가능합니다.

**Response (204)**: 본문 없음

---

### Files (파일 업로드)

S3에 직접 업로드하는 방식입니다. 서버를 거치지 않고 클라이언트가 S3에 직접 업로드합니다.

> **제한**: 최대 **5MB**, Presigned URL 유효 시간 **5분**. 5MB 초과 시 S3에서 직접 거부합니다.

**허용 contentType**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`

---

#### Presigned URL 발급 🔒

```
POST /files/presigned-url
```

**Request Body**

```json
{
  "fileName": "photo.jpg",
  "contentType": "image/jpeg"
}
```

| 필드 | 타입 | 필수 | 허용 값 |
|------|------|------|---------|
| fileName | string | ✅ | 영문/숫자/특수문자(`-`, `_`, `.`, 공백) |
| contentType | string | ✅ | `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf` |

**Response (201)**

```json
{
  "data": {
    "url": "https://your-bucket.s3.ap-northeast-2.amazonaws.com/",
    "fields": {
      "key": "uploads/1/uuid.jpg",
      "Content-Type": "image/jpeg",
      "Policy": "...",
      "X-Amz-Signature": "..."
    },
    "key": "uploads/1/uuid.jpg"
  },
  "error": null,
  "meta": null
}
```

---

#### 게시글에 파일 연결 🔒

```
POST /posts/:id/attachments
```

**Request Body**

```json
{
  "key": "uploads/1/uuid.jpg"
}
```

**Response (201)**: 생성된 첨부파일 객체 반환

---

#### 첨부파일 단건 삭제 🔒

```
DELETE /posts/:id/attachments/:attachmentId
```

> 게시글 작성자만 삭제 가능합니다. S3 파일도 함께 삭제됩니다.

**Response (204)**: 본문 없음

---

#### S3 업로드 전체 흐름

```
1. POST /files/presigned-url          → url, fields, key 받기
2. POST {url} (multipart/form-data)   → S3에 직접 업로드
3. POST /posts/:id/attachments        → 게시글에 파일 연결
```

**업로드 예시 코드**

```javascript
// 1. Presigned URL 발급
const response = await fetch('/files/presigned-url', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ fileName: 'photo.jpg', contentType: 'image/jpeg' }),
});
const { data } = await response.json();

// 2. S3에 직접 업로드 (multipart/form-data POST)
const formData = new FormData();
Object.entries(data.fields).forEach(([k, v]) => formData.append(k, v));
formData.append('file', file); // File 객체는 반드시 마지막에 추가

await fetch(data.url, { method: 'POST', body: formData });
// 5MB 초과 시 S3가 403 에러 반환

// 3. 게시글에 파일 연결
await fetch(`/posts/${postId}/attachments`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ key: data.key }),
});
```

---

## CI/CD 파이프라인

GitHub Actions 기반으로 PR 및 main 브랜치 push 시 자동 실행됩니다.

```
push / PR to main
        │
        ├─── lint (ESLint 검사)
        │
        ├─── type-check (tsc --noEmit)
        │
        ├─── test (Jest 단위 테스트)
        │
        └─ (위 3개 통과 시) ──→ build (nest build)
                                      │
                              (main push 시에만)
                                      │
                                      ▼
                              deploy (EC2 SSH)
                                ├── git pull
                                ├── pnpm install
                                ├── prisma generate
                                ├── prisma migrate deploy
                                ├── pnpm build
                                └── pm2 reload (무중단)
```

> PR 머지 전에 lint, type-check, test 모두 통과해야 합니다.

---

## 개발 가이드

### 주요 npm scripts

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | Docker PostgreSQL 시작 + NestJS watch 모드 실행 |
| `pnpm build` | TypeScript 빌드 (`dist/`) |
| `pnpm start:prod` | 프로덕션 서버 실행 |
| `pnpm test` | 단위 테스트 (Jest) |
| `pnpm test:cov` | 테스트 커버리지 리포트 |
| `pnpm test:e2e` | E2E 테스트 |
| `pnpm lint` | ESLint 검사 + 자동 수정 |
| `pnpm format` | Prettier 포맷팅 |
| `pnpm prisma:migrate` | DB 마이그레이션 실행 (개발) |
| `pnpm prisma:studio` | Prisma Studio (DB GUI) |

### 커밋 컨벤션

Gitmoji + Conventional Commits 형식을 따릅니다.

```
✨ feat: 기능 추가
🐛 fix: 버그 수정
♻️ refactor: 코드 개선 (기능 변경 없음)
✅ test: 테스트 추가/수정
📝 docs: 문서 수정
🔧 chore: 빌드/설정 변경
```

**예시**

```
✨ feat: 사용자 로그인 기능 추가
🐛 fix: 토큰 만료 시 401 응답 오류 수정
✅ test: PostsService 단위 테스트 추가
```

### 브랜치 전략 (GitHub Flow)

```
main  ─────────────────────────────────── (항상 배포 가능 상태)
         ↑ PR merge
feature/add-login ──→ (개발 완료 후 PR)
fix/token-refresh ──→ (버그 수정 후 PR)
```

- `main`에 직접 push 금지
- 모든 변경은 feature/* 또는 fix/* 브랜치에서 개발 후 PR 생성
- PR 머지 시 자동 배포 트리거
