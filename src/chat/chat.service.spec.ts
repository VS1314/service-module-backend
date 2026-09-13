import { jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;

  const prisma = {
    serviceProvider: {
      findUnique: jest.fn(),
    },
    conversation: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ChatService(prisma as unknown as PrismaService);
  });

  describe('createConversation', () => {
    it('creates or reuses a conversation for an active provider', async () => {
      prisma.serviceProvider.findUnique.mockResolvedValue({
        id: 1,
        isActive: true,
      });

      const conversation = {
        id: 1,
        userId: 'user-chat-test',
        providerId: 1,
      };

      prisma.conversation.upsert.mockResolvedValue(conversation);

      const result = await service.createConversation({
        userId: 'user-chat-test',
        providerId: 1,
      });

      expect(result).toEqual(conversation);

      expect(prisma.conversation.upsert).toHaveBeenCalledWith({
        where: {
          userId_providerId: {
            userId: 'user-chat-test',
            providerId: 1,
          },
        },
        update: {},
        create: {
          userId: 'user-chat-test',
          providerId: 1,
        },
        include: {
          provider: true,
        },
      });
    });

    it('rejects an inactive provider', async () => {
      prisma.serviceProvider.findUnique.mockResolvedValue({
        id: 1,
        isActive: false,
      });

      await expect(
        service.createConversation({
          userId: 'user-chat-test',
          providerId: 1,
        }),
      ).rejects.toThrow(new NotFoundException('Provider not found'));

      expect(prisma.conversation.upsert).not.toHaveBeenCalled();
    });
  });

  describe('verifyConversationAccess', () => {
    it('returns the conversation when it belongs to the user', async () => {
      const conversation = {
        id: 1,
        userId: 'user-chat-test',
        providerId: 1,
      };

      prisma.conversation.findFirst.mockResolvedValue(conversation);

      const result = await service.verifyConversationAccess(
        1,
        'user-chat-test',
      );

      expect(result).toEqual(conversation);
    });

    it('rejects access when the conversation does not belong to the user', async () => {
      prisma.conversation.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyConversationAccess(1, 'wrong-user'),
      ).rejects.toThrow(new NotFoundException('Conversation not found'));
    });
  });

  describe('getConversations', () => {
    it('returns paginated conversations', async () => {
      prisma.conversation.count.mockReturnValue(Promise.resolve(5));

      prisma.conversation.findMany.mockReturnValue(
        Promise.resolve([
          {
            id: 3,
          },
          {
            id: 2,
          },
        ]),
      );

      const result = await service.getConversations('user-chat-test', 2, 2);

      expect(prisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-chat-test',
          },
          skip: 2,
          take: 2,
        }),
      );

      expect(result).toEqual({
        data: [{ id: 3 }, { id: 2 }],
        pagination: {
          page: 2,
          limit: 2,
          total: 5,
          totalPages: 3,
        },
      });
    });
  });

  describe('getMessages', () => {
    it('returns cursor-paginated messages in chronological order', async () => {
      prisma.conversation.findFirst.mockResolvedValue({
        id: 1,
        userId: 'user-chat-test',
      });

      prisma.message.findMany.mockResolvedValue([
        { id: 9 },
        { id: 8 },
        { id: 7 },
      ]);

      const result = await service.getMessages(1, 'user-chat-test', 10, 2);

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: {
          conversationId: 1,
          id: {
            lt: 10,
          },
        },
        orderBy: {
          id: 'desc',
        },
        take: 3,
      });

      expect(result).toEqual({
        data: [{ id: 8 }, { id: 9 }],
        pagination: {
          limit: 2,
          hasMore: true,
          nextCursor: 8,
        },
      });
    });
  });

  describe('sendMessage', () => {
    it('stores text messages as USER messages and updates the conversation', async () => {
      prisma.conversation.findFirst.mockResolvedValue({
        id: 1,
        userId: 'user-chat-test',
      });

      const message = {
        id: 20,
        conversationId: 1,
        senderType: 'USER',
        type: 'TEXT',
        text: 'Hello',
      };

      prisma.message.create.mockReturnValue(Promise.resolve(message));

      prisma.conversation.update.mockReturnValue(
        Promise.resolve({
          id: 1,
        }),
      );

      const result = await service.sendMessage(1, {
        userId: 'user-chat-test',
        text: 'Hello',
      });

      expect(result).toEqual(message);

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: 1,
          senderType: 'USER',
          type: 'TEXT',
          text: 'Hello',
        },
      });

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('sendVoiceMessage', () => {
    it('stores voice messages as USER messages and updates the conversation', async () => {
      prisma.conversation.findFirst.mockResolvedValue({
        id: 1,
        userId: 'user-chat-test',
      });

      const message = {
        id: 21,
        conversationId: 1,
        senderType: 'USER',
        type: 'VOICE',
        mediaUrl: 'https://example.com/audio/test.mp3',
        mediaDuration: 20,
      };

      prisma.message.create.mockReturnValue(Promise.resolve(message));

      prisma.conversation.update.mockReturnValue(
        Promise.resolve({
          id: 1,
        }),
      );

      const result = await service.sendVoiceMessage(1, {
        userId: 'user-chat-test',
        mediaUrl: 'https://example.com/audio/test.mp3',
        mediaDuration: 20,
      });

      expect(result).toEqual(message);

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: 1,
          senderType: 'USER',
          type: 'VOICE',
          mediaUrl: 'https://example.com/audio/test.mp3',
          mediaDuration: 20,
        },
      });
    });
  });
});
