import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AttachFileDto {
  @ApiProperty({
    example: 'uploads/1/uuid.jpg',
    description: 'S3 업로드 완료 후 반환받은 파일 키',
  })
  @IsString()
  key: string;
}
