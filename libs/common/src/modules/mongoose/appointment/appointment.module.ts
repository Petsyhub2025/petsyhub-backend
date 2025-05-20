import { ModelNames } from '@common/constants';
import { DeepLinkService, FirebaseDynamicLinkService } from '@common/helpers/services';
import { baseAppointmentSchemaFactory } from '@common/schemas/mongoose/appointment/base-appointment.schema';
import { clinicAppointmentSchemaFactory } from '@common/schemas/mongoose/appointment/clinic-appointment';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongooseCommonModule } from '@common/modules/mongoose/common';

const AppointmentMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.BASE_APPOINTMENT,
  inject: [getConnectionToken()],
  useFactory: baseAppointmentSchemaFactory,
};

const appointmentDiscriminatorProviders: FactoryProvider[] = [
  {
    provide: ModelNames.CLINIC_APPOINTMENT,
    inject: [ModelNames.BASE_APPOINTMENT, DeepLinkService, FirebaseDynamicLinkService],
    useFactory: clinicAppointmentSchemaFactory,
  },
];

const appointmentProviders = [AppointmentMongooseDynamicModule, ...appointmentDiscriminatorProviders];

@Module({
  imports: [MongooseCommonModule.forRoot()],
  providers: appointmentProviders,
  exports: appointmentProviders,
})
export class AppointmentMongooseModule {}
