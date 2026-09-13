import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class BookingAddressDto {
  @ApiProperty({
    example: 'Test User',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    example: '9999999999',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiPropertyOptional({
    example: '8888888888',
  })
  @IsOptional()
  @IsString()
  alternativePhone?: string;

  @ApiProperty({
    example: '641001',
  })
  @IsString()
  @IsNotEmpty()
  pincode: string;

  @ApiProperty({
    example: 'Tamil Nadu',
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    example: 'Coimbatore',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    example: '10 Test Street',
  })
  @IsString()
  @IsNotEmpty()
  houseBuilding: string;

  @ApiProperty({
    example: 'Test Area',
  })
  @IsString()
  @IsNotEmpty()
  roadAreaColony: string;

  @ApiPropertyOptional({
    example: 'Near Test Landmark',
  })
  @IsOptional()
  @IsString()
  landmark?: string;
}

export class CreateBookingDto {
  @ApiProperty({
    description: 'Temporary user identifier until authentication is integrated',
    example: 'user-booking-check',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Selected service provider ID',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  providerId: number;

  @ApiProperty({
    description: 'Selected service category ID',
    example: 5,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId: number;

  @ApiProperty({
    description: 'Selected provider availability slot ID',
    example: 3,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  availabilityId: number;

  @ApiPropertyOptional({
    description:
      'Reference to the saved address in the main application, if available',
    example: 'addr-test-1',
  })
  @IsOptional()
  @IsString()
  sourceAddressId?: string;

  @ApiProperty({
    description:
      'Immutable address snapshot stored with the booking at creation time',
    type: BookingAddressDto,
  })
  @ValidateNested()
  @Type(() => BookingAddressDto)
  address: BookingAddressDto;
}
