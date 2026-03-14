import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { AuthModule } from '../auth/auth.module';
import { FilesController } from './files.controller';
import { FilesService, S3_CLIENT } from './files.service';

@Module({
  imports: [AuthModule, ConfigModule],
  controllers: [FilesController],
  providers: [
    FilesService,
    {
      provide: S3_CLIENT,
      useFactory: (configService: ConfigService) =>
        new S3Client({
          region: configService.get<string>('AWS_REGION') ?? 'ap-northeast-2',
          credentials: {
            accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID') ?? '',
            secretAccessKey:
              configService.get<string>('AWS_SECRET_ACCESS_KEY') ?? '',
          },
        }),
      inject: [ConfigService],
    },
  ],
})
export class FilesModule {}
