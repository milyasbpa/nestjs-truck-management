import axios from 'axios';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { QueryLoaderService } from '@utils/query-loader.service';
import { DatabaseService } from '@utils/database.service';
import { sleep } from '@utils/functions.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { TokenUscavisEnum } from '@utils/enums';

@Injectable()
export class CPStatusService {
  queryLoader = new QueryLoaderService('queries.sql');
  private isLocked = false;

  constructor(
    @Inject(forwardRef(() => DatabaseService))
    private readonly databaseService: DatabaseService,
    @Inject(forwardRef(() => ErrorHandlerService))
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async cpStatus() {
    if (this.isLocked) {
      this.errorHandler.logDebug(
        'Monitoring CP Status Process is already running.',
      );
      return false;
    }
    try {
      this.isLocked = true;
      this.errorHandler.logDebug('Monitoring CPStatus process started...');
      const query = this.queryLoader.getQueryById('query_cps');
      const listM = await this.databaseService.query(query);
      for (const rec of listM) {
        // Proses setiap record
        const isActive = await this.processCpRecord(rec);
        const updateQuery = this.queryLoader.getQueryById('update_cps_status');
        await this.databaseService.query(updateQuery, [isActive, rec.cp_name]);
        // Beri jeda antar proses
        await sleep(5000); // Jeda 10 detik
      }
    } catch (error) {
      await this.errorHandler.saveLogToDB(
        'job-cp-status',
        'check-status',
        'error',
        error,
        null,
      );
      this.errorHandler.logError('job-cp-status : error', error);
    } finally {
      this.isLocked = false;
      this.errorHandler.logDebug('Monitoring CPStatus process completed.');
    }
  }
  /**
   * Memproses satu record CP
   */
  private async processCpRecord(rec: any): Promise<boolean> {
    try {
      const query = this.queryLoader.getQueryById('query_cctv_item_devices');
      const ListItemsDevice = await this.databaseService.query(query, [
        rec.cp_name,
      ]);

      const bFlag: number[] = [];
      for (const rec2 of ListItemsDevice) {
        const success = await this.processDeviceItem(rec2, bFlag);
        if (!success) {
          this.errorHandler.logDebug(
            `Failed to process device item: ${rec2.device_id}`,
          );
        }
      }

      // Status aktif jika bFlag memiliki setidaknya 2 item
      return bFlag.length >= 2;
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        `Error processing CP record: ${rec.cp_name}`,
      );
    }
  }

  /**
   * Memproses satu perangkat dan item
   */
  private async processDeviceItem(
    rec2: any,
    bFlag: number[],
  ): Promise<boolean> {
    try {
      const API_URL =
        'https://uscavisapi.borneo-indobara.com/api/archiveItemsFloat';
      const TOKEN = TokenUscavisEnum.TOKEN;
      const param = {
        token: TOKEN,
        device_id: [rec2.device_id],
        item_id: [rec2.item_id],
      };

      const response = await axios.post(API_URL, param, {
        headers: { 'Content-Type': 'application/json' },
      });

      const data2 = response.data?.data || [];
      for (const item of data2) {
        if (rec2.live_condition.includes(item.Value)) {
          bFlag.push(1);
        }
      }
      bFlag.push(1);
      await sleep(1000);
      return true;
    } catch (error) {
      this.errorHandler.logError(
        `Error in API request for device_id: ${rec2.device_id}`,
        error,
      );
      return false;
    }
  }
}
