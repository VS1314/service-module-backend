import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class JoinConversationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  conversationId: number;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
