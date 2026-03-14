import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePostDto {
  @ApiPropertyOptional({ example: '수정된 제목', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: '제목을 입력해주세요.' })
  @MaxLength(100, { message: '제목은 최대 100자 이하여야 합니다.' })
  title?: string;

  @ApiPropertyOptional({ example: '수정된 내용' })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: '내용을 입력해주세요.' })
  content?: string;
}
