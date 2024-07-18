import {
  Controller,
  UseGuards,
  Get,
  Req,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IRequest } from '@interfaces';
import { JwtAuthGuard } from '@classes/jwt-auth.guard';
import { ChatService } from './chat.service';
import { ChatMessageDto } from './dto/message.dto';
import { SocketGateway } from '../socket/socket.gateway';
import { NOTIFICATION_TYPE, ROLE } from '@enums';
import { GetChatSessionIdDto } from './dto/get-chat-session-id.dto';

@ApiTags('Chats')
@ApiBearerAuth()
@Controller('chats')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly socketGateway: SocketGateway,
  ) {}
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({
    description: 'Get all chats of user',
  })
  async getChats(@Req() req: IRequest) {
    const chats = await this.chatService.getChats(req.user._id);
    return chats;
  }

  @UseGuards(JwtAuthGuard)
  @Get('messages/:sessionId')
  @ApiOperation({
    description: 'Get messages of a session',
  })
  async getMessages(@Param('sessionId') sessionId: string) {
    const messages = await this.chatService.getMessages(sessionId);
    return messages;
  }

  @UseGuards(JwtAuthGuard)
  @Post('/send-message')
  @ApiOperation({
    description: 'send message to a specific session',
  })
  async createChat(@Body() body: ChatMessageDto, @Req() req: IRequest) {
    const createdChat = await this.chatService.sendMessage(
      body,
      req.user._id.toHexString(),
    );

    const chat = await this.chatService.getMessage(createdChat._id, {
      path: 'session',
    });

    const ids = chat.receivers.map((receiver) => receiver);
    this.socketGateway.sendMessageToActiveUsers(
      NOTIFICATION_TYPE.CHAT,
      [...ids, req.user._id.toHexString()],
      chat,
    );
    return chat;
  }

  @UseGuards(JwtAuthGuard)
  @Post('/get-chat-session')
  @ApiOperation({
    description: 'Get chat session id for send messages',
  })
  async getChatSessionId(
    @Req() req: IRequest,
    @Body() body: GetChatSessionIdDto,
  ) {
    const { receiverId } = body;
    let therapistId = receiverId;
    let userId = req.user._id.toHexString();

    if (req.user.roles.includes(ROLE.THERAPIST)) {
      therapistId = req.user._id.toHexString();
      userId = receiverId;
    }

    const chat = await this.chatService.createChat(userId, therapistId);
    return chat;
  }
}
