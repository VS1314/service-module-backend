import { Type } from 'class-transformer';
import { IsInt, IsUrl, Max, Min } from 'class-validator';

export class SendRealtimeVoiceMessageDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  conversationId: number;

  @IsUrl()
  mediaUrl: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(600)
  mediaDuration: number;
}
