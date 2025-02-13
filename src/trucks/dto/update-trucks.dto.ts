import { PartialType } from '@nestjs/mapped-types';
import { CreateTrucksDto } from './create-trucks.dto';

export class UpdateTrucksDto extends PartialType(CreateTrucksDto) {}
