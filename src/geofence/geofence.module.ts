import { forwardRef, Module } from '@nestjs/common';
import { GeofenceController } from './geofence.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeofenceService } from './geofence.service';
import { CustomCacheModule } from '@utils/castom-cache.module';
import { Geofence } from './entities/geofences.entity';

@Module({
  imports: [
    forwardRef(() => GeofenceModule),
    TypeOrmModule.forFeature([Geofence]),
    forwardRef(() => CustomCacheModule),
  ],
  providers: [GeofenceService],
  exports: [GeofenceService],
  controllers: [GeofenceController],
})
export class GeofenceModule {}
