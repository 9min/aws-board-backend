import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as CurrentUserPayload;

    const adminEmails = this.configService.get<string>('admin.emails') ?? '';
    const emailList = adminEmails
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (
      emailList.length === 0 ||
      !emailList.includes(user.email.toLowerCase())
    ) {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }

    return true;
  }
}
