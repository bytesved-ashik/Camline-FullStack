import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { ConfigService } from '../../config/config.service';
import { UserService } from '@modules/user/user.service';
import { TokenService } from '@modules/token/token.service';
import { TokenModule } from '@modules/token/token.module';
import { AvailabilityService } from '@modules/availability/availability.service';
import { AvailabilityModule } from '@modules/availability/availability.module';
import { AgendaAppService } from '@utils/agenda.service';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getJwtConfig().secret,
        signOptions: { expiresIn: configService.getJwtConfig().expiresIn },
      }),
    }),
    TokenModule,
    AvailabilityModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserService,
    ConfigService,
    TokenService,
    LocalStrategy,
    JwtStrategy,
    AvailabilityService,
    AgendaAppService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
