import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PostQueryDto, PostSortType } from './dto/post-query.dto';
import { PostsService } from './posts.service';

describe('PostsService', () => {
  let service: PostsService;

  const mockPrismaService = {
    post: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockPost = {
    id: 1,
    title: '테스트 제목',
    content: '테스트 내용',
    viewCount: 0,
    authorId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: { id: 1, nickname: '작성자' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('게시글을 생성하고 반환한다', async () => {
      mockPrismaService.post.create.mockResolvedValue(mockPost);

      const result = await service.create(
        { title: '테스트 제목', content: '테스트 내용' },
        1,
      );

      expect(result).toEqual(mockPost);
      expect(mockPrismaService.post.create).toHaveBeenCalledWith({
        data: { title: '테스트 제목', content: '테스트 내용', authorId: 1 },
        include: { author: { select: { id: true, nickname: true } } },
      });
    });
  });

  describe('findAll', () => {
    it('게시글 목록과 nextCursor를 반환한다', async () => {
      const posts = [mockPost, { ...mockPost, id: 2 }];
      mockPrismaService.post.findMany.mockResolvedValue(posts);

      const query: PostQueryDto = { limit: 10, sort: PostSortType.LATEST };
      const result = await service.findAll(query);

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBeNull();
    });

    it('limit+1개가 조회되면 nextCursor를 반환한다', async () => {
      const posts = Array.from({ length: 11 }, (_, i) => ({
        ...mockPost,
        id: i + 1,
      }));
      mockPrismaService.post.findMany.mockResolvedValue(posts);

      const query: PostQueryDto = { limit: 10, sort: PostSortType.LATEST };
      const result = await service.findAll(query);

      expect(result.items).toHaveLength(10);
      expect(result.nextCursor).toBe(10);
    });

    it('search 키워드가 있으면 where 조건에 포함된다', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([]);

      const query: PostQueryDto = {
        limit: 10,
        search: '검색어',
        sort: PostSortType.LATEST,
      };
      await service.findAll(query);

      const callArg = mockPrismaService.post.findMany.mock.calls[0][0] as {
        where: { OR: unknown[] };
      };
      expect(callArg.where.OR).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('게시글을 조회하고 viewCount를 1 증가시킨다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.post.update.mockResolvedValue({
        ...mockPost,
        viewCount: 1,
      });

      const result = await service.findOne(1);

      expect(result.viewCount).toBe(1);
      expect(mockPrismaService.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { viewCount: { increment: 1 } },
        }),
      );
    });

    it('존재하지 않는 게시글이면 NotFoundException을 던진다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('작성자가 게시글을 수정한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.post.update.mockResolvedValue({
        ...mockPost,
        title: '수정된 제목',
      });

      const result = await service.update(1, { title: '수정된 제목' }, 1);

      expect(result.title).toBe('수정된 제목');
    });

    it('존재하지 않는 게시글이면 NotFoundException을 던진다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(
        service.update(999, { title: '수정' }, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('타인의 게시글 수정 시 ForbiddenException을 던진다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      await expect(
        service.update(1, { title: '수정' }, 999),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('작성자가 게시글을 삭제한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.post.delete.mockResolvedValue(mockPost);

      await expect(service.remove(1, 1)).resolves.not.toThrow();
    });

    it('존재하지 않는 게시글이면 NotFoundException을 던진다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('타인의 게시글 삭제 시 ForbiddenException을 던진다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      await expect(service.remove(1, 999)).rejects.toThrow(ForbiddenException);
    });
  });
});
