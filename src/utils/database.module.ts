import { DatabaseService } from '@utils/database.service';
import { Global, Module } from '@nestjs/common';

@Global()  // Menjadikan modul ini global
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
