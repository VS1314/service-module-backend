import { Module } from '@nestjs/common';
import { ServiceHomeController } from './service-home.controller';
import { ServiceHomeService } from './service-home.service';

@Module({
  controllers: [ServiceHomeController],
  providers: [ServiceHomeService],
})
export class ServiceHomeModule {}
