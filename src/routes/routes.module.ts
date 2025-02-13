import { Module } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { RoutesController } from './routes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Routes } from './entities/routes.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Routes])],
  providers: [RoutesService],
  controllers: [RoutesController],
})
export class RoutesModule {}
