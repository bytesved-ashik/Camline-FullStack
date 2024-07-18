import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestService } from './request.service';
import { RequestRepository } from '@repositories/request.repository';
import { RequestController } from './request.controller';
import { SessionRequest, SessionRequestSchema } from '@entities/request.entity';
import { SocketGateway } from '@modules/socket/socket.gateway';
import { JwtService } from '@nestjs/jwt';
import { SocketService } from '@modules/socket/socket.service';
import { UserModule } from '@modules/user/user.module';
import * as paginate from 'mongoose-paginate-v2';
import { SessionModule } from '../session/session.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotesModule } from '@modules/notes/notes.module';
import { AgendaAppService } from '@utils/agenda.service';

@Module({
  imports: [
    WalletModule,
    MongooseModule.forFeatureAsync([
      {
        name: SessionRequest.name,
        useFactory: () => {
          SessionRequestSchema.plugin(paginate);
          return SessionRequestSchema;
        },
      },
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => SessionModule),
    forwardRef(() => WalletModule),
    forwardRef(() => NotesModule),
  ],
  controllers: [RequestController],
  providers: [
    RequestService,
    RequestRepository,
    JwtService,
    SocketGateway,
    SocketService,
    AgendaAppService,
  ],
  exports: [RequestRepository],
})
export class SessionRequestModule {}
