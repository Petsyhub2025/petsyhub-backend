import { IsMongoId } from 'class-validator';

export class MedicalSpecialtyIdParamDto {
  @IsMongoId()
  medicalSpecialtyId: string;
}
