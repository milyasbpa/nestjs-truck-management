import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@utils/database.service';
import { ErrorHandlerService } from '@utils/error-handler.service';

@Injectable()
export class TrucksToCOPService {
  constructor(
    private databaseService: DatabaseService,
    private errHandler: ErrorHandlerService,
  ) {}

  async completedByGeofence(): Promise<any> {
    try {
      this.errHandler.logDebug(
        'Starting Job Observation Status Truck In COP Geofence',
      );
      const result = await this.databaseService.query(`
        SELECT truck_id, status
        FROM last_truck_movement
        WHERE geofence = 'COP'
    `);

      for (const row of result) {
        const [cpQueueResult] = await this.databaseService.query(`
        SELECT status, assignment_id
        FROM cp_queue_assignments
        WHERE truck_id = ${row.truck_id}
        ORDER BY auditupdate DESC
        LIMIT 1
    `);
        if (cpQueueResult.status !== 'COMPLETED') {
          await this.databaseService.query(`
        UPDATE public.cp_queue_assignments
	      SET 
          status='COMPLETED',
          completed_by = 'GEOFENCE'::public."completed_by_enum"
	      WHERE truck_id = ${row.truck_id};
        `);
        }
      }
    } catch (error) {
      this.errHandler.logError('completedByGeofence error', error);
    }
  }
}
