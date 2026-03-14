# AWS 기반 게시판 API

NestJS + Prisma + AWS 인프라 기반 게시판 REST API 서버입니다.

## 목차

- [기술 스택](#기술-스택)
- [서버 정보](#서버-정보)
- [응답 형식](#응답-형식)
- [인증](#인증)
- [API 엔드포인트](#api-엔드포인트)
  - [Auth (인증)](#auth-인증)
  - [Posts (게시글)](#posts-게시글)
  - [Comments (댓글)](#comments-댓글)
  - [Files (파일 업로드)](#files-파일-업로드)
- [로컬 개발 환경 설정](#로컬-개발-환경-설정)
- [환경변수](#환경변수)

---

## 기술 스택

- **Runtime**: Node.js 20
- **Framework**: NestJS 11
- **ORM**: Prisma 6
- **Database**: PostgreSQL 16 (AWS RDS)
- **인증**: JWT (Bearer Token)
- **파일 스토리지**: AWS S3 (Presigned URL)
- **패키지 매니저**: pnpm

---

## 서버 정보

| 환경 | URL |
|------|-----|
| 프로덕션 | `http://3.38.166.223:3000` |
| 로컬 | `http://localhost:3000` |
| Swagger 문서 | `http://3.38.166.223:3000/api/docs` |

---

## 응답 형식

모든 응답은 동일한 구조를 따릅니다.

### 성공 응답

```json
{
  "data": { ... },
  "error": null,
  "meta": null
}
```

### 에러 응답

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

### 주요 에러 코드

| HTTP 상태 | code | 설명 |
|-----------|------|------|
| 400 | `BAD_REQUEST` | 유효성 검사 실패 |
| 401 | `UNAUTHORIZED` | 인증 실패 또는 토큰 없음 |
| 403 | `FORBIDDEN` | 권한 없음 (타인 리소스) |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 409 | `CONFLICT` | 중복 데이터 (이메일 중복 등) |

---

## 인증

로그인 후 발급받은 `accessToken`을 요청 헤더에 포함합니다.

```
Authorization: Bearer <accessToken>
```

인증이 필요한 API는 아래 표에 🔒 표시되어 있습니다.

---

## API 엔드포인트

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
| cursor | number | ❌ | - | 이전 페이지 마지막 게시글 ID |
| search | string | ❌ | - | 검색 키워드 (제목+내용) |
| sort | string | ❌ | `latest` | 정렬 방식: `latest` \| `views` |

**예시**

```
GET /posts?limit=10&sort=latest
GET /posts?limit=10&cursor=20&sort=latest
GET /posts?search=검색어&limit=10&sort=views
```

**Response (200)**

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
        "author": {
          "id": 1,
          "nickname": "홍길동"
        }
      }
    ],
    "nextCursor": 11
  },
  "error": null,
  "meta": null
}
```

> `nextCursor`가 `null`이면 마지막 페이지입니다. 다음 페이지 요청 시 `cursor=<nextCursor>`를 사용합니다.

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
    "author": {
      "id": 1,
      "nickname": "홍길동"
    }
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

> 작성자 본인만 수정 가능합니다. 타인이 요청하면 `403 FORBIDDEN`을 반환합니다.

**Response (200)**: 수정된 게시글 객체 반환

---

#### 게시글 삭제 🔒

```
DELETE /posts/:id
```

> 작성자 본인만 삭제 가능합니다. 타인이 요청하면 `403 FORBIDDEN`을 반환합니다.

**Response (200)**

```json
{
  "data": null,
  "error": null,
  "meta": null
}
```

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
      "author": {
        "id": 2,
        "nickname": "댓글작성자"
      }
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

**Response (200)**

```json
{
  "data": null,
  "error": null,
  "meta": null
}
```

---

### Files (파일 업로드)

S3에 직접 업로드하는 방식입니다. 서버를 거치지 않고 클라이언트가 S3에 직접 업로드합니다.

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

**Response (200)**

```json
{
  "data": {
    "presignedUrl": "https://your-bucket.s3.amazonaws.com/uploads/1/uuid.jpg?...",
    "key": "uploads/1/uuid.jpg"
  },
  "error": null,
  "meta": null
}
```

#### S3 업로드 흐름

```
클라이언트 → POST /files/presigned-url → 서버 → presignedUrl 반환
클라이언트 → PUT presignedUrl (파일 첨부) → S3 직접 업로드
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
  body: JSON.stringify({
    fileName: 'photo.jpg',
    contentType: 'image/jpeg',
  }),
});
const { data } = await response.json();

// 2. S3에 직접 업로드 (PUT 요청)
await fetch(data.presignedUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'image/jpeg' },
  body: file, // File 객체 (input[type=file]에서 가져온 파일)
});

// 3. 저장된 파일 경로
console.log(data.key); // "uploads/1/uuid.jpg"
```

> Presigned URL의 유효 시간은 **5분(300초)**입니다. 발급 후 5분 이내에 업로드해야 합니다.

---

## 로컬 개발 환경 설정

### 사전 요구사항

- Node.js 20+
- pnpm
- Docker Desktop

### 실행

```bash
# 의존성 설치
pnpm install

# 로컬 PostgreSQL 실행 + 개발 서버 시작 (한 번에)
pnpm dev
```

`pnpm dev`는 Docker로 PostgreSQL을 실행하고 NestJS 개발 서버를 watch 모드로 시작합니다.

### DB 마이그레이션

```bash
pnpm prisma migrate dev
```

### Swagger API 문서

```
http://localhost:3000/api/docs
```

---

## 환경변수

`.env.example`을 복사해서 `.env`를 생성합니다.

```bash
cp .env.example .env
```

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 연결 URL | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | JWT 서명 키 | 임의의 긴 문자열 |
| `JWT_EXPIRES_IN` | JWT 만료 시간 | `1d` |
| `AWS_REGION` | AWS 리전 | `ap-northeast-2` |
| `AWS_ACCESS_KEY_ID` | AWS 액세스 키 | - |
| `AWS_SECRET_ACCESS_KEY` | AWS 시크릿 키 | - |
| `AWS_S3_BUCKET` | S3 버킷 이름 | - |
