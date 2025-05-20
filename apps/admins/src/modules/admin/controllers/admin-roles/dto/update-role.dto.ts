import { PartialType, PickType } from '@nestjs/swagger';
import { AdminRole } from '@instapets-backend/common';

export class UpdateRoleBodyDto extends PickType(AdminRole, ['name'] as const) {}
