import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, IsUrl, Max, Min } from 'class-validator';

export class SendVoiceMessageDto {
  @ApiProperty({
    description:
      'Temporary user identifier used for conversation ownership until authentication is integrated',
    example: 'user-chat-test',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description:
      'URL of the already-uploaded voice message file. File upload/storage integration is handled separately.',
    example: 'https://example.com/audio/message-1.mp3',
  })
  @IsUrl()
  mediaUrl: string;

  @ApiProperty({
    description: 'Voice message duration in seconds',
    example: 18,
    minimum: 1,
    maximum: 600,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(600)
  mediaDuration: number;
}
