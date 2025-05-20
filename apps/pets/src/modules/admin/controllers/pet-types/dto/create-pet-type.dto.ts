import { PickType } from '@nestjs/swagger';
import { PetType } from '@instapets-backend/common';

export class CreatePetTypeDto extends PickType(PetType, ['name'] as const) {}
