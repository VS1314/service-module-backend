import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, Matches } from 'class-validator';

export class AvailabilityQueryDto {
  @ApiProperty({
    description: 'Date for which provider availability should be returned',
    example: '2026-09-14',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  @IsDateString(
    {
      strict: true,
    },
    {
      message: 'date must be a valid calendar date',
    },
  )
  date: string;
}
