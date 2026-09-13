import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUserId } from '../common/auth/current-user-id.decorator';
import { ChatService } from './chat.service';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { MessageHistoryQueryDto } from './dto/message-history-query.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SendVoiceMessageDto } from './dto/send-voice-message.dto';

@ApiTags('Chat')
@Controller('api/v1/service/conversations')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({
    summary: 'Create or reuse a conversation',
    description:
      'Creates a conversation between the current user and an active provider, or returns the existing conversation when the same user/provider pair already exists.',
  })
  @ApiCreatedResponse({
    description: 'Conversation created or returned successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid conversation data',
  })
  @ApiNotFoundResponse({
    description: 'Provider not found',
  })
  createConversation(
    @CurrentUserId() userId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation({
      ...dto,
      userId,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'List user conversations',
    description:
      'Returns conversations belonging to the current user with provider information and the latest message, using page-based pagination.',
  })
  @ApiOkResponse({
    description: 'Conversation list returned successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid userId or pagination parameters',
  })
  getConversations(
    @CurrentUserId() userId: string,
    @Query() query: ConversationQueryDto,
  ) {
    return this.chatService.getConversations(userId, query.page, query.limit);
  }

  @Get(':conversationId/messages')
  @ApiOperation({
    summary: 'Get conversation message history',
    description:
      'Returns messages belonging to a conversation owned by the current user using cursor-based pagination.',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'Conversation ID',
    example: 1,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Message history returned successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid conversation ID, cursor, limit, or userId',
  })
  @ApiNotFoundResponse({
    description: 'Conversation not found for this user',
  })
  getMessages(
    @CurrentUserId() userId: string,
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query() query: MessageHistoryQueryDto,
  ) {
    return this.chatService.getMessages(
      conversationId,
      userId,
      query.cursor,
      query.limit,
    );
  }

  @Post(':conversationId/messages')
  @ApiOperation({
    summary: 'Send a text message',
    description:
      'Creates a USER text message in a conversation owned by the current user and updates the conversation timestamp.',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'Conversation ID',
    example: 1,
    type: Number,
  })
  @ApiCreatedResponse({
    description: 'Text message created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid message data or conversation ID',
  })
  @ApiNotFoundResponse({
    description: 'Conversation not found for this user',
  })
  sendMessage(
    @CurrentUserId() userId: string,
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(conversationId, {
      ...dto,
      userId,
    });
  }

  @Post(':conversationId/voice-messages')
  @ApiOperation({
    summary: 'Send a voice message',
    description:
      'Creates a USER voice message in a conversation owned by the current user using the supplied media URL and duration. Voice file upload/storage is handled separately.',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'Conversation ID',
    example: 1,
    type: Number,
  })
  @ApiCreatedResponse({
    description: 'Voice message created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid voice message data or conversation ID',
  })
  @ApiNotFoundResponse({
    description: 'Conversation not found for this user',
  })
  sendVoiceMessage(
    @CurrentUserId() userId: string,
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Body() dto: SendVoiceMessageDto,
  ) {
    return this.chatService.sendVoiceMessage(conversationId, {
      ...dto,
      userId,
    });
  }
}
