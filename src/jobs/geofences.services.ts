import { ErrorHandlerService } from '@utils/error-handler.service';
import { DatabaseService } from 'src/utils/database.service';
import { Injectable } from '@nestjs/common';
import { QueryLoaderService } from '@utils/query-loader.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
@Injectable()
export class GeofencesService {
  private queryLoader = new QueryLoaderService('queries.sql');
  constructor(
    private databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async getGeofences() {
    const API_URL = this.configService.get<string>('BASE_API_URL_FAMOUS');
    try {
      // Request data from API
      const API_AUTH = this.configService.get<string>('X_API_KEY_FAMOUS');
      const response = await axios.get(
        `${API_URL}/api/v2/integration/sharing/geofences`,
        {
          headers: {
            'x-api-key': API_AUTH,
            'Content-Type': 'application/json',
          },
        },
      );
      const data = response.data;
      const query = this.queryLoader.getQueryById('import_geofences');
      for (const gf of data) {
        try {
          await this.databaseService.query(query, [
            gf.id,
            gf.name,
            gf.area,
            gf.geotype,
          ]);
        } catch (error) {
          this.errorHandler.saveLogToDB(
            'Job-ApiGetGeofences',
            'import',
            'error',
            error,
            null,
          );
          this.errorHandler.logError(`Error getGeofences ID:${gf.id}`, error);
        }
      }
      await this.databaseService.query(
        this.queryLoader.getQueryById('last_job_executed'),
        ['job_geofences'],
      );
    } catch (error) {
      this.errorHandler.logError(
        `Problem import ${API_URL}/api/v2/integration/sharing/geofences`,
        error,
      );
    }
}
}