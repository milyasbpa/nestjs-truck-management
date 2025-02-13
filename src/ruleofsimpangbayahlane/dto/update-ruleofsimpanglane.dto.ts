import { PartialType } from '@nestjs/mapped-types';
import { CreateRuleOfSimpangBayahLaneDto } from './create-ruleofsimpanglane.dto';

export class UpdateRuleOfSimpangBayahLaneDto extends PartialType(
  CreateRuleOfSimpangBayahLaneDto,
) {}
