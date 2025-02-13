import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateUcanDTO } from './dto/create-ucan.dto';
import { Trucks } from 'src/trucks/entities/trucks.entity';
import { Ucan } from './entities/ucan.entities';
import { DatabaseService } from '@utils/database.service';
import { exitTypeEnum } from '@utils/enums';
import { SocketClientService } from 'src/websocket/websocket-client.service';
import { ErrorHandlerService } from '@utils/error-handler.service';

@Injectable()
export class UcanService {
  constructor(
    @InjectRepository(Trucks)
    private readonly trucksRepository: Repository<Trucks>,
    private readonly databaseService: DatabaseService,
    private readonly errHandler: ErrorHandlerService,
    private readonly socketClientService: SocketClientService,
    @InjectRepository(Ucan)
    private readonly ucanRepository: Repository<Ucan>,
  ) {}
  async createUcan(createUcan: CreateUcanDTO): Promise<Ucan> {
    const truck = await this.trucksRepository.findOne({
      where: { nomor_lambung: createUcan.nomor_lambung },
    });

    if (!truck) {
      const lastTruck = await this.trucksRepository
        .createQueryBuilder('truck')
        .orderBy('truck.id', 'DESC')
        .getOne();

      if (!lastTruck) {
        throw new Error('No trucks found');
      }

      const ucan = await this.trucksRepository.create({
        id: lastTruck.id + 1,
        nomor_lambung: createUcan.nomor_lambung,
      });
      //  harus di save kalau di nestjs
      await this.trucksRepository.save(ucan);
    }

    const rppjTruck = await this.ucanRepository.create({
      nomorLambung: createUcan.nomor_lambung,
      closingRitaseTimestamp: createUcan.closing_ritase_timestamp,
      netWeight: createUcan.net_weight,
      tareWeight: createUcan.tare_weight,
      grossWeight: createUcan.gross_weight,
    });
    await this.ucanRepository.save(rppjTruck);

    // Complete by UCAN
    const [cpQueueResult] = await this.databaseService.query(`
      SELECT cqa.* ,cps.cp_name, ced.cp_exit_type_name
            FROM cp_queue_assignments cqa 
            JOIN cps ON cps.cp_id = cqa.cp_queue_id 
            LEFT JOIN cp_exit_detail ced ON ced.cp_id = cqa.cp_queue_id
            WHERE truck_id = ${truck.id}
            ORDER BY auditupdate DESC LIMIT 1
  `);
    //   const [cpQueueResult] = await this.databaseService.query(`
    //     SELECT status, assignment_id
    //     FROM cp_queue_assignments
    //     WHERE truck_id = ${truck.id}
    //     ORDER BY auditupdate DESC
    //     LIMIT 1
    // `);
    const socketClient = this.socketClientService.getSocket();

    if (
      cpQueueResult.cp_exit_type_name === exitTypeEnum.RFID &&
      cpQueueResult.cp_exit_type_name !== null
    ) {
      if (cpQueueResult.status !== 'COMPLETED') {
        try {
          await this.databaseService.query(`
            UPDATE public.cp_queue_assignments
            SET 
              status='COMPLETED', exit_cp_time=now(),auditupdate=now() 
              completed_by = 'UCAN'::public."completed_by_enum"
            WHERE truck_id = ${truck.id};
        `);
          const msg = `${cpQueueResult.nomor_lambung} - Dumping Selesai ${cpQueueResult.cp_name}, via UCAN`;
          socketClient.emit('toast_dumping_completed', {
            data: msg,
          });
        } catch (error) {
          this.errHandler.logError('Error Closing By Ucan : ', error);
        }
      }
    } else if (cpQueueResult.cp_exit_type_name === null) {
      if (cpQueueResult.status !== 'COMPLETED') {
        try {
          await this.databaseService.query(`
            UPDATE public.cp_queue_assignments
            SET 
              status='COMPLETED', exit_cp_time=now(),auditupdate=now() 
              completed_by = 'UCAN'::public."completed_by_enum"
            WHERE truck_id = ${truck.id};
        `);
          const msg = `${cpQueueResult.nomor_lambung} - Dumping Selesai ${cpQueueResult.cp_name}, via UCAN`;
          socketClient.emit('toast_dumping_completed', {
            data: msg,
          });
        } catch (error) {
          this.errHandler.logError('Error Closing By Ucan : ', error);
        }
      }
    }

    return rppjTruck;
  }
}
