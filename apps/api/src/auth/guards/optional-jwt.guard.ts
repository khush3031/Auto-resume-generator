import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err) {
      throw err;
    }
    return user || undefined;
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const hasAuthHeader = Boolean(request.headers.authorization);
    if (!hasAuthHeader) {
      return true;
    }
    return super.canActivate(context) as boolean | Promise<boolean>;
  }
}
