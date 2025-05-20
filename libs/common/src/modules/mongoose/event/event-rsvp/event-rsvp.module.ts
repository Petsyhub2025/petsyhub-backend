import { ModelNames } from '@common/constants';
import { eventRsvpSchemaFactory } from '@common/schemas/mongoose/event/event-rsvp';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const eventRsvpMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.EVENT_RSVP,
  inject: [getConnectionToken()],
  useFactory: eventRsvpSchemaFactory,
};

const providers = [eventRsvpMongooseDynamicModule];

@Module({
  imports: [],
  providers: providers,
  exports: providers,
})
export class EventRsvpMongooseModule {}
