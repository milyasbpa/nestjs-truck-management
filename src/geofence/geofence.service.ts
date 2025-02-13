import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Geofence } from './entities/geofences.entity';
import { GetGeofenceListDTO } from './dto/geofence';

@Injectable()
export class GeofenceService {
  constructor(
    @InjectRepository(Geofence)
    private geofenceRepository: Repository<Geofence>,
  ) {}

  async getGeofenceList(payload: GetGeofenceListDTO) {
    const [data, total] = await this.geofenceRepository.findAndCount({
      skip: (payload.page - 1) * payload.limit,
      take: payload.limit,
      where: !!payload.search
        ? [{ name: ILike(`%${payload.search}%`) }]
        : undefined,
    });

    const transformedData = data.map((item) => ({
      ...item,
      id: item.geofenceId,
      geofenceId: undefined,
    }));

    return {
      data: transformedData,
      total,
      page: payload.page,
      lastPage: Math.ceil(total / payload.limit),
    };
  }
}
