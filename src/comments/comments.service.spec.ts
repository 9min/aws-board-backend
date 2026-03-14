import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  let service: CommentsService;

  const mockPrismaService = {
    post: {
      findUnique: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockPost = { id: 1, title: '테스트 게시글' };
  const mockComment = {
    id: 1,
    content: '테스트 댓글',
    postId: 1,
    authorId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: { id: 1, nickname: '작성자' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('댓글을 생성하고 반환한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.comment.create.mockResolvedValue(mockComment);

      const result = await service.create(1, { content: '테스트 댓글' }, 1);

      expect(result).toEqual(mockComment);
      expect(mockPrismaService.comment.create).toHaveBeenCalledWith({
        data: { content: '테스트 댓글', postId: 1, authorId: 1 },
        include: { author: { select: { id: true, nickname: true } } },
      });
    });

    it('존재하지 않는 게시글에 댓글 작성 시 NotFoundException을 던진다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.create(999, { content: '댓글' }, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('게시글의 댓글 목록을 반환한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.comment.findMany.mockResolvedValue([mockComment]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(1);
      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith({
        where: { postId: 1 },
        include: { author: { select: { id: true, nickname: true } } },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('존재하지 않는 게시글 조회 시 NotFoundException을 던진다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.findAll(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('작성자가 댓글을 수정한다', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);
      mockPrismaService.comment.update.mockResolvedValue({
        ...mockComment,
        content: '수정된 댓글',
      });

      const result = await service.update(1, 1, { content: '수정된 댓글' }, 1);

      expect(result.content).toBe('수정된 댓글');
    });

    it('존재하지 않는 댓글 수정 시 NotFoundException을 던진다', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(
        service.update(1, 999, { content: '수정' }, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('다른 게시글의 댓글 수정 시 NotFoundException을 던진다', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        postId: 2,
      });

      await expect(
        service.update(1, 1, { content: '수정' }, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('타인의 댓글 수정 시 ForbiddenException을 던진다', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);

      await expect(
        service.update(1, 1, { content: '수정' }, 999),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('작성자가 댓글을 삭제한다', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);
      mockPrismaService.comment.delete.mockResolvedValue(mockComment);

      await expect(service.remove(1, 1, 1)).resolves.not.toThrow();
    });

    it('존재하지 않는 댓글 삭제 시 NotFoundException을 던진다', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(service.remove(1, 999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('다른 게시글의 댓글 삭제 시 NotFoundException을 던진다', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({
        ...mockComment,
        postId: 2,
      });

      await expect(service.remove(1, 1, 1)).rejects.toThrow(NotFoundException);
    });

    it('타인의 댓글 삭제 시 ForbiddenException을 던진다', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);

      await expect(service.remove(1, 1, 999)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
