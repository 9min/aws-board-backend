import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum PostSortType {
  LATEST = 'latest',
  VIEWS = 'views',
}

export class PostQueryDto {
  @ApiPropertyOptional({
    description: '커서 ID (이전 페이지의 마지막 게시글 ID)',
  })
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  cursor?: number;

  @ApiPropertyOptional({ description: '페이지당 게시글 수', default: 10 })
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: '검색 키워드 (제목+내용)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PostSortType, default: PostSortType.LATEST })
  @IsOptional()
  @IsEnum(PostSortType)
  sort?: PostSortType = PostSortType.LATEST;
}
