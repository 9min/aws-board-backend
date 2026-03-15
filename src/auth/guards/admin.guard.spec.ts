import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let configService: ConfigService;

  const createMockContext = (email: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: 1, email } }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminGuard,
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('관리자 이메일이면 통과한다', () => {
    jest.spyOn(configService, 'get').mockReturnValue('admin@test.com');
    const context = createMockContext('admin@test.com');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('여러 관리자 이메일 중 포함되면 통과한다', () => {
    jest
      .spyOn(configService, 'get')
      .mockReturnValue('admin1@test.com, admin2@test.com');
    const context = createMockContext('admin2@test.com');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('대소문자를 무시하고 비교한다', () => {
    jest.spyOn(configService, 'get').mockReturnValue('Admin@Test.com');
    const context = createMockContext('admin@test.com');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('공백을 무시하고 비교한다', () => {
    jest
      .spyOn(configService, 'get')
      .mockReturnValue('  admin@test.com  , other@test.com  ');
    const context = createMockContext('admin@test.com');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('관리자 이메일이 아니면 ForbiddenException을 던진다', () => {
    jest.spyOn(configService, 'get').mockReturnValue('admin@test.com');
    const context = createMockContext('user@test.com');

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('ADMIN_EMAILS 미설정 시 ForbiddenException을 던진다', () => {
    jest.spyOn(configService, 'get').mockReturnValue(undefined);
    const context = createMockContext('admin@test.com');

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('ADMIN_EMAILS가 빈 문자열이면 ForbiddenException을 던진다', () => {
    jest.spyOn(configService, 'get').mockReturnValue('');
    const context = createMockContext('admin@test.com');

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
