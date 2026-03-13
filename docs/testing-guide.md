# 테스트 코드 가이드 (Jest + TDD)

## TDD 원칙

**Red → Green → Refactor** 사이클을 준수한다.

1. **Red**: 실패하는 테스트를 먼저 작성한다
2. **Green**: 테스트를 통과하는 최소한의 코드를 구현한다
3. **Refactor**: 코드 품질을 개선한다 (테스트는 계속 통과해야 함)

---

## 테스트 환경

- **테스트 프레임워크**: Jest 30
- **테스트 파일 패턴**: `*.spec.ts`
- **단위 테스트 위치**: 각 모듈 폴더 내 (`src/**/*.spec.ts`)
- **E2E 테스트 위치**: `test/*.e2e-spec.ts`

### 테스트 실행 명령어

```bash
pnpm test               # 전체 단위 테스트
pnpm test:watch         # watch 모드
pnpm test:cov           # 커버리지 포함
pnpm test:e2e           # E2E 테스트
```

---

## NestJS 단위 테스트 패턴

### 기본 구조: Test.createTestingModule()

```typescript
// posts.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PostsService', () => {
  let service: PostsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      post: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prisma = module.get(PrismaService);
  });

  it('서비스가 정의되어야 한다', () => {
    expect(service).toBeDefined();
  });
});
```

---

## Prisma 모킹 패턴

### PrismaService Mock 생성

```typescript
export const mockPrismaService = {
  post: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  comment: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};
```

### Prisma 모킹 사용 예시

```typescript
describe('게시글 조회', () => {
  it('게시글이 없으면 빈 배열을 반환한다', async () => {
    // Arrange
    jest.mocked(prisma.post.findMany).mockResolvedValue([]);

    // Act
    const result = await service.findAll({});

    // Assert
    expect(result).toEqual([]);
    expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
  });

  it('게시글이 존재하면 목록을 반환한다', async () => {
    // Arrange
    const mockPosts = [
      { id: 1, title: '테스트 게시글', content: '내용', viewCount: 0 },
    ];
    jest.mocked(prisma.post.findMany).mockResolvedValue(mockPosts);

    // Act
    const result = await service.findAll({});

    // Assert
    expect(result).toEqual(mockPosts);
  });
});
```

---

## TDD 예시: PostsService 게시글 작성

### Step 1 (Red): 실패하는 테스트 작성

```typescript
// posts.service.spec.ts
describe('게시글 작성', () => {
  it('인증된 사용자가 게시글을 작성하면 생성된 게시글을 반환한다', async () => {
    // Arrange
    const createDto = { title: '새 게시글', content: '내용입니다' };
    const authorId = 1;
    const expectedPost = { id: 1, ...createDto, authorId, viewCount: 0 };

    jest.mocked(prisma.post.create).mockResolvedValue(expectedPost);

    // Act
    const result = await service.create(createDto, authorId);

    // Assert
    expect(result).toEqual(expectedPost);
    expect(prisma.post.create).toHaveBeenCalledWith({
      data: { ...createDto, authorId },
    });
  });
});
```

### Step 2 (Green): 최소 구현

```typescript
// posts.service.ts
async create(createPostDto: CreatePostDto, authorId: number) {
  return this.prisma.post.create({
    data: { ...createPostDto, authorId },
  });
}
```

### Step 3 (Refactor): 코드 개선

응답 DTO 변환, 예외 처리 추가 등.

---

## PrismaService 테스트 패턴

```typescript
// prisma.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('서비스가 정의되어야 한다', () => {
    expect(service).toBeDefined();
  });

  it('onModuleInit 호출 시 DB에 연결한다', async () => {
    const connectSpy = jest
      .spyOn(service, '$connect')
      .mockResolvedValue(undefined);

    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalledTimes(1);
  });

  it('onModuleDestroy 호출 시 DB 연결을 끊는다', async () => {
    const disconnectSpy = jest
      .spyOn(service, '$disconnect')
      .mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
```

---

## 예외 처리 테스트

```typescript
it('존재하지 않는 게시글 조회 시 NotFoundException을 던진다', async () => {
  // Arrange
  jest.mocked(prisma.post.findUnique).mockResolvedValue(null);

  // Act & Assert
  await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
});

it('타인 게시글 수정 시 ForbiddenException을 던진다', async () => {
  // Arrange
  const post = { id: 1, authorId: 1, title: '제목', content: '내용' };
  jest.mocked(prisma.post.findUnique).mockResolvedValue(post);

  // Act & Assert
  await expect(service.update(1, { title: '수정' }, 999)).rejects.toThrow(
    ForbiddenException,
  );
});
```

---

## describe/it 네이밍 규칙

- `describe`: 테스트 대상을 명시한다.
- `it`: 기대 동작을 한국어로 서술한다.

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('올바른 자격 증명으로 토큰을 반환한다', () => {});
    it('잘못된 비밀번호로 UnauthorizedException을 던진다', () => {});
    it('존재하지 않는 사용자로 UnauthorizedException을 던진다', () => {});
  });
});
```

---

## Jest 주요 API

| API | 용도 |
|-----|------|
| `jest.fn()` | Mock 함수 생성 |
| `jest.mock('module')` | 모듈 전체 모킹 |
| `jest.spyOn(obj, 'method')` | 특정 메서드 감시/모킹 |
| `mockResolvedValue(val)` | async 반환값 설정 |
| `mockRejectedValue(err)` | async 에러 설정 |
| `mockReturnValue(val)` | sync 반환값 설정 |
| `toHaveBeenCalledWith(...)` | 호출 인자 검증 |
| `toHaveBeenCalledTimes(n)` | 호출 횟수 검증 |

---

## 테스트 커버리지 목표

- 전체 커버리지: **80% 이상**
- Service 레이어: **90% 이상** (핵심 비즈니스 로직)
- Controller 레이어: E2E 테스트로 커버

커버리지 확인:
```bash
pnpm test:cov
```
