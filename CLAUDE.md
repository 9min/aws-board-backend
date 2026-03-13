# CLAUDE.md - AWS 기반 게시판 API 프로젝트 규칙

## 프로젝트 개요

- **프로젝트명**: AWS 기반 게시판 API
- **목적**: NestJS + Prisma + AWS 인프라 기반 게시판 REST API 서버
- **PRD**: [docs/prd.md](docs/prd.md)

---

## 기술 스택

- **프레임워크**: NestJS 11
- **ORM**: Prisma 6 (AWS RDS PostgreSQL 16)
- **파일 스토리지**: AWS S3 (Presigned URL)
- **인증**: JWT 자체 인증 (passport-jwt)
- **유효성 검사**: class-validator + class-transformer
- **API 문서**: Swagger (@nestjs/swagger)
- **린트/포매팅**: ESLint 9 + Prettier
- **테스트**: Jest (*.spec.ts)
- **패키지 매니저**: pnpm
- **배포**: AWS (EC2/ECS/Lambda)
- **버전 관리**: Git (GitHub Flow)

---

## 핵심 규칙

### 언어

- 코드 내 주석, 커밋 메시지, PR 설명 등 모든 문서는 **한국어**로 작성한다.

### 코드 스타일

- ESLint + Prettier 설정을 따른다. (`eslint.config.mjs`, `.prettierrc` 참조)
- TypeScript strict 모드를 사용한다. (`"noImplicitAny": true`)
- `any` 타입 사용을 금지한다. 불가피한 경우 `unknown`을 사용하고 타입 가드를 적용한다.
- 네이밍 컨벤션:
  - 클래스/DTO/Entity: `PascalCase`
  - 함수/변수/메서드: `camelCase`
  - 상수: `UPPER_SNAKE_CASE`
  - 타입/인터페이스: `PascalCase`
  - 파일명: `camelCase.ts` (단, NestJS 컨벤션 `*.module.ts`, `*.service.ts` 등 준수)

### 브랜치 전략

- GitHub Flow 기반: `main` → `feature/*`, `fix/*`, `hotfix/*`
- 직접 `main` 푸시 금지. 반드시 PR을 통해 머지한다.

### 커밋 컨벤션

- Gitmoji + Conventional Commits 형식
- 예: `✨ feat: 사용자 로그인 기능 추가`
- 예: `🐛 fix: 토큰 만료 시 401 응답 오류 수정`

### 테스트 (TDD)

- **TDD(Test-Driven Development) 방식으로 개발한다.** 테스트 코드를 먼저 작성한 후 구현 코드를 작성한다.
- TDD 사이클: Red(실패하는 테스트 작성) → Green(테스트를 통과하는 최소 구현) → Refactor(코드 개선)
- 새로운 기능에는 반드시 테스트 코드를 포함한다.
- Jest를 사용하며, 테스트 파일은 `*.spec.ts` 형식을 따른다.

### Prisma/AWS 사용 규칙

- `PrismaService`는 `src/prisma/prisma.module.ts`에서 `@Global()`로 제공한다.
- 데이터베이스 접근은 `PrismaService`를 DI하여 사용한다. 직접 SQL 지양.
- 마이그레이션은 `prisma migrate dev` (개발) / `prisma migrate deploy` (운영)를 사용한다.
- AWS 자격증명은 환경변수로만 관리한다. 코드 하드코딩 금지.
- S3 파일 업로드는 Presigned URL 방식을 사용한다 (서버가 직접 업로드 중계 금지).

### 보안

- **기능 개발 시 보안 검토를 필수로 수행한다.**
- 환경변수로 시크릿을 관리한다. 코드에 하드코딩 금지.
- `JWT_SECRET`, `AWS_SECRET_ACCESS_KEY` 등은 절대 코드에 포함하지 않는다.
- 사용자 입력은 class-validator DTO로 검증한다.
- OWASP Top 10을 준수한다.
- 타인 리소스 접근 시 404가 아닌 403을 반환한다.
- 보안 관련 상세 체크리스트는 [security-guide.md](docs/security-guide.md)를 참조한다.

### 에러 처리

- NestJS 예외 클래스 기반으로 처리한다. (`HttpException`, `NotFoundException`, `ForbiddenException` 등)
- 전역 `HttpExceptionFilter`를 통해 일관된 에러 응답 형식으로 변환한다.
- 응답 형식: `{ data: null, error: { message, code }, meta: null }`

---

## 상세 문서 참조

각 항목에 대한 상세 내용은 아래 문서를 참조한다.

| 문서 | 설명 |
|------|------|
| [docs/prd.md](docs/prd.md) | 프로젝트 요구사항 정의서 |
| [docs/git-workflow.md](docs/git-workflow.md) | Git 워크플로우 및 브랜치 전략 |
| [docs/commit-convention.md](docs/commit-convention.md) | 커밋 메시지 컨벤션 |
| [docs/project-structure.md](docs/project-structure.md) | 프로젝트 폴더 구조 가이드 |
| [docs/lint-config.md](docs/lint-config.md) | ESLint + Prettier 설정 |
| [docs/testing-guide.md](docs/testing-guide.md) | 테스트 코드 가이드 (Jest + TDD) |
| [docs/security-guide.md](docs/security-guide.md) | 보안 가이드 |
| [docs/cicd-guide.md](docs/cicd-guide.md) | CI/CD 설정 가이드 |
| [docs/code-review-checklist.md](docs/code-review-checklist.md) | 코드 리뷰 체크리스트 |
| [docs/error-handling.md](docs/error-handling.md) | 에러 핸들링 가이드 |
| [docs/dev-environment.md](docs/dev-environment.md) | 개발 환경 셋업 가이드 |
| [docs/data-modeling.md](docs/data-modeling.md) | Prisma 데이터 모델링 가이드 |
