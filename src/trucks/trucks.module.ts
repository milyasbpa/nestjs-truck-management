import { Module } from '@nestjs/common';
import { TrucksService } from './trucks.service';
import { TrucksController } from './trucks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trucks } from './entities/trucks.entity';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';
import { VehiclesService } from 'src/vehicles/vehicles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trucks])],
  providers: [
    TrucksService,
    ErrorHandlerService,
    CustomLogger,
    VehiclesService,
  ],
  controllers: [TrucksController],
  //exports: [TrucksService],
})
export class TrucksModule {}
