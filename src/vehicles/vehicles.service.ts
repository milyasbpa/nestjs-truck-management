import { DatabaseService } from '@utils/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { numberToBoolean } from '@utils/functions.service';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { logger } from '@utils/logger';

@Injectable()
export class VehiclesService {
  private icount = 0;
  constructor(
    private readonly databaseService: DatabaseService,
    private configService: ConfigService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}
  async fetchAndInsertTrucks(page: number) {
    const API_URL = this.configService.get<string>('BASE_API_URL_FAMOUS');
    let nomor_lambung: string;
    try {
      // Request data from API
      this.icount = page === 1 ? 0 : this.icount;
      const API_AUTH = this.configService.get<string>('X_API_KEY_FAMOUS');
      const response = await axios.get(
        `${API_URL}/api/v2/integration/sharing/trucks`,
        {
          params: {
            page: page,
            limit: 1000,
          },
          headers: {
            'x-api-key': API_AUTH,
            'Content-Type': 'application/json',
          },
        },
      );
      const data = response.data.items;
      const totalItems = response.data.meta.totalItems;
      this.errorHandler.logDebug(totalItems);
      for (const item of data) {
        await this.setSaveTruck(item);
        this.icount++;
      }
      page++;
      if (this.icount < totalItems) {
        await this.fetchAndInsertTrucks(page);
      }
    } catch (error) {
      this.errorHandler.logError("Nomor lambung: %s",nomor_lambung);
      this.errorHandler.logError(
        `Problem import API ${API_URL}/api/v2/integration/sharing/trucks`,
        error,
      );
      this.errorHandler.saveLogToDB(
        'Job-ApiGetVehicles',
        'import',
        'error',
         error,
         null,
      );
    }
    return 'done';
  }

  async fetchAndInsertLastTrucksMovement() {
    this.errorHandler.logDebug('Starting get last movement truck from famous')
    return new Promise(async (resolve) => {
      const API_URL = this.configService.get<string>('BASE_API_URL_FAMOUS');
      try {
        this.errorHandler.logDebug('check is truck movement from kafka running');
        if (await this.checkIsTruckMovementConsumerKafkaRunning()) {
          return;
        }
        // Request data from API
        this.errorHandler.logDebug('get data from Api');
        const API_AUTH = this.configService.get<string>('X_API_KEY_FAMOUS');
        const response = await axios.get(
          `${API_URL}/api/v2/integration/sharing/devices`,
          {
            headers: {
              'x-api-key': API_AUTH,
              'Content-Type': 'application/json',
            },
          },
        );
        const data = response.data.data;
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
          this.icount++;
        }

        this.saveConsumerLog(data, 'sharing/devices');
      } catch (error) {
        this.errorHandler.logError(
          `Problem import API ${API_URL}/api/v2/integration/sharing/devices`,
          error,
        );
        this.errorHandler.saveLogToDB(
          'Job-ApiGetMonitoringDevice',
          'import',
          'error',
           error,
           null,
        );
      }
      resolve(true);
    });
  }

  async checkIsTruckMovementConsumerKafkaRunning(): Promise<boolean> {
    this.errorHandler.logDebug('check is truck movement from kafka running')
    const last_consumer_logs = await this.databaseService.query(
      `SELECT * FROM consumer_logs cl where cl.source != 'api' ORDER BY created_at DESC limit 1`,
    );

    if (last_consumer_logs.length > 0) {
      const last_consumer_log = last_consumer_logs[0];
      const now = new Date();
      const diff = now.getTime() - last_consumer_log.created_at.getTime();
      const diffInMinutes = Math.floor(diff / 1000 / 60);
      if (diffInMinutes < 1) {
        this.errorHandler.logDebug('truck movement from kafka is running')
        return true;
      }
    }

    this.errorHandler.logDebug('truck movement from kafka is not running')
    return false;
  }

  async saveConsumerLog(message: string, topic: string) {
    try {
      await this.databaseService.query(
        `INSERT INTO consumer_logs (payload, topic_name, source) VALUES ($1, $2, 'api')`,
        [message, topic],
      );
    } catch (error: any) {
      this.errorHandler.logError('saveConsumerLog error', error);
    }
  }
  async setSaveTruck(item:any){
    await this.databaseService.query(
      `INSERT INTO trucks (id,typeoftruck,nomor_lambung,capacity_in_tons,status,vendor,brand,model,created_at,auditupdate) 
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(id) DO UPDATE SET 
        typeoftruck=EXCLUDED.typeoftruck,
        nomor_lambung=EXCLUDED.nomor_lambung,
        capacity_in_tons=EXCLUDED.capacity_in_tons,
        status=EXCLUDED.status,
        vendor=EXCLUDED.vendor,
        brand=EXCLUDED.brand,
        model=EXCLUDED.model,
        created_at=EXCLUDED.created_at,
        auditupdate=EXCLUDED.auditupdate 
        `,
      [
        item.id,
        item.type,
        item.name,
        item.capacity,
        numberToBoolean(item.status),
        item.vendor,
        item.brand,
        item.model,
        item.created_at,
        item.updated_at,
      ],
    );
  }
}
