import { PartialType } from '@nestjs/mapped-types';
import { CreateReroutePlanDto } from './create-rerouteplan.dto';

export class UpdateReroutePlanDto extends PartialType(CreateReroutePlanDto) {}
