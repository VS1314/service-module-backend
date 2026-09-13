import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Check application health',
    description:
      'Confirms that the API is running and the PostgreSQL database is reachable.',
  })
  @ApiOkResponse({
    description: 'Application and database are healthy',
  })
  @ApiServiceUnavailableResponse({
    description: 'Database is unavailable',
  })
  check() {
    return this.healthService.check();
  }
}
