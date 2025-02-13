import { SimpangBayahService } from 'src/services/simpangbayah.service';
import { QueryLoaderService } from '@utils/query-loader.service';
import { DatabaseService } from './../utils/database.service';
import { Injectable, HttpCode } from '@nestjs/common';
import {
  decryptJSAES,
  encryptJSAES,
  throwBadRequestError,
} from '@utils/functions.service';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CreateCpQueueAssignmentDTO } from './dto/cp-queue-assigntmentDto';
import { ExitCPDTO } from './dto/cpexitDto';
import { CpQAssigmentNomorLambungDto } from './dto/cp-nomorlambung.dto';

@Injectable()
export class CpQueueAssignmentService {
  private queryLoader = new QueryLoaderService('queries.sql');
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly errHandler: ErrorHandlerService,
    private readonly simpanBayahService: SimpangBayahService,
  ) {}
  async getList(): Promise<any> {
    try {
      const query = this.queryLoader.getQueryById('query_cp_queue_assignment');
      const results = await this.databaseService.query(query);
      const list = results.map((row) => ({
        ...row,
        assignment_id: encryptJSAES(row.assignment_id),
      }));
      return { statusCode: 200, data: list };
    } catch (error) {
      throwBadRequestError(error, 'Failed to query.');
    }
  }
  async saveBulkByNomorLambung(data: CreateCpQueueAssignmentDTO): Promise<any> {
    const client = await this.databaseService.beginTransaction();
    try {
      for (const row of data.assignments) {
        const RsOfTruck = await this.getTruckID(client, row.nomor_lambung);
        const user_id = Number(decryptJSAES(row.user_id));
        const isExists = await this.isTruckIDValid(client, RsOfTruck.id);
        if (isExists) {
          await this.databaseService.rollbackTransaction(client);
          return {
            showCode: 400,
            message: `Nomor Lambung :${row.nomor_lambung} is already exist,failed!`,
          };
        }
        if (row.assign_to === 'cp') {
          const { isElligable, message } =
            await this.simpanBayahService.isElligableInCP(
              row.id_lane_or_cp,
              RsOfTruck.id,
            );
          if (isElligable) {
            const query = `INSERT INTO cp_queue_assignments(truck_id,cp_queue_id,status,truck_type,created_at,created_by) VALUES($1,$2,$3,$4,now(),$5)`;
            await client.query(query, [
              RsOfTruck.id,
              row.id_lane_or_cp,
              'ASSIGNED_TO_CP',
              RsOfTruck.truck_type,
              user_id,
            ]);
          } else {
            await this.databaseService.rollbackTransaction(client);
            return { showCode: 200, message: `This cp is overload ${message}` };
          }
        } else {
          const query = `INSERT INTO cp_queue_assignments(truck_id,lane_id,status,truck_type,created_at) VALUES($1,$2,$3,$4,now(),$5)`;
          await client.query(query, [
            RsOfTruck.id,
            row.id_lane_or_cp,
            'WAITING',
            RsOfTruck.truck_type,
            user_id,
          ]);
        }
      }
      await this.databaseService.commitTransaction(client);
      return { showCode: 200, message: 'Data was saved successfully!' };
    } catch (error) {
      await this.errHandler.throwBadRequestError(error, error);
    }
  }
  async getTruckID(client: any, nomor_lambung: string): Promise<any> {
    const query = `SELECT id,abbreviate_words(typeoftruck) truck_type  FROM trucks WHERE nomor_lambung=$1`;
    const row = await client.query(query, [nomor_lambung]);
    return row.rows[0];
  }
  async isTruckIDValid(client: any, truck_id: number): Promise<boolean> {
    const query = `SELECT EXISTS(SELECT 1 FROM cp_queue_assignments WHERE truck_id=$1 AND status!='COMPLETED') isexist`;
    const row = await client.query(query, [truck_id]);
    return row.rows[0].isexist;
  }
  async exitCP(exitcpDTO: ExitCPDTO): Promise<any> {
    const client = await this.databaseService.beginTransaction();
    try {
      const query = this.queryLoader.getQueryById('query_exit_cp');
      await client.query(query, [exitcpDTO.nomor_lambung]);
      await this.databaseService.commitTransaction(client);
      return {
        showCode: 200,
        message: 'The device was completed succesufully exit from cp.',
      };
    } catch (error) {
      await this.databaseService.rollbackTransaction(client);
      await this.errHandler.throwBadRequestError(error, error);
    }
  }
  async ShowNomorLambung(assignment_id: string): Promise<any> {
    try {
      const id = decryptJSAES(assignment_id);
      const query =
        'select nomor_lambung from cp_queue_assignments WHERE assignment_id=$1';
      const Rs = await this.databaseService.queryOne(query, [id]);
      return { showCode: 200, data: Rs };
    } catch (error) {
      await this.errHandler.throwBadRequestError(error, error);
    }
  }
  async saveEditNomorlambung(
    { assignment_id, nomor_lambung }: CpQAssigmentNomorLambungDto,
    metadata: Record<string, any>,
  ): Promise<any> {
    try {
      const id = decryptJSAES(assignment_id);
      const query = `UPDATE cp_queue_assignments SET nomor_lambung=$1 WHERE assignment_id=$2`;
      await this.databaseService.query(query, [nomor_lambung, id]);
      await this.errHandler.saveLogToDB(
        'cp-queue-assigment',
        'edit',
        'info',
        `save nomor lambung ${nomor_lambung}`,
        JSON.stringify(metadata),
      );
      return { showCode: 200, message: 'The data was saved successfully!' };
    } catch (error) {
      await this.errHandler.throwBadRequestError(error, error);
    }
  }
}
