import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class BookingQueryDto {
  @ApiProperty({
    description:
      'Temporary user identifier used for booking ownership checks until authentication is integrated',
    example: 'user-booking-check',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
