import { PartialType } from '@nestjs/mapped-types';
import { CreateRoutesDto } from './create-routes.dto';

export class UpdateRoutesDto extends PartialType(CreateRoutesDto) {}
