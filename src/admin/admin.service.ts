import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { AdminPostQueryDto } from './dto/admin-post-query.dto';
import { AdminCommentQueryDto } from './dto/admin-comment-query.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
  ) {}

  async getDashboardStats() {
    const [totalUsers, totalPosts, totalComments] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count(),
      this.prisma.comment.count(),
    ]);

    return { totalUsers, totalPosts, totalComments };
  }

  async findAllUsers(query: AdminUserQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: 'insensitive' } },
            { nickname: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          nickname: true,
          createdAt: true,
          _count: { select: { posts: true, comments: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  }

  async findOneUser(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { posts: true, comments: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  async removeUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 사용자의 모든 게시글 첨부파일 S3 키 수집
    const attachments = await this.prisma.fileAttachment.findMany({
      where: { post: { authorId: id } },
      select: { key: true },
    });

    // S3 파일 삭제
    if (attachments.length > 0) {
      await this.filesService.deleteObjects(attachments.map((a) => a.key));
    }

    // 트랜잭션: 댓글(타인 게시글) → 게시글(cascade로 댓글/첨부파일 DB 삭제) → 사용자
    await this.prisma.$transaction([
      this.prisma.comment.deleteMany({ where: { authorId: id } }),
      this.prisma.post.deleteMany({ where: { authorId: id } }),
      this.prisma.user.delete({ where: { id } }),
    ]);
  }

  async findAllPosts(query: AdminPostQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { content: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, nickname: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  }

  async findOnePost(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, nickname: true } },
        comments: {
          include: { author: { select: { id: true, nickname: true } } },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          select: {
            id: true,
            url: true,
            key: true,
            postId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    return post;
  }

  async removePost(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { attachments: true },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (post.attachments.length > 0) {
      await this.filesService.deleteObjects(post.attachments.map((a) => a.key));
    }

    await this.prisma.post.delete({ where: { id } });
  }

  async findAllComments(query: AdminCommentQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CommentWhereInput = query.postId
      ? { postId: query.postId }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, nickname: true } },
          post: { select: { id: true, title: true } },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  }

  async removeComment(id: number) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    await this.prisma.comment.delete({ where: { id } });
  }
}
