import { IsNotEmpty } from 'class-validator';
import { TruckLogsPayloadDto } from './truck-logs-payload.Dto';
import { DatabaseService } from '@utils/database.service';
import { ErrorHandlerService } from '@utils/error-handler.service';
import {
  isEmpty,
  decryptJSAES,
  formatDateToISO,
  getCurrentDate,
  encryptJSAES,
} from '@utils/functions.service';
import { QueryLoaderService } from '@utils/query-loader.service';
import { Injectable } from '@nestjs/common';
@Injectable()
export class TruckLogService {
  private queryLoader = new QueryLoaderService('queries.sql');
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly errHandler: ErrorHandlerService,
  ) {}

  async getLogs(
    dataPL: TruckLogsPayloadDto,
    metadata: Record<string, any>,
  ): Promise<any> {
    let query = this.queryLoader.getQueryById('query_logs_trucks');
    try {
      let RsList: any;
      let truck_id, assignment_id: number;
      let start_date: any;
      let end_date: any;
      if (!isEmpty(dataPL.truck_id)) {
        truck_id = Number(decryptJSAES(dataPL.truck_id));
      }
      if (!isEmpty(dataPL.assignment_id)) {
        assignment_id = Number(decryptJSAES(dataPL.assignment_id));
      }

      if (!isEmpty(dataPL.start_date)) {
        start_date = formatDateToISO(dataPL.start_date);
      } else {
        start_date = getCurrentDate();
      }
      if (!isEmpty(dataPL.end_date)) {
        end_date = formatDateToISO(dataPL.end_date);
      } else {
        end_date = getCurrentDate();
      }

      if (
        !isEmpty(dataPL.assignment_id) &&
        isEmpty(dataPL.truck_id) &&
        !isEmpty(dataPL.status) &&
        !isEmpty(dataPL.start_date) &&
        !isEmpty(dataPL.end_date)
      ) {
        query = query.replaceAll(
          '::search',
          ` AND (assignment_id=$1) AND  thc.status=$2 AND DATE(thc.created_at) between $3 AND $4 `,
        );
        RsList = await this.databaseService.query(query, [
          assignment_id,
          dataPL.status.toUpperCase().trim(),
          start_date,
          end_date,
        ]);
      } else if (
        !isEmpty(dataPL.assignment_id) &&
        !isEmpty(dataPL.truck_id) &&
        isEmpty(dataPL.status) &&
        !isEmpty(dataPL.start_date) &&
        !isEmpty(dataPL.end_date !== null)
      ) {
        query = query.replaceAll(
          '::search',
          ` AND (assignment_id=$1) AND  thc.truck_id=$2 AND DATE(thc.created_at) between $3 AND $4 `,
        );
        RsList = await this.databaseService.query(query, [
          assignment_id,
          truck_id,
          start_date,
          end_date,
        ]);
      } else if (
        !isEmpty(dataPL.assignment_id) &&
        !isEmpty(dataPL.truck_id) &&
        !isEmpty(dataPL.status) &&
        isEmpty(dataPL.start_date) &&
        !isEmpty(dataPL.end_date)
      ) {
        query = query.replaceAll(
          '::search',
          ` AND (assignment_id=$1) AND  thc.truck_id=$2 AND DATE(thc.created_at) between $3 AND $4 `,
        );
        RsList = await this.databaseService.query(query, [
          assignment_id,
          truck_id,
          start_date,
          end_date,
        ]);
      } else if (
        isEmpty(dataPL.assignment_id) &&
        !isEmpty(dataPL.truck_id) &&
        isEmpty(dataPL.status) &&
        !isEmpty(dataPL.start_date) &&
        !isEmpty(dataPL.end_date)
      ) {
        query = query.replaceAll(
          '::search',
          ` AND thc.truck_id=$1 AND DATE(thc.created_at) between $2 AND $3 `,
        );
        RsList = await this.databaseService.query(query, [
          truck_id,
          start_date,
          end_date,
        ]);
      } else if (
        isEmpty(dataPL.assignment_id) &&
        isEmpty(dataPL.truck_id) &&
        isEmpty(dataPL.status) &&
        isEmpty(dataPL.start_date) &&
        isEmpty(dataPL.end_date)
      ) {
        query = query.replaceAll(
          '::search',
          ` AND DATE(thc.created_at) between $1 AND $2 `,
        );
        RsList = await this.databaseService.query(query, [
          start_date,
          end_date,
        ]);
      } else if (
        !isEmpty(dataPL.assignment_id) &&
        isEmpty(dataPL.truck_id) &&
        isEmpty(dataPL.status) &&
        isEmpty(dataPL.start_date) &&
        isEmpty(dataPL.end_date)
      ) {
        query = query.replaceAll('::search', ` AND (assignment_id=$1) `);
        RsList = await this.databaseService.query(query, [assignment_id]);
      } else if (
        isEmpty(dataPL.assignment_id) &&
        isEmpty(dataPL.truck_id) &&
        !isEmpty(dataPL.status) &&
        isEmpty(dataPL.start_date) &&
        isEmpty(dataPL.end_date)
      ) {
        query = query.replaceAll(
          '::search',
          `AND thc.status=$1 AND thc.created_at between $2 AND $3 `,
        );
        RsList = await this.databaseService.query(query, [
          dataPL.status.trim().toUpperCase(),
          start_date,
          end_date,
        ]);
      } else {
        query = query.replaceAll(
          '::search',
          ` AND (assignment_id=$1) AND thc.truck_id=$2 & AND thc.status=$3 AND thc.created_at between $4 AND $5 `,
        );
        RsList = await this.databaseService.query(query, [
          assignment_id,
          truck_id,
          dataPL.status.toUpperCase().trim(),
          start_date,
          end_date,
        ]);
      }
      const result = RsList.map((row) => ({
        ...row,
        truck_id: encryptJSAES(row.truck_id.toString()),
      }));
      return { showCode: 200, data: result };
    } catch (error) {
      this.errHandler.saveLogToDB(
        'truck-history',
        'list',
        'error',
        JSON.stringify(error),
        JSON.stringify(metadata),
      );
      this.errHandler.logError('TruckLogService-Error',error);
      this.errHandler.throwBadRequestError(error, 'failed to query');
    }
  }
}
