import { Injectable } from '@nestjs/common';
import { ChatRepository } from '@repositories/chat.repository';
import { PopulateOptions } from 'mongoose';
import { ChatMessageDto } from './dto/message.dto';

@Injectable()
export class ChatService {
  constructor(private readonly chatRepository: ChatRepository) {}
  async getChats(userId: string) {
    const chats = await this.chatRepository.getUserChats(userId);
    return chats;
  }

  async getMessages(sessionId: string) {
    const messages = await this.chatRepository.getMessages(sessionId);
    return messages;
  }

  async getPreviousChatId(senderId: string, receiverId: string) {
    const chats = await this.chatRepository.getPreviousChatId(
      senderId,
      receiverId,
    );
    return chats;
  }

  async getMessage(messageId: string, populate?: PopulateOptions) {
    const message = await this.chatRepository.getMessage(messageId, populate);
    return message;
  }

  async sendMessage(chat: ChatMessageDto, userId: string) {
    const message = await this.chatRepository.createMessage(chat, userId);
    return message;
  }

  async createChat(userId: string, therapistId: string) {
    const chat = await this.chatRepository.createChat(userId, therapistId);
    return chat;
  }
}
