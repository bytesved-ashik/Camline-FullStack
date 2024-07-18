import { Module, forwardRef } from '@nestjs/common';
import { ChatRepository } from '@repositories/chat.repository';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from '../../entities/message.entity';
import { Chat, ChatSchema } from '../../entities/chat.entity';
import * as paginate from 'mongoose-paginate-v2';
import { JwtService } from '@nestjs/jwt';
import { SocketGateway } from '../socket/socket.gateway';
import { SocketService } from '../socket/socket.service';
import { UserModule } from '../user/user.module';
import { SessionModule } from '@modules/session/session.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => SessionModule),
    MongooseModule.forFeatureAsync([
      {
        name: Message.name,
        useFactory: () => {
          MessageSchema.plugin(paginate);
          return MessageSchema;
        },
      },
      {
        name: Chat.name,
        useFactory: () => {
          ChatSchema.plugin(paginate);
          return ChatSchema;
        },
      },
    ]),
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatRepository,
    JwtService,
    SocketGateway,
    SocketService,
  ],
  exports: [ChatRepository, ChatService],
})
export class ChatsModule {}
