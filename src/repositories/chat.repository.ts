import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Chat } from '@entities/chat.entity';
import { IChatModel } from '@interfaces';
import { PopulateOptions, Types } from 'mongoose';
import { Message } from '@entities/message.entity';
import { IMessageModel } from '@interfaces';
import { ChatMessageDto } from '@modules/chats/dto/message.dto';
import { SessionRepository } from './session.repository';

@Injectable()
export class ChatRepository {
  constructor(
    @InjectModel(Chat.name) private readonly chatModel: IChatModel,
    @InjectModel(Message.name) private readonly messageModel: IMessageModel,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async getUserChats(userId: string) {
    const chats = await this.chatModel
      .find({
        users: { $in: new Types.ObjectId(userId) },
      })
      .populate('users');
    return chats;
  }

  async getMessages(sessionId: string) {
    const messages = await this.messageModel
      .find({
        chatSessionId: new Types.ObjectId(sessionId),
      })
      .populate('session');
    return messages;
  }

  async getMessage(messageId: string, populate?: PopulateOptions) {
    const message = await this.messageModel
      .findById(messageId)
      .populate(populate);
    return message;
  }

  async getPreviousChatId(senderId: string, recipientId: string) {
    const ids = [new Types.ObjectId(senderId), new Types.ObjectId(recipientId)];
    const chats = await this.chatModel.findOne({
      users: { $in: ids },
    });
    return chats;
  }

  async createMessage(body: ChatMessageDto, userId: string) {
    const session = await this.sessionRepository.getSessionById(
      body.chatSessionId,
    );
    const receivers = session.attendees.map((attendee) => attendee.user);
    const message = await this.messageModel.create({
      ...body,
      senderId: userId,
      receivers: [...receivers, session.therapist],
    });
    return message;
  }

  async createChat(userId: string, therapistId: string) {
    const users = [userId, therapistId];

    // check already chats exists or not
    let chats = await this.chatModel.findOne({
      users: { $all: users },
    });

    if (!chats) {
      const createChatSession =
        await this.sessionRepository.createSessionForChat(userId, therapistId);

      chats = await this.chatModel.create({
        users: users,
        chatSessionId: createChatSession._id.toHexString(),
      });
    }

    return chats;
  }
}
