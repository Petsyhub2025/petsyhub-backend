import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { AddPetDto } from './add-pet.dto';

export class UpdatePetDto extends PartialType(AddPetDto) {
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
