import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ example: '수정된 댓글 내용입니다.' })
  @IsString()
  @MinLength(1, { message: '댓글 내용을 입력해주세요.' })
  @MaxLength(500, { message: '댓글은 최대 500자 이하여야 합니다.' })
  content: string;
}
