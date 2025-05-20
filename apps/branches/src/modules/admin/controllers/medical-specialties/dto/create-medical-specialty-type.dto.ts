import { PickType } from '@nestjs/swagger';
import { MedicalSpecialty } from '@instapets-backend/common';

export class CreateMedicalSpecialtyDto extends PickType(MedicalSpecialty, ['name'] as const) {}
