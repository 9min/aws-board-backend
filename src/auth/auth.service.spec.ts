import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
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

      const createCall = mockPrismaService.user.create.mock.calls[0][0] as {
        data: { password: string };
      };
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
});
