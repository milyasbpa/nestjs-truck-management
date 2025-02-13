import { ErrorHandlerService } from '@utils/error-handler.service';
import { QueryLoaderService } from './../utils/query-loader.service';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Streets } from './entities/streates.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StreetsService {
  private queryLoaderService = new QueryLoaderService('queries.sql');
  constructor(
    @InjectRepository(Streets)
    private readonly streetRepository: Repository<Streets>,
    private configService: ConfigService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async fetchAndInsertData() {
    const API_URL = this.configService.get<string>('API_URL_BORNEO');
    try {
      // Request data from API
      const API_AUTH = this.configService.get<string>(
        'API_AUTHORIZATION_BORNEO',
      );
      const response = await axios.get(`${API_URL}/getgeohauling`, {
        headers: {
          Authorization: API_AUTH,
          'Content-Type': 'application/json',
        },
        data: {
          UserId: 4211,
        },
      });
      const data = response.data.data;
      for (const item of data) {
        const coordinates = item.StreetPolygon.geometry.coordinates[0]
          .map((point) => `${point[0]} ${point[1]}`)
          .join(', ');

        const polygonText = `POLYGON((${coordinates}))`;
        const query = this.queryLoaderService.getQueryById('import_streets');
        await this.streetRepository.query(query, [
          item.StreetId,
          item.StreetUser,
          item.StreetName,
          item.StreetAlias,
          polygonText,
          item.StreetType,
          item.StreetGroup,
          item.StreetCompany,
          item.StreetOrder,
          item.StreetCreated,
        ]);
      }
    } catch (error) {
      this.errorHandler.logError(
        `Problem import API ${API_URL}/getgeohauling`,
        error,
      );
      this.errorHandler.saveLogToDB(
        'Job-ApiGetGeohauling',
        'import',
        'error',
        error,
        null,
      );
    }
    return 'done';
  }
}
