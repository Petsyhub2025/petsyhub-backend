import { PartialType, PickType } from '@nestjs/swagger';
import { MedicalSpecialty } from '@instapets-backend/common';

export class UpdateMedicalSpecialtyDto extends PartialType(PickType(MedicalSpecialty, ['name'] as const)) {}
