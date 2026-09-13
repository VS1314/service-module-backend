import { UseFilters } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsHttpExceptionFilter } from '../common/filters/ws-http-exception.filter';
import { isCorsOriginAllowed } from '../config/cors';
import { ChatService } from './chat.service';
import { JoinConversationDto } from './dto/join-conversation.dto';
import { SendRealtimeMessageDto } from './dto/send-realtime-message.dto';
import { SendRealtimeVoiceMessageDto } from './dto/send-realtime-voice-message.dto';

@UseFilters(WsHttpExceptionFilter)
@WebSocketGateway({
  namespace: '/service-chat',
  cors: {
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      const configuredOrigins =
        process.env.CORS_ORIGIN ?? 'http://localhost:3000';

      if (isCorsOriginAllowed(origin, configuredOrigins)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'));
    },
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('joinConversation')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinConversationDto,
  ) {
    const existingUserId = client.data.userId;

    if (existingUserId && existingUserId !== dto.userId) {
      throw new WsException('Socket user does not match');
    }

    try {
      await this.chatService.verifyConversationAccess(
        dto.conversationId,
        dto.userId,
      );

      const room = this.getConversationRoom(dto.conversationId);

      client.data.userId = dto.userId;

      await client.join(room);

      return {
        success: true,
        conversationId: dto.conversationId,
      };
    } catch {
      throw new WsException('Conversation not found');
    }
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendRealtimeMessageDto,
  ) {
    const userId = this.getSocketUserId(client);
    const room = this.verifyJoinedConversation(client, dto.conversationId);

    try {
      const message = await this.chatService.sendMessage(dto.conversationId, {
        userId,
        text: dto.text,
      });

      this.server.to(room).emit('messageCreated', message);

      return {
        success: true,
        message,
      };
    } catch {
      throw new WsException('Unable to send message');
    }
  }

  @SubscribeMessage('sendVoiceMessage')
  async sendVoiceMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendRealtimeVoiceMessageDto,
  ) {
    const userId = this.getSocketUserId(client);
    const room = this.verifyJoinedConversation(client, dto.conversationId);

    try {
      const message = await this.chatService.sendVoiceMessage(
        dto.conversationId,
        {
          userId,
          mediaUrl: dto.mediaUrl,
          mediaDuration: dto.mediaDuration,
        },
      );

      this.server.to(room).emit('messageCreated', message);

      return {
        success: true,
        message,
      };
    } catch {
      throw new WsException('Unable to send voice message');
    }
  }

  private getSocketUserId(client: Socket): string {
    const userId = client.data.userId;

    if (typeof userId !== 'string' || !userId) {
      throw new WsException('Join a conversation before sending messages');
    }

    return userId;
  }

  private verifyJoinedConversation(
    client: Socket,
    conversationId: number,
  ): string {
    const room = this.getConversationRoom(conversationId);

    if (!client.rooms.has(room)) {
      throw new WsException('Socket has not joined this conversation');
    }

    return room;
  }

  private getConversationRoom(conversationId: number) {
    return `conversation:${conversationId}`;
  }
}
