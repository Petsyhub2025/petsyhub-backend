import { Inject, Injectable } from '@nestjs/common';
import { IMedicalSpecialtyModel, ModelNames } from '@instapets-backend/common';
import { Types } from 'mongoose';

@Injectable()
export class MedicalSpecialtyService {
  constructor(@Inject(ModelNames.MEDICAL_SPECIALTY) private medicalSpecialtyModel: IMedicalSpecialtyModel) {}

  async getMedicalSpecialties(serviceProvider: string | Types.ObjectId) {
    const medicalSpecialties = await this.medicalSpecialtyModel.find({}, { name: 1, _id: 1 }).lean();
    return medicalSpecialties;
  }
}
