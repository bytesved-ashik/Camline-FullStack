import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from '@entities/session.entity';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { SessionRepository } from '@repositories/session.repository';
import { WalletModule } from '@modules/wallet/wallet.module';
import { SocketModule } from '../socket/socket.module';
import { SocketGateway } from '../socket/socket.gateway';
import * as paginate from 'mongoose-paginate-v2';
import toJSON from '@entities/plugins/toJSON.plugin';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserModule } from '@modules/user/user.module';
import { SessionRequest, SessionRequestSchema } from '@entities/request.entity';
import { HttpModule } from '@nestjs/axios';
import { Notes, NotesSchema } from '@entities/notes.entity';

@Module({
  imports: [
    forwardRef(() => WalletModule),
    forwardRef(() => SocketModule),
    forwardRef(() => UserModule),
    HttpModule,
    EventEmitterModule.forRoot(),
    MongooseModule.forFeatureAsync([
      {
        name: Session.name,
        useFactory: () => {
          SessionSchema.plugin(toJSON);
          SessionSchema.plugin(paginate);
          return SessionSchema;
        },
      },
      {
        name: SessionRequest.name,
        useFactory: () => {
          return SessionRequestSchema;
        },
      },
      {
        name: Notes.name,
        useFactory: () => {
          return NotesSchema;
        },
      },
    ]),
  ],
  controllers: [SessionController],
  providers: [SessionService, SessionRepository, SocketGateway],
  exports: [SessionService, SessionRepository],
})
export class SessionModule {}
