import { PetStatusEnum } from '@instapets-backend/common';
import { IsEnum, IsString } from 'class-validator';

export class UpdatePetStatusDto {
  @IsString()
  @IsEnum(PetStatusEnum)
  status: PetStatusEnum;
}
