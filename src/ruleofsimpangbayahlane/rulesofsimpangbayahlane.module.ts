import { Module } from '@nestjs/common';
import { RulesOfSimpangBayahService } from './rulesofsimpangbayahlane.service';
import { RulesOfSimpangBayahController } from './rulesofsimpangbayahlane.controller';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RulesOfSimpangBayah } from './entities/rulesofsimpangbayahlane.entity';
import { CustomLogger } from '@utils/custom-logger.service';
import { EncryptionService } from '@utils/crypto.service';


@Module({
  imports: [TypeOrmModule.forFeature([RulesOfSimpangBayah]), 
  ],
  providers: [
    RulesOfSimpangBayahService,
    EncryptionService,
    CustomLogger,
    ErrorHandlerService,
  ],
  controllers: [RulesOfSimpangBayahController],
  //exports: [RulesOfSimpangBayahService],
})
export class RulesOfSimpangbayahModule {}
