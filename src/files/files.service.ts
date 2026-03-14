import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePresignedUrlDto } from './dto/create-presigned-url.dto';

export const S3_CLIENT = 'S3_CLIENT';

const PRESIGNED_POST_EXPIRES_IN = 300; // 5분
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class FilesService {
  constructor(
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getPresignedPost(dto: CreatePresignedUrlDto, userId: number) {
    const ext = path.extname(dto.fileName);
    const key = `uploads/${userId}/${randomUUID()}${ext}`;
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');

    const { url, fields } = await createPresignedPost(this.s3Client, {
      Bucket: bucket ?? '',
      Key: key,
      Expires: PRESIGNED_POST_EXPIRES_IN,
      Conditions: [
        ['content-length-range', 0, MAX_FILE_SIZE],
        ['eq', '$Content-Type', dto.contentType],
      ],
      Fields: {
        'Content-Type': dto.contentType,
      },
    });

    return { url, fields, key };
  }

  async attachToPost(postId: number, key: string) {
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    const region = this.configService.get<string>('AWS_REGION');
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return this.prisma.fileAttachment.create({
      data: { postId, key, url },
    });
  }

  async deleteObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    const bucket = this.configService.get<string>('AWS_S3_BUCKET');

    await Promise.all(
      keys.map((key) =>
        this.s3Client.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: key }),
        ),
      ),
    );
  }
}
