import { ModelNames } from '@common/constants';
import { medicalSpecialtySchemaFactory } from '@common/schemas/mongoose/branch/medical-specialties';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const medicalSpecialtyMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.MEDICAL_SPECIALTY,
  inject: [getConnectionToken()],
  useFactory: medicalSpecialtySchemaFactory,
};

const medicalSpecialtyProviders = [medicalSpecialtyMongooseDynamicModule];

@Module({
  imports: [],
  providers: medicalSpecialtyProviders,
  exports: medicalSpecialtyProviders,
})
export class MedicalSpecialtyMongooseModule {}
