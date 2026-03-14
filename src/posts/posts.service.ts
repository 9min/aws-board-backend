import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostQueryDto, PostSortType } from './dto/post-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';

const POST_AUTHOR_SELECT = {
  author: { select: { id: true, nickname: true } },
} as const;

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
  ) {}

  async create(dto: CreatePostDto, userId: number) {
    return this.prisma.post.create({
      data: { ...dto, authorId: userId },
      include: POST_AUTHOR_SELECT,
    });
  }

  async findAll(query: PostQueryDto) {
    const limit = query.limit ?? 10;
    const take = limit + 1;

    const where: Prisma.PostWhereInput = query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { content: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const orderBy: Prisma.PostOrderByWithRelationInput =
      query.sort === PostSortType.VIEWS
        ? { viewCount: 'desc' }
        : { createdAt: 'desc' };

    if (query.page) {
      const skip = (query.page - 1) * limit;

      const [items, total] = await Promise.all([
        this.prisma.post.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: POST_AUTHOR_SELECT,
        }),
        this.prisma.post.count({ where }),
      ]);

      return {
        items,
        total,
        page: query.page,
        totalPages: Math.ceil(total / limit),
        limit,
      };
    }

    if (query.cursor) {
      where.id = { lt: query.cursor };
    }

    const posts = await this.prisma.post.findMany({
      where,
      orderBy,
      take,
      include: POST_AUTHOR_SELECT,
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return { items, nextCursor };
  }

  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    return this.prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: {
        ...POST_AUTHOR_SELECT,
        comments: {
          include: { author: { select: { id: true, nickname: true } } },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          select: { id: true, url: true, key: true, postId: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async update(id: number, dto: UpdatePostDto, userId: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('게시글을 수정할 권한이 없습니다.');
    }

    return this.prisma.post.update({
      where: { id },
      data: dto,
      include: POST_AUTHOR_SELECT,
    });
  }

  async attachFile(postId: number, key: string, userId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('파일을 첨부할 권한이 없습니다.');
    }

    return this.filesService.attachToPost(postId, key);
  }

  async removeAttachment(postId: number, attachmentId: number, userId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('첨부파일을 삭제할 권한이 없습니다.');
    }

    const attachment = await this.prisma.fileAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment || attachment.postId !== postId) {
      throw new NotFoundException('첨부파일을 찾을 수 없습니다.');
    }

    await this.filesService.deleteObjects([attachment.key]);
    await this.prisma.fileAttachment.delete({ where: { id: attachmentId } });
  }

  async remove(id: number, userId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { attachments: true },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('게시글을 삭제할 권한이 없습니다.');
    }

    if (post.attachments.length > 0) {
      await this.filesService.deleteObjects(post.attachments.map((a) => a.key));
    }

    await this.prisma.post.delete({ where: { id } });
  }
}
