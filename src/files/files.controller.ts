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

  @Post('presigned-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'S3 Presigned URL 발급',
    description:
      'S3에 직접 업로드하기 위한 Presigned URL과 파일 key를 반환한다. URL 유효 시간은 5분이다.',
  })
  @ApiResponse({
    status: 201,
    description: 'presignedUrl(PUT 요청 URL)과 key(파일 식별자) 반환',
  })
  getPresignedUrl(
    @Body() dto: CreatePresignedUrlDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.filesService.getPresignedUrl(dto, user.id);
  }
}
