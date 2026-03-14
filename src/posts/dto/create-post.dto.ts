import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: '게시글 제목', maxLength: 100 })
  @IsString()
  @MinLength(1, { message: '제목을 입력해주세요.' })
  @MaxLength(100, { message: '제목은 최대 100자 이하여야 합니다.' })
  title: string;

  @ApiProperty({ example: '게시글 내용' })
  @IsString()
  @MinLength(1, { message: '내용을 입력해주세요.' })
  content: string;
}
