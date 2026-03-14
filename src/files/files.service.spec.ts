import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService, S3_CLIENT } from './files.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('FilesService', () => {
  let service: FilesService;

  const mockS3Client = { send: jest.fn() };
  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        AWS_S3_BUCKET: 'test-bucket',
        AWS_REGION: 'ap-northeast-2',
      };
      return config[key];
    }),
  };
  const mockPrismaService = {
    fileAttachment: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: S3_CLIENT, useValue: mockS3Client },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPresignedUrl', () => {
    it('presignedUrl과 key를 반환한다', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue(
        'https://mock-presigned-url',
      );

      const result = await service.getPresignedUrl(
        { fileName: 'photo.jpg', contentType: 'image/jpeg' },
        1,
      );

      expect(result.presignedUrl).toBe('https://mock-presigned-url');
      expect(result.key).toMatch(/^uploads\/1\/.+\.jpg$/);
    });

    it('key는 UUID 기반으로 고유하게 생성된다', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue(
        'https://mock-presigned-url',
      );

      const result1 = await service.getPresignedUrl(
        { fileName: 'photo.jpg', contentType: 'image/jpeg' },
        1,
      );
      const result2 = await service.getPresignedUrl(
        { fileName: 'photo.jpg', contentType: 'image/jpeg' },
        1,
      );

      expect(result1.key).not.toBe(result2.key);
    });

    it('파일 확장자가 없는 경우에도 key를 생성한다', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue(
        'https://mock-presigned-url',
      );

      const result = await service.getPresignedUrl(
        { fileName: 'noextension', contentType: 'image/jpeg' },
        1,
      );

      expect(result.key).toMatch(/^uploads\/1\/.+$/);
    });

    it('S3Client에 올바른 버킷과 키로 PutObjectCommand를 호출한다', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue(
        'https://mock-presigned-url',
      );

      await service.getPresignedUrl(
        { fileName: 'photo.jpg', contentType: 'image/jpeg' },
        1,
      );

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          input: expect.objectContaining({
            Bucket: 'test-bucket',
            ContentType: 'image/jpeg',
          }),
        }),
        expect.objectContaining({ expiresIn: 300 }),
      );
    });
  });

  describe('attachToPost', () => {
    it('파일 첨부 정보를 DB에 저장하고 반환한다', async () => {
      const mockAttachment = {
        id: 1,
        postId: 1,
        key: 'uploads/1/uuid.jpg',
        url: 'https://test-bucket.s3.ap-northeast-2.amazonaws.com/uploads/1/uuid.jpg',
        createdAt: new Date(),
      };
      mockPrismaService.fileAttachment.create.mockResolvedValue(mockAttachment);

      const result = await service.attachToPost(1, 'uploads/1/uuid.jpg');

      expect(result).toEqual(mockAttachment);
      expect(mockPrismaService.fileAttachment.create).toHaveBeenCalledWith({
        data: {
          postId: 1,
          key: 'uploads/1/uuid.jpg',
          url: 'https://test-bucket.s3.ap-northeast-2.amazonaws.com/uploads/1/uuid.jpg',
        },
      });
    });
  });

  describe('deleteObjects', () => {
    it('S3에서 파일들을 삭제한다', async () => {
      mockS3Client.send.mockResolvedValue({});

      await service.deleteObjects([
        'uploads/1/file1.jpg',
        'uploads/1/file2.jpg',
      ]);

      expect(mockS3Client.send).toHaveBeenCalledTimes(2);
    });

    it('keys가 빈 배열이면 S3 호출을 하지 않는다', async () => {
      await service.deleteObjects([]);

      expect(mockS3Client.send).not.toHaveBeenCalled();
    });
  });
});
