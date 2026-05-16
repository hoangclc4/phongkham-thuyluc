import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class AdminGuard extends JwtAuthGuard {
  constructor(reflector: Reflector) {
    super(reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const baseResult = await super.canActivate(context);

    if (!baseResult) {
      return false;
    }

    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();

    if (request.user?.role !== 'admin') {
      throw new ForbiddenException('Chỉ admin mới có quyền truy cập');
    }

    return true;
  }
}
