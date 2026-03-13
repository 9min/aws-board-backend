# Prisma 데이터 모델링 가이드

## 도구

- **ORM**: Prisma 6
- **데이터베이스**: PostgreSQL 16 (AWS RDS)
- **스키마 파일**: `prisma/schema.prisma`

---

## Prisma 스키마 구조

### 전체 모델

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  password  String
  nickname  String
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  posts    Post[]
  comments Comment[]

  @@map("users")
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  viewCount Int      @default(0) @map("view_count")
  authorId  Int      @map("author_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  author      User             @relation(fields: [authorId], references: [id])
  comments    Comment[]
  attachments FileAttachment[]

  @@map("posts")
}

model Comment {
  id        Int      @id @default(autoincrement())
  content   String
  postId    Int      @map("post_id")
  authorId  Int      @map("author_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  author User @relation(fields: [authorId], references: [id])

  @@map("comments")
}

model FileAttachment {
  id        Int      @id @default(autoincrement())
  url       String
  key       String   @unique  // S3 object key
  postId    Int      @map("post_id")
  createdAt DateTime @default(now()) @map("created_at")

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@map("file_attachments")
}
```

---

## 네이밍 컨벤션

| 항목 | Prisma (TypeScript) | DB 컬럼 |
|------|-------------------|---------|
| 모델명 | `PascalCase` 단수 | `snake_case` 복수 (`@@map`) |
| 필드명 | `camelCase` | `snake_case` (`@map`) |
| 관계 필드 | `camelCase` | (컬럼 없음) |

예시:
```prisma
model FileAttachment {          // Prisma: PascalCase 단수
  viewCount Int @map("view_count")  // DB 컬럼: snake_case
  @@map("file_attachments")    // DB 테이블: snake_case 복수
}
```

---

## 관계 설계

### User ↔ Post (1:N)
```prisma
model User {
  posts Post[]
}
model Post {
  authorId Int  @map("author_id")
  author   User @relation(fields: [authorId], references: [id])
}
```

### Post ↔ Comment (1:N, Cascade Delete)
```prisma
// Post 삭제 시 Comment 자동 삭제
model Comment {
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
}
```

### Post ↔ FileAttachment (1:N, Cascade Delete)
```prisma
// Post 삭제 시 FileAttachment 자동 삭제
model FileAttachment {
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
}
```

---

## 마이그레이션 명령어

### 개발 환경

```bash
# 새 마이그레이션 생성 + 적용
pnpm prisma migrate dev --name 마이그레이션_이름

# 예시
pnpm prisma migrate dev --name add_user_table
pnpm prisma migrate dev --name add_post_view_count
```

### 운영 환경

```bash
# 기존 마이그레이션 파일만 적용 (새 마이그레이션 생성 없음)
pnpm prisma migrate deploy
```

### 기타

```bash
# Prisma 클라이언트 재생성 (스키마 변경 후 필수)
pnpm prisma generate

# 마이그레이션 상태 확인
pnpm prisma migrate status

# Prisma Studio (데이터 브라우저 UI)
pnpm prisma studio

# DB 초기화 (개발 환경 전용, 데이터 삭제됨)
pnpm prisma migrate reset
```

---

## 마이그레이션 폴더 구조

```
prisma/
├── schema.prisma
└── migrations/
    ├── 20240101000000_init/
    │   └── migration.sql
    ├── 20240201000000_add_view_count/
    │   └── migration.sql
    └── migration_lock.toml
```

마이그레이션 파일은 자동 생성되므로 직접 수정하지 않는다.

---

## PrismaService 사용 패턴

```typescript
// posts.service.ts
@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.post.findMany({
      include: {
        author: { select: { id: true, nickname: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: true, comments: true, attachments: true },
    });

    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');

    return this.prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }
}
```

---

## 인덱스 설계

```prisma
model Post {
  // ...
  @@index([authorId])        // 특정 사용자의 게시글 조회
  @@index([createdAt])       // 최신순 정렬
  @@index([viewCount])       // 조회순 정렬
  @@map("posts")
}

model Comment {
  // ...
  @@index([postId])          // 게시글별 댓글 조회
  @@map("comments")
}
```
