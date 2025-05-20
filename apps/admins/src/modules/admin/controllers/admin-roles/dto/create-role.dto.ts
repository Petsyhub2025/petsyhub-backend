import { PickType } from '@nestjs/swagger';
import { AdminRole } from '@instapets-backend/common';

export class CreateRoleDto extends PickType(AdminRole, ['name'] as const) {}
