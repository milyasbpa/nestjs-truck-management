import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@utils/database.service';
import { TruckMovementData } from '../dto/truck-movement.payload';
import { ManagementTruckService } from 'src/services/management_truck.service';
import { ErrorHandlerService } from '@utils/error-handler.service';

@Injectable()
export class TruckMovementUtil {
  private readonly logger = new Logger(TruckMovementUtil.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly managementTruckService: ManagementTruckService,
    @Inject(forwardRef(() => ErrorHandlerService))
    private readonly errHandler: ErrorHandlerService,
  ) {}

  async updateTruckMovementV2(data: TruckMovementData[]) {
    //Optimized with batch processing.
    try {
      const values = data.map((item) => [
        item.id,
        item.name,
        item.contractor,
        item.lat,
        item.lng,
        item.geofence,
        item.status,
        item.speed,
        item.course,
        item.gps_time,
      ]);
      const placeholders = values
        .map(
          (_, index) =>
            `($${index * 10 + 1}, $${index * 10 + 2}, $${index * 10 + 3}, $${index * 10 + 4}, $${index * 10 + 5}, $${index * 10 + 6}, $${index * 10 + 7}, $${index * 10 + 8}, $${index * 10 + 9}, $${index * 10 + 10})`,
        )
        .join(', ');
      const flatValues = values.flat();
      await this.databaseService.query(
        `INSERT INTO last_truck_movement (truck_id, nomor_lambung, contractor, lat, lng, geofence, status, speed, course, gps_time)
      VALUES ${placeholders}
      ON CONFLICT (truck_id)
      DO UPDATE SET 
        nomor_lambung = EXCLUDED.nomor_lambung,
        contractor = EXCLUDED.contractor,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        geofence = EXCLUDED.geofence,
        status = EXCLUDED.status,
        speed = EXCLUDED.speed,
        course = EXCLUDED.course,
        gps_time = EXCLUDED.gps_time
      `,
        flatValues,
      );
    } catch (error) {
      this.errHandler.logError(
        'TruckMovementUtil-updateTruckMovement2-error:',
        error,
      );
    }
  }

  async updateTruckMovement(data: TruckMovementData[]) {
    try {
      this.logger.log('Updating truck movement');
      for (const item of data) {
        // const truckType=mapTruckType(item.type);
        await this.databaseService.query(
          `INSERT INTO last_truck_movement (truck_id,nomor_lambung,contractor,lat,lng,geofence,status,speed,course,gps_time) 
              VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(truck_id) DO UPDATE SET 
              nomor_lambung=EXCLUDED.nomor_lambung,
              contractor=EXCLUDED.contractor,
              lat=EXCLUDED.lat,
              lng=EXCLUDED.lng,
              geofence=EXCLUDED.geofence,
              status=EXCLUDED.status,
              speed=EXCLUDED.speed,
              course=EXCLUDED.course,
              gps_time=EXCLUDED.gps_time 
              `,
          [
            item.id,
            item.name,
            item.contractor,
            item.lat,
            item.lng,
            item.geofence,
            item.status,
            item.speed,
            item.course,
            item.gps_time,
          ],
        );
      }
    } catch (error: any) {
      this.logger.error('Error updating truck movement:', error.message);
    }
  }
}
