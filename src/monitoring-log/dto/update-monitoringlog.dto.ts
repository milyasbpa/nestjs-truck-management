import { PartialType } from '@nestjs/mapped-types';
import { CreateMonitoringLogDto } from './create-monitoringlog.dto';

export class UpdateMonitoringLogDto extends PartialType(CreateMonitoringLogDto) {}
