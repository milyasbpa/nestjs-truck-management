import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GeofenceService } from './geofence.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('geofence')
export class GeofenceController {
  constructor(private readonly geofenceService: GeofenceService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/list')
  getGeofenceList(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
  ) {
    return this.geofenceService.getGeofenceList({
      page: page ?? 1,
      limit: limit ?? 5,
      search: search,
    });
  }
}
