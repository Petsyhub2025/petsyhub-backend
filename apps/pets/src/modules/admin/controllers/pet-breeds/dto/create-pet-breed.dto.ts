import { PickType } from '@nestjs/swagger';
import { PetBreed } from '@instapets-backend/common';

export class CreatePetBreedDto extends PickType(PetBreed, ['name'] as const) {}
