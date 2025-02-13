import { PartialType } from '@nestjs/mapped-types';
import { CreateCronScheduleDTO } from './create-cronsechedule.dto';

export class UpdateCronScheduleDto extends PartialType(CreateCronScheduleDTO) {}
