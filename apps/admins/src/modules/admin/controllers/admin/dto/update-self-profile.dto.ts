import { PartialType, PickType } from '@nestjs/swagger';
import { Admin } from '@instapets-backend/common';

export class UpdateSelfProfileDto extends PartialType(
  PickType(Admin, ['firstName', 'lastName', 'settings'] as const),
) {}
