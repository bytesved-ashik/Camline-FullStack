import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { MessageDto } from './dto/message.dto';
import { validate } from 'class-validator';
import { ChatMessageDto } from '@modules/chats/dto/message.dto';
import { UserRepository } from '@repositories/user.repository';

@Injectable()
export class SocketService {
  constructor(private readonly userRepository: UserRepository) {}

  async addOnlineUser(userId: string, clientId: string) {
    return await this.userRepository.addOnlineUser(userId, clientId);
  }

  async getUser(ids: string[]) {
    return await this.userRepository.getOnlineUsers(ids);
  }

  async disconnectUser(clientId: string) {
    return await this.userRepository.disconnectUser(clientId);
  }

  async validateMessage(client: Socket, payload: any): Promise<MessageDto> {
    const messageDto = new MessageDto();
    messageDto.message = payload.message;
    messageDto.userId = payload.userId;
    messageDto.messageType = payload.messageType;

    const errors = await validate(messageDto);

    if (errors.length > 0) {
      client.emit('error', {
        message: Object.values(errors[0].constraints)[0],
      });
      return;
    } else return messageDto;
  }

  async validateChatMessage(
    client: Socket,
    payload: any,
  ): Promise<ChatMessageDto> {
    const messageDto = new ChatMessageDto();
    messageDto.message = payload.message;

    const errors = await validate(messageDto);

    if (errors.length > 0) {
      client.emit('error', {
        message: Object.values(errors[0].constraints)[0],
      });
      return;
    } else return messageDto;
  }

  async getUserById(userId: string) {
    return await this.userRepository.getUserById(userId);
  }
}
