import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { ProviderQueryDto } from './dto/provider-query.dto';
import { ProvidersService } from './providers.service';

@ApiTags('Providers')
@Controller('api/v1/service/providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  @ApiOperation({
    summary: 'List service providers',
    description:
      'Returns providers with search, filtering, sorting, and pagination support.',
  })
  @ApiOkResponse({
    description: 'Provider list returned successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid search, filter, sort, or pagination parameters',
  })
  findAll(@Query() query: ProviderQueryDto) {
    return this.providersService.findAll(
      query.q,
      query.categoryId,
      query.minRating,
      query.minDiscount,
      query.sort,
      query.page,
      query.limit,
    );
  }

  @Get(':providerId/availability')
  @ApiOperation({
    summary: 'Get provider availability',
    description:
      'Returns active and unbooked time slots for a provider on a specific date.',
  })
  @ApiParam({
    name: 'providerId',
    description: 'Service provider ID',
    example: 1,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Provider availability returned successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid provider ID or date',
  })
  @ApiNotFoundResponse({
    description: 'Provider not found',
  })
  getAvailability(
    @Param('providerId', ParseIntPipe) providerId: number,
    @Query() query: AvailabilityQueryDto,
  ) {
    return this.providersService.getAvailability(providerId, query.date);
  }

  @Get(':providerId')
  @ApiOperation({
    summary: 'Get provider details',
    description:
      'Returns a single active provider and their active service information.',
  })
  @ApiParam({
    name: 'providerId',
    description: 'Service provider ID',
    example: 1,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Provider details returned successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid provider ID',
  })
  @ApiNotFoundResponse({
    description: 'Provider not found',
  })
  findOne(@Param('providerId', ParseIntPipe) providerId: number) {
    return this.providersService.findOne(providerId);
  }
}
