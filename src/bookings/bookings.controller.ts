import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUserId } from '../common/auth/current-user-id.decorator';
import { BookingsService } from './bookings.service';
import { BookingQueryDto } from './dto/booking-query.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiTags('Bookings')
@Controller('api/v1/service/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a service booking',
    description:
      'Validates the provider, category, and selected availability slot, reserves the slot atomically, creates the booking, stores an address snapshot, and creates the initial booking status history.',
  })
  @ApiCreatedResponse({
    description: 'Booking created successfully',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid booking data, provider/category combination, or slot ownership',
  })
  @ApiNotFoundResponse({
    description: 'Availability slot not found',
  })
  @ApiConflictResponse({
    description: 'Selected availability slot is no longer available',
  })
  create(@CurrentUserId() userId: string, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create({
      ...dto,
      userId,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'List bookings for a user',
    description:
      'Returns bookings belonging to the current user, ordered from newest to oldest.',
  })
  @ApiOkResponse({
    description: 'Booking list returned successfully',
  })
  @ApiBadRequestResponse({
    description: 'Missing or invalid userId',
  })
  findAll(@CurrentUserId() userId: string, @Query() _query: BookingQueryDto) {
    return this.bookingsService.findAll(userId);
  }

  @Get(':bookingId')
  @ApiOperation({
    summary: 'Get booking details',
    description:
      'Returns one booking owned by the current user, including provider, category, address snapshot, and status history.',
  })
  @ApiParam({
    name: 'bookingId',
    description: 'Booking ID',
    example: 3,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Booking details returned successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid booking ID or missing userId',
  })
  @ApiNotFoundResponse({
    description: 'Booking not found for this user',
  })
  findOne(
    @CurrentUserId() userId: string,
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @Query() _query: BookingQueryDto,
  ) {
    return this.bookingsService.findOne(bookingId, userId);
  }

  @Patch(':bookingId/cancel')
  @ApiOperation({
    summary: 'Cancel a booking',
    description:
      'Cancels a PENDING or CONFIRMED booking owned by the current user, adds a CANCELLED history entry, and releases the reserved availability slot.',
  })
  @ApiParam({
    name: 'bookingId',
    description: 'Booking ID',
    example: 3,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Booking cancelled successfully',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid booking ID, missing userId, or booking status cannot be cancelled',
  })
  @ApiNotFoundResponse({
    description: 'Booking not found for this user',
  })
  cancel(
    @CurrentUserId() userId: string,
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @Query() _query: BookingQueryDto,
  ) {
    return this.bookingsService.cancel(bookingId, userId);
  }
}
