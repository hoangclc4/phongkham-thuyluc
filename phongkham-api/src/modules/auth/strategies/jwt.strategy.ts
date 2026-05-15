import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { eq } from 'drizzle-orm';
import { Db } from '../../../database/database';
import { DB_TOKEN } from '../../../database/database.module';
import { tokenBlacklist } from '../../../database/schema/token-blacklist.schema';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const blacklisted = await this.db
      .select()
      .from(tokenBlacklist)
      .where(eq(tokenBlacklist.jti, payload.jti));

    if (blacklisted.length > 0) {
      throw new UnauthorizedException('Token đã bị thu hồi');
    }

    return payload;
  }
}
