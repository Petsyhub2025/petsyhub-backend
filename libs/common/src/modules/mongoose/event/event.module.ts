import { ModelNames } from '@common/constants';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongooseCommonModule } from '../common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventRsvpMongooseModule } from './event-rsvp';
import { DeepLinkService, FirebaseDynamicLinkService } from '@common/helpers/services';
import { EventEventListener } from '@common/schemas/mongoose/event/event-listeners';
import { eventSchemaFactory } from '@common/schemas/mongoose/event/event.schema';

const eventMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.EVENT,
  inject: [getConnectionToken(), DeepLinkService, FirebaseDynamicLinkService, EventEmitter2],
  useFactory: eventSchemaFactory,
};

const providers = [eventMongooseDynamicModule, EventEventListener];

@Module({
  imports: [MongooseCommonModule.forRoot(), EventRsvpMongooseModule],
  providers: providers,
  exports: providers,
})
export class EventMongooseModule {}
