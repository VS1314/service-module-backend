import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceHomeService } from './service-home.service';

@ApiTags('Service Home')
@Controller('api/v1/service/home')
export class ServiceHomeController {
  constructor(private readonly serviceHomeService: ServiceHomeService) {}

  @Get()
  @ApiOperation({
    summary: 'Get service home data',
    description:
      'Returns the data required for the Service home screen, including categories, promotions, and top services.',
  })
  @ApiOkResponse({
    description: 'Service home data returned successfully',
  })
  getHome() {
    return this.serviceHomeService.getHome();
  }
}
