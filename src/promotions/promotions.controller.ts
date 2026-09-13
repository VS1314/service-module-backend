import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';

@ApiTags('Promotions')
@Controller('api/v1/service/promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  @ApiOperation({
    summary: 'List active service promotions',
    description:
      'Returns active service promotions that are currently available for display.',
  })
  @ApiOkResponse({
    description: 'Service promotions returned successfully',
  })
  findAll() {
    return this.promotionsService.findAll();
  }
}
