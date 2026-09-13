import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class SendRealtimeMessageDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  conversationId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text: string;
}
