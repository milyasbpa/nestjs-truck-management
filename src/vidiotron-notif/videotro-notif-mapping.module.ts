import { forwardRef, Module } from '@nestjs/common';
import { VideotroNotifMappingService } from './videotro-notif-mapping.service';
import { VidiotronNotifModule } from './vidiotron-notif.module';
import { TrucksService } from 'src/trucks/trucks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trucks } from 'src/trucks/entities/trucks.entity';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';
import { VidiotronService } from './vidiotron.service';
import { Vidiotron } from './entities/vidiotron.entity';
import { ValidationService } from '@utils/validation-service';

//import { CacheManagerService } from '@utils/cache-manager.service';

@Module({
  imports: [
    forwardRef(() => VidiotronNotifModule),
    TypeOrmModule.forFeature([Trucks, Vidiotron]),
  ],
  providers: [
    VideotroNotifMappingService,
    TrucksService,
    ErrorHandlerService,
    CustomLogger,
    VidiotronService,
    ValidationService,
  ],

  exports: [VideotroNotifMappingService],
})
export class VideotronNotifMappingModule {}
