import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class QueryLoaderService {
  private queries: Record<string, string> = {};
  private fileName: string;
  constructor(fileName: string) {
    this.fileName = fileName;
    this.loadQueries();
  }

  private loadQueries(): void {
    const filePath =
      process.env.SQL_QUERY_PATH + '/' + this.fileName ||
      path.resolve(__dirname, '..', 'resources', this.fileName);
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Pisahkan query berdasarkan id
    const queryBlocks = fileContent.split('-- id=');
    for (const block of queryBlocks.slice(1)) {
      const [id, ...sqlLines] = block.split('\n');
      this.queries[id.trim()] = sqlLines.join('\n').trim();
    }
  }

  /**
   * Mendapatkan query berdasarkan id
   * @param id ID dari query
   * @returns Query SQL
   */
  public getQueryById(id: string): string {
    const query = this.queries[id];
    if (!query) {
      throw new Error(`Query with ID "${id}" not found.`);
    }
    return query;
  }
}
