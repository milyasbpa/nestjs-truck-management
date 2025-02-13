import { ExecutionContext, Injectable, createParamDecorator } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }
}

import * as jwt from 'jsonwebtoken';

export const GetAuthInfo: any = createParamDecorator(
  (_, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const { authorization }: any = request.headers;
    const authToken = authorization.replace(/bearer/gim, '').trim();

    const jwtSecret = process.env.JWT_AUTH_KEY as string;

    const result = jwt.verify(authToken, jwtSecret);
    return result;
  },
);

