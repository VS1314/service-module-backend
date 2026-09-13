import { jest } from '@jest/globals';
import { WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  const chatService = {
    verifyConversationAccess: jest.fn(),
    sendMessage: jest.fn(),
    sendVoiceMessage: jest.fn(),
  };

  const emit = jest.fn();
  const to = jest.fn(() => ({
    emit,
  }));

  beforeEach(() => {
    jest.clearAllMocks();

    gateway = new ChatGateway(chatService as unknown as ChatService);

    gateway.server = {
      to,
    } as unknown as Server;
  });

  function createSocket(userId?: string, rooms: string[] = []): Socket {
    return {
      data: userId
        ? {
            userId,
          }
        : {},
      rooms: new Set(rooms),
      join: jest.fn(async () => undefined),
    } as unknown as Socket;
  }

  describe('joinConversation', () => {
    it('verifies access, locks the socket user, and joins the room', async () => {
      const client = createSocket();

      chatService.verifyConversationAccess.mockResolvedValue({
        id: 1,
      });

      const result = await gateway.joinConversation(client, {
        conversationId: 1,
        userId: 'user-chat-test',
      });

      expect(chatService.verifyConversationAccess).toHaveBeenCalledWith(
        1,
        'user-chat-test',
      );

      expect(client.data.userId).toBe('user-chat-test');

      expect(client.join).toHaveBeenCalledWith('conversation:1');

      expect(result).toEqual({
        success: true,
        conversationId: 1,
      });
    });

    it('rejects changing the user identity on an existing socket', async () => {
      const client = createSocket('user-one');

      await expect(
        gateway.joinConversation(client, {
          conversationId: 1,
          userId: 'user-two',
        }),
      ).rejects.toThrow(new WsException('Socket user does not match'));

      expect(chatService.verifyConversationAccess).not.toHaveBeenCalled();
    });

    it('converts inaccessible conversations to a websocket error', async () => {
      const client = createSocket();

      chatService.verifyConversationAccess.mockRejectedValue(
        new Error('not found'),
      );

      await expect(
        gateway.joinConversation(client, {
          conversationId: 99,
          userId: 'user-chat-test',
        }),
      ).rejects.toThrow(new WsException('Conversation not found'));
    });
  });

  describe('sendMessage', () => {
    it('requires the socket to join before sending', async () => {
      const client = createSocket();

      await expect(
        gateway.sendMessage(client, {
          conversationId: 1,
          text: 'Hello',
        }),
      ).rejects.toThrow(
        new WsException('Join a conversation before sending messages'),
      );

      expect(chatService.sendMessage).not.toHaveBeenCalled();
    });

    it('persists and broadcasts a text message after joining', async () => {
      const client = createSocket('user-chat-test', ['conversation:1']);

      const message = {
        id: 20,
        conversationId: 1,
        type: 'TEXT',
        text: 'Hello',
      };

      chatService.sendMessage.mockResolvedValue(message);

      const result = await gateway.sendMessage(client, {
        conversationId: 1,
        text: 'Hello',
      });

      expect(chatService.sendMessage).toHaveBeenCalledWith(1, {
        userId: 'user-chat-test',
        text: 'Hello',
      });

      expect(to).toHaveBeenCalledWith('conversation:1');

      expect(emit).toHaveBeenCalledWith('messageCreated', message);

      expect(result).toEqual({
        success: true,
        message,
      });
    });

    it('rejects sending to a conversation room the socket has not joined', async () => {
      const client = createSocket('user-chat-test', ['conversation:2']);

      await expect(
        gateway.sendMessage(client, {
          conversationId: 1,
          text: 'Hello',
        }),
      ).rejects.toThrow(
        new WsException('Socket has not joined this conversation'),
      );

      expect(chatService.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('sendVoiceMessage', () => {
    it('persists and broadcasts a voice message after joining', async () => {
      const client = createSocket('user-chat-test', ['conversation:1']);

      const message = {
        id: 21,
        conversationId: 1,
        type: 'VOICE',
        mediaUrl: 'https://example.com/audio/test.mp3',
        mediaDuration: 20,
      };

      chatService.sendVoiceMessage.mockResolvedValue(message);

      const result = await gateway.sendVoiceMessage(client, {
        conversationId: 1,
        mediaUrl: 'https://example.com/audio/test.mp3',
        mediaDuration: 20,
      });

      expect(chatService.sendVoiceMessage).toHaveBeenCalledWith(1, {
        userId: 'user-chat-test',
        mediaUrl: 'https://example.com/audio/test.mp3',
        mediaDuration: 20,
      });

      expect(emit).toHaveBeenCalledWith('messageCreated', message);

      expect(result).toEqual({
        success: true,
        message,
      });
    });
  });
});
