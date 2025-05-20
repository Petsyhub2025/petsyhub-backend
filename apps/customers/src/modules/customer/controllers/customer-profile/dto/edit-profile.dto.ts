import { PartialType, PickType } from '@nestjs/swagger';
import { Customer } from '@instapets-backend/common';

export class EditProfileDto extends PartialType(PickType(Customer, ['firstName', 'lastName'] as const)) {}
