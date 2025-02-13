import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly errHandler: ErrorHandlerService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_AUTH_KEY,
    });
  }

  validate(payload: any) {
    this.errHandler.logDebug('Inside AuthController validate');
    return payload;
  }
}
