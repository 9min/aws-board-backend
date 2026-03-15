import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminService } from './admin.service';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { AdminPostQueryDto } from './dto/admin-post-query.dto';
import { AdminCommentQueryDto } from './dto/admin-comment-query.dto';

@ApiTags('관리자')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '대시보드 통계 (총 회원수, 게시글수, 댓글수)' })
  @ApiResponse({ status: 200, description: '통계 반환' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: '회원 목록 (페이지네이션, 검색)' })
  @ApiResponse({ status: 200, description: '회원 목록 반환' })
  findAllUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.findAllUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: '회원 상세 (게시글/댓글 수 포함)' })
  @ApiResponse({ status: 200, description: '회원 상세 반환' })
  @ApiResponse({ status: 404, description: '회원 없음' })
  findOneUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.findOneUser(id);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '회원 삭제 (관련 리소스 cascade)' })
  @ApiResponse({ status: 204, description: '회원 삭제 성공' })
  @ApiResponse({ status: 404, description: '회원 없음' })
  removeUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.removeUser(id);
  }

  @Get('posts')
  @ApiOperation({ summary: '게시글 목록 (페이지네이션, 검색)' })
  @ApiResponse({ status: 200, description: '게시글 목록 반환' })
  findAllPosts(@Query() query: AdminPostQueryDto) {
    return this.adminService.findAllPosts(query);
  }

  @Get('posts/:id')
  @ApiOperation({ summary: '게시글 상세 (조회수 증가 없음)' })
  @ApiResponse({ status: 200, description: '게시글 상세 반환' })
  @ApiResponse({ status: 404, description: '게시글 없음' })
  findOnePost(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.findOnePost(id);
  }

  @Delete('posts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '게시글 삭제 (소유자 확인 없음, S3 정리)' })
  @ApiResponse({ status: 204, description: '게시글 삭제 성공' })
  @ApiResponse({ status: 404, description: '게시글 없음' })
  removePost(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.removePost(id);
  }

  @Get('comments')
  @ApiOperation({ summary: '댓글 목록 (페이지네이션, postId 필터)' })
  @ApiResponse({ status: 200, description: '댓글 목록 반환' })
  findAllComments(@Query() query: AdminCommentQueryDto) {
    return this.adminService.findAllComments(query);
  }

  @Delete('comments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '댓글 삭제 (소유자 확인 없음)' })
  @ApiResponse({ status: 204, description: '댓글 삭제 성공' })
  @ApiResponse({ status: 404, description: '댓글 없음' })
  removeComment(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.removeComment(id);
  }
}
