import { Module } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { RoutesController } from './routes.controller';
import { MapsModule } from '../maps/maps.module';
import { RoutesDriverService } from './routes-driver/routes-driver.service';

@Module({
  controllers: [RoutesController],
  providers: [RoutesService, RoutesDriverService],
  imports: [MapsModule]
})
export class RoutesModule { }
