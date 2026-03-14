import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches } from 'class-validator';

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
] as const;

export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

export class CreatePresignedUrlDto {
  @ApiProperty({ example: 'photo.jpg', description: '업로드할 파일명' })
  @IsString()
  @Matches(/^[\w\-. ]+$/, { message: '파일명에 허용되지 않은 문자가 포함되어 있습니다.' })
  fileName: string;

  @ApiProperty({
    example: 'image/jpeg',
    enum: ALLOWED_CONTENT_TYPES,
    description: '파일 MIME 타입',
  })
  @IsString()
  @IsIn(ALLOWED_CONTENT_TYPES, { message: '허용되지 않는 파일 형식입니다.' })
  contentType: AllowedContentType;
}
