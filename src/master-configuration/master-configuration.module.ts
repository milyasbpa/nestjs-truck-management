import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TextToSpeechConfigController } from './text-to-speech-config.controller';
import { MasterConfigurationService } from './master-configuration.service';
import { TextToSpeechConfig } from './entity/text-to-speech-config.entity';
import { RingtoneConfigController } from './ringtone-config.controller';
import { RingtoneConfig } from './entity/ringtone-config.entity';
import { ValidationService } from '@utils/validation-service';
import { VidiotronCommand } from './entity/vidiotron-command.entity';
import { VidiotronCommandDetail } from './entity/vidiotron-command-detail.entity';
import { VidiotronCommandController } from './vidiotron-command.controller';
import { VidiotronCommandService } from './vidiotron-command.service';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TextToSpeechConfig,
      RingtoneConfig,
      VidiotronCommandDetail,
      VidiotronCommand,
    ]),
  ],
  controllers: [
    TextToSpeechConfigController,
    RingtoneConfigController,
    VidiotronCommandController,
  ],
  providers: [
    MasterConfigurationService,
    ValidationService,
    ErrorHandlerService,
    CustomLogger,
    VidiotronCommandService,
  ],
})
export class MasterConfigurationModule {}
