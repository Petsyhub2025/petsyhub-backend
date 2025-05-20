import { ModelNames } from '@common/constants';
import { eventCategorySchemaFactory } from '@common/schemas/mongoose/event/event-category';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const eventCategoryMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.EVENT_CATEGORY,
  inject: [getConnectionToken()],
  useFactory: eventCategorySchemaFactory,
};

const providers = [eventCategoryMongooseDynamicModule];

@Module({
  imports: [],
  providers: providers,
  exports: providers,
})
export class EventCategoryMongooseModule {}
