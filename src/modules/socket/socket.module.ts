import { Module, forwardRef } from '@nestjs/common';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { SocketService } from './socket.service';
import { ConfigService } from '../../config/config.service';
import { UserModule } from '@modules/user/user.module';
import { SessionModule } from '@modules/session/session.module';
import { SocketGateway } from './socket.gateway';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => SessionModule),
    EventEmitterModule.forRoot(),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getJwtConfig().secret,
        signOptions: { expiresIn: configService.getJwtConfig().expiresIn },
      }),
    }),
  ],
  providers: [JwtService, SocketService, SocketGateway],
  exports: [SocketService, JwtService],
})
export class SocketModule {}
