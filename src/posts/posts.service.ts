import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostQueryDto, PostSortType } from './dto/post-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';

const POST_AUTHOR_SELECT = {
  author: { select: { id: true, nickname: true } },
} as const;

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

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

    if (query.cursor) {
      where.id = { lt: query.cursor };
    }

    const orderBy: Prisma.PostOrderByWithRelationInput =
      query.sort === PostSortType.VIEWS
        ? { viewCount: 'desc' }
        : { createdAt: 'desc' };

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

  async remove(id: number, userId: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('게시글을 삭제할 권한이 없습니다.');
    }

    await this.prisma.post.delete({ where: { id } });
  }
}
