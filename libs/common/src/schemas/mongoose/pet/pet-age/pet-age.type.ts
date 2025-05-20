import { IsEnum, IsNumber, IsString, Max, Min } from 'class-validator';
import { PetAgeUnitEnum } from '../pet.enum';

export class PetAge {
  @IsNumber()
  @Max(100)
  @Min(1)
  amount: number;

  @IsString()
  @IsEnum(PetAgeUnitEnum)
  unit: PetAgeUnitEnum;
}
