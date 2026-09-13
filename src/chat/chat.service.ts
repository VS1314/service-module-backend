import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SendVoiceMessageDto } from './dto/send-voice-message.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(dto: CreateConversationDto) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: {
        id: dto.providerId,
      },
    });

    if (!provider || !provider.isActive) {
      throw new NotFoundException('Provider not found');
    }

    return this.prisma.conversation.upsert({
      where: {
        userId_providerId: {
          userId: dto.userId,
          providerId: dto.providerId,
        },
      },
      update: {},
      create: {
        userId: dto.userId,
        providerId: dto.providerId,
      },
      include: {
        provider: true,
      },
    });
  }

  async verifyConversationAccess(conversationId: number, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async getConversations(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [total, conversations] = await this.prisma.$transaction([
      this.prisma.conversation.count({
        where: {
          userId,
        },
      }),
      this.prisma.conversation.findMany({
        where: {
          userId,
        },
        include: {
          provider: true,
          messages: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: conversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMessages(
    conversationId: number,
    userId: string,
    cursor: number | undefined,
    limit: number,
  ) {
    await this.verifyConversationAccess(conversationId, userId);

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        ...(cursor
          ? {
              id: {
                lt: cursor,
              },
            }
          : {}),
      },
      orderBy: {
        id: 'desc',
      },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;

    if (hasMore) {
      messages.pop();
    }

    const nextCursor =
      hasMore && messages.length > 0 ? messages[messages.length - 1].id : null;

    messages.reverse();

    return {
      data: messages,
      pagination: {
        limit,
        hasMore,
        nextCursor,
      },
    };
  }

  async sendMessage(conversationId: number, dto: SendMessageDto) {
    await this.verifyConversationAccess(conversationId, dto.userId);

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          senderType: 'USER',
          type: 'TEXT',
          text: dto.text,
        },
      }),
      this.prisma.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          updatedAt: new Date(),
        },
      }),
    ]);

    return message;
  }

  async sendVoiceMessage(conversationId: number, dto: SendVoiceMessageDto) {
    await this.verifyConversationAccess(conversationId, dto.userId);

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          senderType: 'USER',
          type: 'VOICE',
          mediaUrl: dto.mediaUrl,
          mediaDuration: dto.mediaDuration,
        },
      }),
      this.prisma.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          updatedAt: new Date(),
        },
      }),
    ]);

    return message;
  }
}
