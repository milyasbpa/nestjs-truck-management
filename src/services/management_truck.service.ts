import { encryptJSAES } from '@utils/functions.service';
import { DatabaseService } from '@utils/database.service';
import { QueryLoaderService } from '@utils/query-loader.service';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { Injectable } from '@nestjs/common';
@Injectable()
export class ManagementTruckService {
  private readonly queryLoaderService = new QueryLoaderService('queries.sql');
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async getListTruck(
    params: {
      search: string;
      page: number;
      limit: number;
      sort: string;
      order: 'ASC' | 'DESC';
    },
    metadata: Record<string, any>,
  ): Promise<any> {
    try {
      const { search, page, limit, sort, order } = params;
      const searchQuery = search ? `%${search}%` : null;
      const offset = BigInt((Number(page) - 1) * Number(limit));
      const queryParams: any[] = [];
      let query = this.queryLoaderService.getQueryById(
        // 'query_management_truck_list',
        'query_management_truck_list_new',
      );

      const where = ` WHERE nomor_lambung ilike $1 OR status_unit ILIKE $1 OR geofence ILIKE $1 OR assigned ILIKE $1`;
      if (search) {
        query += where;
        queryParams.push(searchQuery);
      }
      query += ` ORDER BY ${sort} ${order} LIMIT $${
        queryParams.length + 1
      } OFFSET $${queryParams.length + 2}`;
      queryParams.push(limit, offset);

      let countQuery = this.queryLoaderService.getQueryById(
        // 'query_count_management_truck_list',
        'query_count_management_truck_list_new',
      );
      if (search) {
        countQuery += where;
      }
      const countParams = search ? [searchQuery] : [];

      const [rows, countResult] = await Promise.all([
        this.databaseService.query(query, queryParams),
        this.databaseService.query(countQuery, countParams),
      ]);
      const total = parseInt(countResult[0].total, 10);
      const list = rows.map((row) => ({
        truck_id: encryptJSAES(row.truck_id.toString()),
        nomor_lambung: row.nomor_lambung,
        lat: row.lat,
        lng: row.lng,
        geofence: row.geofence,
        speed: row.speed,
        course: row.course,
        gps_time: row.gps_time,
        typeoftruck: row.typeoftruck,
        status_unit: row.status_unit,
        assigned: row.assigned,
        assigned_role: row.assigned_role,
        auditupdate: row.auditupdate,
        completed_status: row.completed_status,
        completed_by: row.completed_by,
        rfid_reader_in_status: row.rfid_reader_in_status,
        rfid_reader_out_status: row.rfid_reader_out_status,
      }));
      await this.errorHandler.saveLogToDB(
        'management-truck-list',
        'find-pagination',
        'info',
        `Query with params ${JSON.stringify(params)}`,
        JSON.stringify(metadata),
      );
      return { data: list, total, page, limit };
    } catch (error) {
      this.errorHandler.saveLogToDB(
        'manajemen-truck-list',
        'list-pagination',
        'error',
        error,
        JSON.stringify(metadata),
      );
      this.errorHandler.throwBadRequestError(error, 'Failed to query.');
    }
  }
  async refreshMaterializedView() {
    try {
      const query = this.queryLoaderService.getQueryById(
        'refresh_mv_truct_management',
      );
      await this.databaseService.query(query);
    } catch (error) {
      this.errorHandler.saveLogToDB(
        'job-refreshmaterializedview',
        'refresh',
        'error',
        error,
        null,
      );
      this.errorHandler.logError('Failed to query.', error);
    }
  }
  async detailTruck(id: number, metadata: Record<string, any>): Promise<any> {
    try {
      const query = this.queryLoaderService.getQueryById(
        // 'query_management_truck_list_by_id',
        'query_management_truck_list_by_id_new',
      );
      const list = await this.databaseService.query(query, [id]);
      const lists = list.map((row) => ({
        ...row,
        truck_id: encryptJSAES(row.truck_id),
      }));
      return { statusCode: 200, data: lists[0] };
    } catch (error) {
      this.errorHandler.saveLogToDB(
        'job-refreshmaterializedview',
        'refresh',
        'error',
        error,
        JSON.stringify(metadata),
      );
      this.errorHandler.throwBadRequestError(error, 'query failed');
    }
  }
}
