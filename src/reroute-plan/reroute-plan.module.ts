import { Module } from '@nestjs/common';
import { ReroutePlanService } from './reroute-plan.service';
import { ReroutePlanController } from './reroute-plan.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReroutePlan } from './entities/rerouteplans.entity';

@Module({
  imports:[TypeOrmModule.forFeature([ReroutePlan])],
  providers: [ReroutePlanService],
  controllers: [ReroutePlanController]
})
export class ReroutePlanModule {}
