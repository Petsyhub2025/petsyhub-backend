import { PetBreed } from '@instapets-backend/common';
import { PickType, PartialType } from '@nestjs/swagger';

export class GetPetBreedsFilterOptionsQueryDto extends PartialType(PickType(PetBreed, ['type'] as const)) {}
