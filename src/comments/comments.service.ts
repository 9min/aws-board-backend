import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

const COMMENT_AUTHOR_SELECT = {
  author: { select: { id: true, nickname: true } },
} as const;

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(postId: number, dto: CreateCommentDto, userId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    return this.prisma.comment.create({
      data: { content: dto.content, postId, authorId: userId },
      include: COMMENT_AUTHOR_SELECT,
    });
  }

  async findAll(postId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    return this.prisma.comment.findMany({
      where: { postId },
      include: COMMENT_AUTHOR_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(
    postId: number,
    commentId: number,
    dto: UpdateCommentDto,
    userId: number,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.postId !== postId) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('댓글을 수정할 권한이 없습니다.');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content },
      include: COMMENT_AUTHOR_SELECT,
    });
  }

  async remove(postId: number, commentId: number, userId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.postId !== postId) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('댓글을 삭제할 권한이 없습니다.');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
  }
}
