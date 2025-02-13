import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { ErrorHandlerService } from './error-handler.service';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      idleTimeoutMillis: 30000,
      max: 100,
      min: 2,
      application_name: process.env.APP_NAME || 'rppj',
    });
  }
  private async reinitializePool() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      idleTimeoutMillis: 30000,
      max: 100,
      min: 2,
      application_name: process.env.APP_NAME || 'rppj',
    });
  }
  // Initialize the connection pool
  async onModuleInit() {
    await this.pool.connect();
  }

  // Close the pool on shutdown
  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  // Execute raw SQL queries
  async query<T = any>(
    query: string,
    params: any[] = [],
    returningColumn: string | null = null,
  ): Promise<T[]> {
    if (!this.pool) {
      this.reinitializePool();
    }
    const result = await this.pool.query(query, params);
    if (returningColumn) {
      return result.rows[0]?.[returningColumn] || null;
    }
    return result.rows;
  }
  async queryOne<T = any>(
    query: string,
    params: any[] = [],
    returningColumn: string | null = null,
  ): Promise<T | null> {
    if (!this.pool) {
      this.reinitializePool();
    }
    const result = await this.pool.query(query, params);
    if (returningColumn) {
      return result.rows[0]?.[returningColumn] || null;
    }
    return result.rows[0] || null;
  }

  // Query for a single row
  /*async queryOne<T = any>(
    query: string,
    params: any[] = [],
    client?: PoolClient, // Optional client parameter for transaction support
  ): Promise<T | null> {
    if (!this.pool){
      this.reinitializePool();
    }
    const queryExecutor = client
      ? client.query.bind(client)
      : this.pool.query.bind(this.pool);
    const result = await queryExecutor(query, params);
    return result.rows[0] || null; // Return the first row or null if no rows found
  }*/
  // Begin a transaction and return the client
  async beginTransaction(): Promise<PoolClient> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      return client;
    } catch (err) {
      client.release();
    }
  }

  // Commit a transaction
  async commitTransaction(client: PoolClient): Promise<void> {
    try {
      await client.query('COMMIT');
    } catch (err) {
    } finally {
      client.release(); // Release the client back to the pool
    }
  }

  // Rollback a transaction
  async rollbackTransaction(client: PoolClient): Promise<void> {
    try {
      await client.query('ROLLBACK');
    } catch (err) {

    } finally {
      client.release(); // Release the client back to the pool
    }
  }

  // Use the transaction
  async withTransaction<T>(
    task: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.beginTransaction();
    try {
      const result = await task(client);
      await this.commitTransaction(client);
      return result;
    } catch (error) {
      await this.rollbackTransaction(client);
    }
  }
}
