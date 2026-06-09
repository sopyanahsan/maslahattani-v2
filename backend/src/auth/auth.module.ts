import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AdminController } from './admin.controller';
import { AuthService } from './auth.service';
import { AdminService } from './admin.service';
import { OtpService } from './otp.service';
import { FirebaseAdminService } from './firebase-admin.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { ShopsModule } from '../shops/shops.module';

@Module({
  imports: [
    PrismaModule,
    ShopsModule, // untuk akses ShopsService.getAccessibleShopsForUser dari AuthService.login
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret',
        signOptions: {
          expiresIn: Number(configService.get('JWT_EXPIRATION', '86400')),
        },
      }),
    }),
  ],
  controllers: [AuthController, AdminController],
  providers: [AuthService, AdminService, OtpService, FirebaseAdminService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService, OtpService, FirebaseAdminService],
})
export class AuthModule {}
