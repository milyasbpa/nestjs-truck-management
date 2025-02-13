import { ErrorHandlerService } from '@utils/error-handler.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { decryptJSAES, encryptJSAES } from '@utils/functions.service';
import { DatabaseService } from '@utils/database.service';
import { ValidationService } from '@utils/validation-service';
import { JwtAuthResponse } from 'src/auth/dto/auth.dto';
import { dtoStatusCP } from 'src/cp/dto/status.dto';
import { reorderingPosition } from 'src/cp/dto/checkStatusCp.dto';
import { UpdatePositioningEnum } from '@utils/enums';
import { QueueVidiotron } from 'src/vidiotron-notif/entities/vidiotron-queue.entity';
import { updateQueueVidiotronDTO } from './dto/queue_vidiotron.dto';
import { VidiotronNotif } from 'src/vidiotron-notif/entities/vidiotron-notif.entity';
import { DeviceCPDataPayload } from 'src/kafka/dto/device_cp.payload';

@Injectable()
export class QueueVidiotronService {
  private queueVidiotron: QueueVidiotron;
  constructor(
    @InjectRepository(QueueVidiotron)
    private queueVidiotronRepository: Repository<QueueVidiotron>,
    @InjectRepository(VidiotronNotif)
    private vidiotronNotifRepository: Repository<VidiotronNotif>,
    private databaseService: DatabaseService,
    private errHandler: ErrorHandlerService,
  ) {}

  async update(updateQueueVidiotronDto: DeviceCPDataPayload): Promise<any> {
    try {
      this.errHandler.logDebug('Start Update Vidiotron Queue');
      // await Promise.all(
      //   updateQueueVidiotronDto.data.map((queue) =>
      //     this.queueVidiotronRepository.update(
      //       { nomorlambung: queue.name },
      //       { flag: 1 },
      //     ),
      //   ),
      // );
      // console.log('End Update Vidiotron Queue');
      for (const queue of updateQueueVidiotronDto.data) {
        const checkData = await this.queueVidiotronRepository.find({
          where: {
            nomorlambung: queue.name,
            flag: 0,
          },
        });
        for (const update of checkData) {
          if (checkData) {
            await this.queueVidiotronRepository.update(update.id, {
              flag: 1,
            });
            this.errHandler.logDebug('End Update Vidiotron Queue');
          }
        }
      }
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Update queue videotron error.',
      );
    }
  }
  async removeSuccessQueue(): Promise<any> {
    try {
      this.errHandler.logDebug('Start Process Remove Vidiotron Queue');
      const data = await this.databaseService.query(`
          SELECT 
              id, 
              lane_id, 
              nomorlambung, 
              lane_name, 
              created_at, 
              flag 
          FROM queue_vidiotron 
          WHERE flag = 1 
          AND DATE(created_at) <> CURRENT_DATE;
      `);

      if (data.length > 0) {
        for (const row of data) {
          await this.databaseService.query(
            `
                  INSERT INTO queue_vidiotron_logs 
                  (vidiotron_notif_id, nomorlambung, lane_name) 
                  VALUES ($1, $2, $3)
              `,
            [row.id, row.nomorlambung, row.lane_name],
          );

          await this.databaseService.query(
            `
                  DELETE FROM queue_vidiotron WHERE id = $1
              `,
            [row.id],
          );
        }
      }
      this.errHandler.logDebug('End Process Remove Vidiotron Queue');
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops remove queue vidiotron error.',
      );
    }
  }
  async ObserveInvalidGeofence(): Promise<any> {
    try {
      
      this.errHandler.logDebug('Start Process Observe Invalid Vidiotron Queue');
      const data = await this.databaseService.query(`
          SELECT 
              qv.id, 
              qv.lane_id, 
              qv.nomorlambung, 
              gsl.nomor_lambung AS gsl_nomor_lambung, 
              gsl.geofence_target_value, 
              qv.lane_name, 
              qv.created_at AS qv_created_at, 
              qv.flag 
          FROM queue_vidiotron qv 
          LEFT JOIN geofence_service_logs gsl 
              ON gsl.nomor_lambung = qv.nomorlambung 
          WHERE qv.flag = 0 
          ORDER BY qv.created_at ASC;
      `);
      this.errHandler.logDebug(`{ rowData: ${JSON.stringify(data)}}`);
      if (data.length > 0) {
        for (const row of data) {
          this.errHandler.logDebug(`{ rowUpdate:${JSON.stringify(row)}}`);
          if (row.geofence_target_value !== row.lane_name)
            await this.queueVidiotronRepository.update(
              { id: row.id },
              { flag: 1 },
            );
        }
      }
      this.errHandler.logDebug('End Process Remove Vidiotron Queue');
    } catch (error) {
      this.errHandler.throwBadRequestError(error,'Ooops remove queue vidiotron error.');
    }
  }

  async checkQueueVidiotron(
    updateQueueVidiotronDto: DeviceCPDataPayload,
  ): Promise<any> {
    try {
      this.errHandler.logDebug('Start Check Vidiotron Queue');
      for (const queue of updateQueueVidiotronDto.data) {
        const geofenceTruckAktualFinal = queue.geofence.includes(', ')
          ? queue.geofence.split(', ').pop()
          : queue.geofence;
        const checkData = await this.databaseService.query(
          `SELECT count(*) FROM geofence_service_logs WHERE geofence_target_value = '${geofenceTruckAktualFinal}'`,
        );
      }
    } catch (error) {
      this.errHandler.logError('Ooops checkQueueVidiotron Error', error);
    }
  }
}
