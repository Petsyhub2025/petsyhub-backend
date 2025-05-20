import { PickType } from '@nestjs/swagger';
import { PetType } from '@instapets-backend/common';

export class UpdatePetTypeDto extends PickType(PetType, ['name'] as const) {}
