import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    post: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    comment: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    fileAttachment: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockFilesService = {
    deleteObjects: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FilesService, useValue: mockFilesService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('총 회원수, 게시글수, 댓글수를 반환한다', async () => {
      mockPrismaService.user.count.mockResolvedValue(10);
      mockPrismaService.post.count.mockResolvedValue(50);
      mockPrismaService.comment.count.mockResolvedValue(200);

      const result = await service.getDashboardStats();

      expect(result).toEqual({
        totalUsers: 10,
        totalPosts: 50,
        totalComments: 200,
      });
    });
  });

  describe('findAllUsers', () => {
    it('페이지네이션된 회원 목록을 반환한다', async () => {
      const mockUsers = [
        {
          id: 1,
          email: 'a@test.com',
          nickname: '유저1',
          _count: { posts: 5, comments: 10 },
        },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await service.findAllUsers({ page: 1, limit: 20 });

      expect(result).toEqual({
        items: mockUsers,
        total: 1,
        page: 1,
        totalPages: 1,
        limit: 20,
      });
    });

    it('검색 키워드로 이메일/닉네임을 필터링한다', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.findAllUsers({ page: 1, limit: 20, search: '검색어' });

      const callArg = (
        mockPrismaService.user.findMany.mock.calls[0] as [
          { where: { OR: unknown[] } },
        ]
      )[0];
      expect(callArg.where.OR).toHaveLength(2);
    });
  });

  describe('findOneUser', () => {
    it('사용자 상세 정보를 반환한다', async () => {
      const mockUser = {
        id: 1,
        email: 'a@test.com',
        nickname: '유저1',
        _count: { posts: 5, comments: 10 },
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOneUser(1);

      expect(result).toEqual(mockUser);
    });

    it('존재하지 않는 사용자면 NotFoundException을 던진다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOneUser(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeUser', () => {
    it('사용자와 관련 리소스를 삭제한다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.fileAttachment.findMany.mockResolvedValue([
        { key: 'uploads/1/file.jpg' },
      ]);
      mockFilesService.deleteObjects.mockResolvedValue(undefined);
      mockPrismaService.$transaction.mockResolvedValue(undefined);

      await service.removeUser(1);

      expect(mockFilesService.deleteObjects).toHaveBeenCalledWith([
        'uploads/1/file.jpg',
      ]);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('첨부파일이 없으면 S3 삭제를 건너뛴다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.fileAttachment.findMany.mockResolvedValue([]);
      mockPrismaService.$transaction.mockResolvedValue(undefined);

      await service.removeUser(1);

      expect(mockFilesService.deleteObjects).not.toHaveBeenCalled();
    });

    it('존재하지 않는 사용자면 NotFoundException을 던진다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.removeUser(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllPosts', () => {
    it('페이지네이션된 게시글 목록을 반환한다', async () => {
      const mockPosts = [
        { id: 1, title: '제목', author: { id: 1, nickname: '유저1' } },
      ];
      mockPrismaService.post.findMany.mockResolvedValue(mockPosts);
      mockPrismaService.post.count.mockResolvedValue(1);

      const result = await service.findAllPosts({ page: 1, limit: 20 });

      expect(result).toEqual({
        items: mockPosts,
        total: 1,
        page: 1,
        totalPages: 1,
        limit: 20,
      });
    });

    it('검색 키워드로 제목/내용을 필터링한다', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([]);
      mockPrismaService.post.count.mockResolvedValue(0);

      await service.findAllPosts({ page: 1, limit: 20, search: '검색어' });

      const callArg = (
        mockPrismaService.post.findMany.mock.calls[0] as [
          { where: { OR: unknown[] } },
        ]
      )[0];
      expect(callArg.where.OR).toHaveLength(2);
    });
  });

  describe('findOnePost', () => {
    it('게시글 상세를 반환한다 (조회수 증가 없음)', async () => {
      const mockPost = {
        id: 1,
        title: '제목',
        viewCount: 5,
        author: { id: 1, nickname: '유저1' },
        comments: [],
        attachments: [],
      };
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      const result = await service.findOnePost(1);

      expect(result).toEqual(mockPost);
      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });

    it('존재하지 않는 게시글이면 NotFoundException을 던진다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.findOnePost(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removePost', () => {
    it('게시글과 S3 첨부파일을 삭제한다', async () => {
      const mockPost = {
        id: 1,
        attachments: [{ key: 'uploads/1/file.jpg' }],
      };
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockFilesService.deleteObjects.mockResolvedValue(undefined);
      mockPrismaService.post.delete.mockResolvedValue(mockPost);

      await service.removePost(1);

      expect(mockFilesService.deleteObjects).toHaveBeenCalledWith([
        'uploads/1/file.jpg',
      ]);
      expect(mockPrismaService.post.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('첨부파일이 없으면 S3 삭제를 건너뛴다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        id: 1,
        attachments: [],
      });
      mockPrismaService.post.delete.mockResolvedValue(undefined);

      await service.removePost(1);

      expect(mockFilesService.deleteObjects).not.toHaveBeenCalled();
    });

    it('존재하지 않는 게시글이면 NotFoundException을 던진다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.removePost(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllComments', () => {
    it('페이지네이션된 댓글 목록을 반환한다', async () => {
      const mockComments = [
        {
          id: 1,
          content: '댓글',
          author: { id: 1, nickname: '유저1' },
          post: { id: 1, title: '제목' },
        },
      ];
      mockPrismaService.comment.findMany.mockResolvedValue(mockComments);
      mockPrismaService.comment.count.mockResolvedValue(1);

      const result = await service.findAllComments({ page: 1, limit: 20 });

      expect(result).toEqual({
        items: mockComments,
        total: 1,
        page: 1,
        totalPages: 1,
        limit: 20,
      });
    });

    it('postId로 필터링한다', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue([]);
      mockPrismaService.comment.count.mockResolvedValue(0);

      await service.findAllComments({ page: 1, limit: 20, postId: 5 });

      const callArg = (
        mockPrismaService.comment.findMany.mock.calls[0] as [
          { where: { postId: number } },
        ]
      )[0];
      expect(callArg.where.postId).toBe(5);
    });
  });

  describe('removeComment', () => {
    it('댓글을 삭제한다', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.comment.delete.mockResolvedValue({ id: 1 });

      await service.removeComment(1);

      expect(mockPrismaService.comment.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('존재하지 않는 댓글이면 NotFoundException을 던진다', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(service.removeComment(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
