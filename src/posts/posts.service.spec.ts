import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
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

  const mockFilesService = {
    attachToPost: jest.fn(),
    deleteObjects: jest.fn(),
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
    attachments: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FilesService, useValue: mockFilesService },
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

      const callArg = (
        mockPrismaService.post.findMany.mock.calls[0] as [
          { where: { OR: unknown[] } },
        ]
      )[0];
      expect(callArg.where.OR).toBeDefined();
    });
  });

  describe('findAll - offset 페이지네이션', () => {
    it('page=1 요청 시 total, totalPages, page, limit을 반환한다', async () => {
      const posts = Array.from({ length: 10 }, (_, i) => ({
        ...mockPost,
        id: i + 1,
      }));
      mockPrismaService.post.findMany.mockResolvedValue(posts);
      mockPrismaService.post.count.mockResolvedValue(95);

      const query: PostQueryDto = {
        page: 1,
        limit: 10,
        sort: PostSortType.LATEST,
      };
      const result = await service.findAll(query);

      expect(result).toEqual({
        items: posts,
        total: 95,
        page: 1,
        totalPages: 10,
        limit: 10,
      });
      expect(mockPrismaService.post.count).toHaveBeenCalledTimes(1);
    });

    it('마지막 페이지에서 totalPages가 정확하다', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([mockPost]);
      mockPrismaService.post.count.mockResolvedValue(21);

      const query: PostQueryDto = {
        page: 3,
        limit: 10,
        sort: PostSortType.LATEST,
      };
      const result = await service.findAll(query);

      expect(result).toMatchObject({ page: 3, totalPages: 3, total: 21 });
    });

    it('search와 함께 page를 사용할 수 있다', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([mockPost]);
      mockPrismaService.post.count.mockResolvedValue(5);

      const query: PostQueryDto = {
        page: 1,
        limit: 10,
        search: '검색어',
        sort: PostSortType.LATEST,
      };
      const result = await service.findAll(query);

      expect(result).toMatchObject({ total: 5, totalPages: 1 });
      const callArg = (
        mockPrismaService.post.findMany.mock.calls[0] as [
          { where: { OR: unknown[] } },
        ]
      )[0];
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

      await expect(service.update(999, { title: '수정' }, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('타인의 게시글 수정 시 ForbiddenException을 던진다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      await expect(service.update(1, { title: '수정' }, 999)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('attachFile', () => {
    const mockAttachment = {
      id: 1,
      postId: 1,
      key: 'uploads/1/uuid.jpg',
      url: 'https://bucket.s3.ap-northeast-2.amazonaws.com/uploads/1/uuid.jpg',
      createdAt: new Date(),
    };

    it('작성자가 게시글에 파일을 첨부한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockFilesService.attachToPost.mockResolvedValue(mockAttachment);

      const result = await service.attachFile(1, 'uploads/1/uuid.jpg', 1);

      expect(result).toEqual(mockAttachment);
      expect(mockFilesService.attachToPost).toHaveBeenCalledWith(
        1,
        'uploads/1/uuid.jpg',
      );
    });

    it('존재하지 않는 게시글이면 NotFoundException을 던진다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(
        service.attachFile(999, 'uploads/1/uuid.jpg', 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('타인의 게시글에 파일 첨부 시 ForbiddenException을 던진다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      await expect(
        service.attachFile(1, 'uploads/1/uuid.jpg', 999),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeAttachment', () => {
    const mockAttachment = {
      id: 2,
      postId: 1,
      key: 'uploads/1/uuid.jpg',
      url: 'https://bucket.s3.ap-northeast-2.amazonaws.com/uploads/1/uuid.jpg',
      createdAt: new Date(),
    };

    it('작성자가 첨부파일을 삭제하면 S3에서도 삭제된다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      (
        mockPrismaService as unknown as {
          fileAttachment: { findUnique: jest.Mock; delete: jest.Mock };
        }
      ).fileAttachment = {
        findUnique: jest.fn().mockResolvedValue(mockAttachment),
        delete: jest.fn().mockResolvedValue(mockAttachment),
      };
      mockFilesService.deleteObjects.mockResolvedValue(undefined);

      await expect(service.removeAttachment(1, 2, 1)).resolves.not.toThrow();
      expect(mockFilesService.deleteObjects).toHaveBeenCalledWith([
        'uploads/1/uuid.jpg',
      ]);
    });

    it('게시글이 없으면 NotFoundException을 던진다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.removeAttachment(999, 2, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('타인의 게시글 첨부파일 삭제 시 ForbiddenException을 던진다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      await expect(service.removeAttachment(1, 2, 999)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('첨부파일이 없으면 NotFoundException을 던진다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      (
        mockPrismaService as unknown as {
          fileAttachment: { findUnique: jest.Mock };
        }
      ).fileAttachment = {
        findUnique: jest.fn().mockResolvedValue(null),
      };

      await expect(service.removeAttachment(1, 999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('작성자가 첨부 파일 없는 게시글을 삭제한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.post.delete.mockResolvedValue(mockPost);

      await expect(service.remove(1, 1)).resolves.not.toThrow();
      expect(mockFilesService.deleteObjects).not.toHaveBeenCalled();
    });

    it('첨부 파일이 있으면 S3 파일도 함께 삭제한다', async () => {
      const postWithAttachments = {
        ...mockPost,
        attachments: [
          { id: 1, key: 'uploads/1/file1.jpg' },
          { id: 2, key: 'uploads/1/file2.jpg' },
        ],
      };
      mockPrismaService.post.findUnique.mockResolvedValue(postWithAttachments);
      mockPrismaService.post.delete.mockResolvedValue(postWithAttachments);
      mockFilesService.deleteObjects.mockResolvedValue(undefined);

      await service.remove(1, 1);

      expect(mockFilesService.deleteObjects).toHaveBeenCalledWith([
        'uploads/1/file1.jpg',
        'uploads/1/file2.jpg',
      ]);
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
