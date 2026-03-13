# 프로젝트 폴더 구조 가이드

## 전체 구조

```
aws-board-backend/
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI 워크플로우
├── prisma/
│   ├── schema.prisma               # Prisma 스키마 정의
│   └── migrations/                 # 마이그레이션 파일 (자동 생성)
├── src/
│   ├── main.ts                     # 애플리케이션 진입점
│   ├── app.module.ts               # 루트 모듈
│   │
│   ├── auth/                       # 인증 모듈
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   └── login.dto.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   └── auth.service.spec.ts
│   │
│   ├── users/                      # 사용자 모듈
│   │   ├── dto/
│   │   │   └── user-response.dto.ts
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   └── users.service.spec.ts
│   │
│   ├── posts/                      # 게시글 모듈
│   │   ├── dto/
│   │   │   ├── create-post.dto.ts
│   │   │   ├── update-post.dto.ts
│   │   │   └── post-query.dto.ts
│   │   ├── posts.controller.ts
│   │   ├── posts.module.ts
│   │   ├── posts.service.ts
│   │   └── posts.service.spec.ts
│   │
│   ├── comments/                   # 댓글 모듈
│   │   ├── dto/
│   │   │   ├── create-comment.dto.ts
│   │   │   └── update-comment.dto.ts
│   │   ├── comments.controller.ts
│   │   ├── comments.module.ts
│   │   ├── comments.service.ts
│   │   └── comments.service.spec.ts
│   │
│   ├── files/                      # 파일 업로드 모듈
│   │   ├── dto/
│   │   │   └── presigned-url.dto.ts
│   │   ├── files.controller.ts
│   │   ├── files.module.ts
│   │   ├── files.service.ts
│   │   └── files.service.spec.ts
│   │
│   ├── prisma/                     # Prisma 모듈
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts
│   │   └── prisma.service.spec.ts
│   │
│   ├── config/                     # 설정 팩토리
│   │   └── configuration.ts
│   │
│   └── common/                     # 공통 유틸리티
│       ├── decorators/
│       │   └── current-user.decorator.ts   # @CurrentUser() 데코레이터
│       ├── filters/
│       │   └── httpException.filter.ts     # 전역 에러 필터
│       ├── interceptors/
│       │   └── response.interceptor.ts     # 성공 응답 변환
│       └── pipes/
│           └── (custom pipes)
│
├── test/                           # E2E 테스트
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── .env                            # 로컬 환경변수 (git 제외)
├── .env.example                    # 환경변수 템플릿
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── nest-cli.json
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── tsconfig.build.json
```

---

## 모듈 설계 원칙

### NestJS 모듈 구조
각 도메인 폴더는 독립적인 NestJS 모듈로 구성한다.

```
posts/
├── dto/            # 요청/응답 DTO (class-validator 데코레이터 포함)
├── posts.controller.ts   # HTTP 요청 처리, 라우팅
├── posts.module.ts       # 모듈 정의, imports/exports
├── posts.service.ts      # 비즈니스 로직
└── posts.service.spec.ts # 서비스 단위 테스트
```

### 계층 구조 (Layer Architecture)
```
Controller (HTTP 레이어)
    ↓
Service (비즈니스 로직)
    ↓
PrismaService (데이터 접근)
    ↓
PostgreSQL (AWS RDS)
```

### PrismaModule (@Global)
`PrismaModule`은 `@Global()` 데코레이터로 전역 등록되어,
다른 모듈에서 `PrismaModule`을 imports하지 않아도 `PrismaService`를 DI할 수 있다.

```typescript
// src/prisma/prisma.module.ts
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

---

## DTO 네이밍 컨벤션

| 파일명 | 용도 |
|--------|------|
| `create-{resource}.dto.ts` | 생성 요청 DTO |
| `update-{resource}.dto.ts` | 수정 요청 DTO |
| `{resource}-query.dto.ts` | 쿼리 파라미터 DTO |
| `{resource}-response.dto.ts` | 응답 DTO |

---

## 응답 형식

### 성공 응답
```json
{
  "data": { "id": 1, "title": "게시글 제목" },
  "error": null,
  "meta": { "page": 1, "limit": 10, "total": 100 }
}
```

### 에러 응답
```json
{
  "data": null,
  "error": {
    "message": "게시글을 찾을 수 없습니다.",
    "code": "NOT_FOUND"
  },
  "meta": null
}
```

`ResponseInterceptor`와 `HttpExceptionFilter`가 이 형식을 자동 적용한다.
