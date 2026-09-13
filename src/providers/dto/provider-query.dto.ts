import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ProviderQueryDto {
  @ApiPropertyOptional({
    description: 'Search by provider name, service title, or category name',
    example: 'carpenter',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();

    return trimmed || undefined;
  })
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter providers by service category ID',
    example: 3,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Minimum provider rating',
    example: 4.5,
    minimum: 0,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Minimum service discount percentage',
    example: 30,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  minDiscount?: number;

  @ApiPropertyOptional({
    description: 'Provider result sorting',
    enum: ['rating_desc', 'rating_asc', 'discount_desc', 'newest'],
    default: 'rating_desc',
  })
  @IsOptional()
  @IsIn(['rating_desc', 'rating_asc', 'discount_desc', 'newest'])
  sort: 'rating_desc' | 'rating_asc' | 'discount_desc' | 'newest' =
    'rating_desc';

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of providers per page',
    example: 40,
    default: 40,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 40;
}
