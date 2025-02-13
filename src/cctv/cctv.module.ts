import { Module } from '@nestjs/common';
import { CctvService } from './cctv.service';
import { CctvController } from './cctv.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cctv } from './entities/cctv.entity';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cctv])],
  providers: [CctvService, CustomLogger, ErrorHandlerService],
  controllers: [CctvController]
})
export class CctvModule {}
