import { JwtService } from '@nestjs/jwt';
import { SocketService } from './socket.service';
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '../../config/config.service';
import { NOTIFICATION_TYPE } from '@enums';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { events } from '@events';
import { PingDto } from './dto/ping.dto';

const SocketOptions = {
  cors: {
    origin: '*',
  },
};

@WebSocketGateway(SocketOptions)
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly socketService: SocketService,
    private readonly configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  async handleConnection(client: Socket) {
    const token =
      client.handshake.headers.authorization ||
      client.handshake.query.authorization;

    if (!token || Array.isArray(token)) {
      client.disconnect();
      return;
    }

    try {
      const user = this.jwtService.verify(
        token,
        this.configService.getJwtConfig(),
      );
      client.data.user = user;
      await this.socketService.addOnlineUser(user.sub, client.id);
    } catch (error) {
      client.disconnect();
    }
  }

  @SubscribeMessage('ping')
  handlePing(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: PingDto,
  ) {
    this.eventEmitter.emit(events.PING_RECEIVED, payload, client.data.user.sub);
    client.emit('pong');
  }

  async handleDisconnect(client: Socket) {
    await this.socketService.disconnectUser(client.id);
  }

  emitMessage(message: NOTIFICATION_TYPE, payload: any) {
    this.server.emit(message, payload);
  }

  async sendMessageToActiveUsers(
    message: NOTIFICATION_TYPE,
    users: string[],
    payload: any,
  ) {
    const user = await this.socketService.getUser(users.map((user) => user));
    const clientIds = user.map((user) => user.clientId).filter(Boolean);
    if (!clientIds.length) return;
    this.server.to(clientIds).emit(message, payload);
  }

  async sendMessageToUser(
    message: NOTIFICATION_TYPE,
    userId: string,
    payload: any,
  ) {
    const user = await this.socketService.getUserById(userId);

    if (!user.clientId) {
      return;
    }

    this.server.to(user.clientId).emit(message, payload);
  }
}
