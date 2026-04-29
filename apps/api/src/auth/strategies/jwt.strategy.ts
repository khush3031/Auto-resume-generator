import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { getJwtSecret } from '../../common/security.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(
        config.get<string>('JWT_ACCESS_SECRET'),
        config.get<string>('JWT_SECRET'),
        'JWT access secret',
      ),
    });
  }

  async validate(payload: any) {
    return {
      sub: payload.sub,
      email: payload.email
    };
  }
}
