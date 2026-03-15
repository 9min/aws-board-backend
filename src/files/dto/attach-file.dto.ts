import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class AttachFileDto {
  @ApiProperty({
    example: 'uploads/1/uuid.jpg',
    description: 'S3 업로드 완료 후 반환받은 파일 키',
  })
  @IsString()
  @Matches(/^uploads\/\d+\/[\w-]+\.\w+$/, {
    message: '유효하지 않은 파일 키 형식입니다.',
  })
  key: string;
}
