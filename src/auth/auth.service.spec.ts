import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let configService: ConfigService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      nickname: '테스트유저',
    };

    it('회원가입 성공 시 사용자 정보(비밀번호 제외)를 반환한다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 1,
        email: registerDto.email,
        nickname: registerDto.nickname,
        createdAt: new Date(),
      });

      const result = await service.register(registerDto);

      expect(result).toEqual({
        id: 1,
        email: registerDto.email,
        nickname: registerDto.nickname,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        createdAt: expect.any(Date),
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });

    it('이미 존재하는 이메일이면 ConflictException을 던진다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 1,
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('비밀번호는 bcrypt로 해시되어 저장된다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 1,
        email: registerDto.email,
        nickname: registerDto.nickname,
        createdAt: new Date(),
      });

      await service.register(registerDto);

      const calls = mockPrismaService.user.create.mock
        .calls as unknown as Array<[{ data: { password: string } }]>;
      const createCall = calls[0][0];
      const savedPassword = createCall.data.password;
      const isHashed = await bcrypt.compare(
        registerDto.password,
        savedPassword,
      );
      expect(isHashed).toBe(true);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('로그인 성공 시 accessToken을 반환한다', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 1,
        email: loginDto.email,
        password: hashedPassword,
        nickname: '테스트유저',
      });
      mockJwtService.sign.mockReturnValue('mock-access-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({ accessToken: 'mock-access-token' });
    });

    it('존재하지 않는 이메일이면 UnauthorizedException을 던진다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('비밀번호가 틀리면 UnauthorizedException을 던진다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 1,
        email: loginDto.email,
        password: await bcrypt.hash('wrongpassword', 10),
        nickname: '테스트유저',
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getMe', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      nickname: '테스트유저',
      createdAt: new Date(),
    };

    it('사용자 정보와 isAdmin을 반환한다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(configService, 'get').mockReturnValue('test@example.com');

      const result = await service.getMe(1, 'test@example.com');

      expect(result).toEqual({
        ...mockUser,
        isAdmin: true,
      });
    });

    it('관리자 이메일이 아니면 isAdmin이 false이다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(configService, 'get').mockReturnValue('admin@other.com');

      const result = await service.getMe(1, 'test@example.com');

      expect(result).toEqual({
        ...mockUser,
        isAdmin: false,
      });
    });

    it('ADMIN_EMAILS 미설정 시 isAdmin이 false이다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      const result = await service.getMe(1, 'test@example.com');

      expect(result).toEqual({
        ...mockUser,
        isAdmin: false,
      });
    });

    it('존재하지 않는 사용자면 NotFoundException을 던진다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe(999, 'x@test.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
