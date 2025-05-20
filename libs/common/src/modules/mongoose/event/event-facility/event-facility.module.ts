import { ModelNames } from '@common/constants';
import { eventFacilitySchemaFactory } from '@common/schemas/mongoose/event/event-facility';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const eventFacilityMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.EVENT_FACILITY,
  inject: [getConnectionToken()],
  useFactory: eventFacilitySchemaFactory,
};

const providers = [eventFacilityMongooseDynamicModule];

@Module({
  imports: [],
  providers: providers,
  exports: providers,
})
export class EventFacilityMongooseModule {}
