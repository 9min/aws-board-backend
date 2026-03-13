# PRD: AWS 기반 게시판 API

## 1. 프로젝트 개요

### 배경 및 목적
NestJS와 AWS 인프라를 기반으로 한 게시판 API 서버를 개발한다.
JWT 자체 인증, PostgreSQL(AWS RDS), 파일 업로드(AWS S3)를 포함한 완전한 백엔드 시스템을 구축하는 것이 목표다.

### 범위
- REST API 서버 (NestJS 11)
- 사용자 인증/인가 (JWT)
- 게시글·댓글 CRUD
- 파일 업로드 (S3 Presigned URL)
- 페이지네이션 및 검색

---

## 2. 핵심 기능

### 기능 1: 사용자 인증 (JWT)
- 이메일/비밀번호 기반 회원가입
- 로그인 시 Access Token 발급 (JWT)
- 인증이 필요한 API에 Bearer Token 검증
- 비밀번호는 bcrypt로 해시 저장

### 기능 2: 게시글 CRUD + 조회수
- 게시글 작성 (인증 필요)
- 게시글 목록 조회 (공개)
- 게시글 상세 조회 시 조회수 자동 증가 (공개)
- 게시글 수정/삭제 (작성자 본인만 가능)

### 기능 3: 댓글 CRUD
- 댓글 작성 (인증 필요)
- 댓글 목록 조회 (게시글 상세 조회 시 포함)
- 댓글 수정/삭제 (작성자 본인만 가능)
- 게시글 삭제 시 댓글 cascade 삭제

### 기능 4: 파일 업로드 (S3 Presigned URL)
- S3 Presigned URL 발급 API (인증 필요)
- 클라이언트가 Presigned URL로 직접 S3에 업로드
- 업로드 완료 후 파일 정보를 게시글에 연결
- 게시글 삭제 시 S3 파일도 함께 삭제

### 기능 5: 페이지네이션 및 검색
- 게시글 목록: cursor-based 페이지네이션
- 제목/내용 키워드 검색
- 정렬 옵션: 최신순, 조회순

---

## 3. 사용자 스토리

| ID | 사용자 스토리 | 완료 조건 |
|----|-------------|---------|
| US-001 | 사용자로서 이메일과 비밀번호로 회원가입하고 싶다 | 중복 이메일 거부, 비밀번호 해시 저장 |
| US-002 | 사용자로서 로그인하여 JWT 토큰을 받고 싶다 | 유효한 자격증명 시 토큰 반환 |
| US-003 | 인증된 사용자로서 게시글을 작성하고 싶다 | 제목/내용 필수, 파일 첨부 선택 |
| US-004 | 모든 사용자로서 게시글 목록을 페이지별로 볼 수 있다 | 페이지네이션, 조회수 포함 |
| US-005 | 모든 사용자로서 게시글 상세를 보면 조회수가 오른다 | 상세 조회 시 viewCount +1 |
| US-006 | 작성자로서 자신의 게시글을 수정/삭제할 수 있다 | 타인 게시글 수정 시 403 반환 |
| US-007 | 인증된 사용자로서 게시글에 댓글을 달 수 있다 | 댓글 작성자 정보 포함 |
| US-008 | 인증된 사용자로서 S3 업로드 URL을 요청할 수 있다 | Presigned URL과 파일 key 반환 |
| US-009 | 사용자로서 키워드로 게시글을 검색할 수 있다 | 제목+내용 부분 일치 검색 |

---

## 4. 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| 런타임 | Node.js | >= 20 |
| 프레임워크 | NestJS | 11.x |
| ORM | Prisma | 6.x |
| 데이터베이스 | PostgreSQL (AWS RDS) | 16 |
| 파일 스토리지 | AWS S3 | - |
| 인증 | JWT (passport-jwt) | - |
| 유효성 검사 | class-validator + class-transformer | - |
| API 문서 | Swagger (@nestjs/swagger) | - |
| 패키지 매니저 | pnpm | >= 9 |
| 테스트 | Jest | 30.x |
| 배포 | AWS (EC2/ECS/Lambda) | - |

---

## 5. 비기능 요구사항

### 성능
- API 응답 시간 p95 < 500ms
- 게시글 목록 조회: DB 인덱스 활용

### 보안
- 모든 비밀번호 bcrypt 해시 (salt rounds >= 10)
- JWT 시크릿 환경변수 관리
- AWS 자격증명 환경변수 관리, 코드 하드코딩 금지
- 요청 데이터 class-validator로 검증
- 타인 리소스 접근 시 403 반환 (404 아님)

### 코드 품질
- TypeScript strict 모드 (`noImplicitAny: true`)
- `any` 타입 사용 금지
- 테스트 커버리지 목표: 80% 이상

---

## 6. API 설계 규칙

### 공통 응답 형식
```json
// 성공
{ "data": { ... }, "error": null, "meta": { "page": 1, "total": 100 } }

// 실패
{ "data": null, "error": { "message": "...", "code": "ERROR_CODE" }, "meta": null }
```

### URL 규칙
- 기본 경로: `/api/v1`
- 리소스 복수형: `/posts`, `/comments`, `/users`
- 중첩 리소스: `/posts/:postId/comments`

### HTTP 메서드
| 메서드 | 용도 |
|--------|------|
| GET | 조회 |
| POST | 생성 |
| PATCH | 부분 수정 |
| DELETE | 삭제 |

### API 엔드포인트

#### 인증
- `POST /api/v1/auth/register` — 회원가입
- `POST /api/v1/auth/login` — 로그인

#### 게시글
- `GET /api/v1/posts` — 목록 조회 (페이지네이션, 검색)
- `POST /api/v1/posts` — 게시글 작성 (인증)
- `GET /api/v1/posts/:id` — 상세 조회 (조회수 증가)
- `PATCH /api/v1/posts/:id` — 게시글 수정 (작성자)
- `DELETE /api/v1/posts/:id` — 게시글 삭제 (작성자)

#### 댓글
- `GET /api/v1/posts/:postId/comments` — 댓글 목록
- `POST /api/v1/posts/:postId/comments` — 댓글 작성 (인증)
- `PATCH /api/v1/posts/:postId/comments/:id` — 댓글 수정 (작성자)
- `DELETE /api/v1/posts/:postId/comments/:id` — 댓글 삭제 (작성자)

#### 파일
- `POST /api/v1/files/presigned-url` — Presigned URL 발급 (인증)

---

## 7. 마일스톤

| 단계 | 내용 | 상태 |
|------|------|------|
| M1 | 프로젝트 초기 세팅 (NestJS + Prisma + 공통 모듈) | 진행중 |
| M2 | 사용자 인증 (회원가입/로그인 JWT) | 예정 |
| M3 | 게시글 CRUD + 조회수 | 예정 |
| M4 | 댓글 CRUD | 예정 |
| M5 | 파일 업로드 (S3 Presigned URL) | 예정 |
| M6 | 페이지네이션 + 검색 | 예정 |
| M7 | 테스트 커버리지 80% 달성 | 예정 |
| M8 | AWS 배포 | 예정 |
