import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { CreatePresignedUrlDto } from './dto/create-presigned-url.dto';

export const S3_CLIENT = 'S3_CLIENT';

const PRESIGNED_URL_EXPIRES_IN = 300; // 5분

@Injectable()
export class FilesService {
  constructor(
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
  ) {}

  async getPresignedUrl(dto: CreatePresignedUrlDto, userId: number) {
    const ext = path.extname(dto.fileName);
    const key = `uploads/${userId}/${randomUUID()}${ext}`;
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: dto.contentType,
    });

    const presignedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRES_IN,
    });

    return { presignedUrl, key };
  }
}
