import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CreatePresignedUrlDto } from './dto/create-presigned-url.dto';
import { FilesService } from './files.service';

@ApiTags('파일')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('presigned-post')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'S3 Presigned Post 발급',
    description:
      'S3에 직접 업로드하기 위한 Presigned Post 정보를 반환한다. 최대 5MB, 유효 시간 5분. 클라이언트는 반환된 url과 fields로 multipart/form-data POST 요청을 보낸다.',
  })
  @ApiResponse({
    status: 201,
    description: 'url, fields(서명 정보), key(파일 식별자) 반환',
  })
  getPresignedPost(
    @Body() dto: CreatePresignedUrlDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.filesService.getPresignedPost(dto, user.id);
  }
}
