import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string | null;
  role: Role;
  shopId?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        shopId: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Akses tidak valid.');
    }

    // Effective shopId logic:
    // - SUPER_ADMIN: pakai shopId dari JWT claim (cabang yang dipilih saat shop selection).
    //   User.shopId selalu null untuk super-admin.
    // - User lain: pakai User.shopId dari DB (source of truth, kalau admin pindahin
    //   user antar cabang, JWT claim mungkin stale tapi DB selalu fresh).
    const effectiveShopId =
      user.role === Role.SUPER_ADMIN
        ? payload.shopId ?? null
        : user.shopId ?? null;

    return {
      ...user,
      shopId: effectiveShopId,
    };
  }
}
