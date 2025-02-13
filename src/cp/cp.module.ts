import { ErrorHandlerService } from './../utils/error-handler.service';
import { forwardRef, Module } from '@nestjs/common';
import { CpController } from './cp.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cps } from 'src/jobs/entities/cps.entity';
import { CpDevices } from './entities/cp_devices.entity';
import { CpUnits } from './entities/cp_units.entity';
import { CpService } from './cp.service';
import { CustomLogger } from '@utils/custom-logger.service';
import { RuleOfCp } from './entities/cp_rule.entity';
import { RuleLaneCp } from './entities/cp_rule_lane.entity';
import { CpDevicesLog } from './entities/cp_devices_log';
import { CpStatusLog } from './entities/cp_status_log.entity';
import { CpTonages } from './entities/cp_tonages';
import { CpTonagesLog } from './entities/cp_tonages_log';
import { CpLog } from 'src/jobs/entities/cp_logs.entity';
import { CpEntranceType } from './entities/cp_entrance_type.entity';
import { CpExitType } from './entities/cp_exit_type.entity';
import { GeofenceModule } from 'src/geofence/geofence.module';
import { CpDetailGeofence } from './entities/cp_detail_geofence.entity';
import { Geofence } from 'src/geofence/entities/geofences.entity';
import { CpDetail } from 'src/jobs/entities/cp_details.entity';
import { CpEntranceDetail } from './entities/cp_entrance_detail.entity';
import { CpExitDetail } from './entities/cp_exit_detail.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cps,
      CpDevices,
      CpUnits,
      RuleOfCp,
      RuleLaneCp,
      CpDevicesLog,
      CpStatusLog,
      CpTonages,
      CpTonagesLog,
      CpLog,
      CpEntranceType,
      CpExitType,
      Geofence,
      CpDetailGeofence,
      CpDetail,
      CpEntranceDetail,
      CpExitDetail,
    ]),
    GeofenceModule,
  ],
  providers: [CpService, ErrorHandlerService, CustomLogger],
  exports: [CpService],
  controllers: [CpController],
})
export class CpModule {}
