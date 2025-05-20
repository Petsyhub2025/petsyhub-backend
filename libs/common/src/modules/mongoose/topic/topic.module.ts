import { ModelNames } from '@common/constants';
import { topicSchemaFactory } from '@common/schemas/mongoose/topic';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const TopicMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.TOPIC,
  inject: [getConnectionToken()],
  useFactory: topicSchemaFactory,
};

const topicProviders = [TopicMongooseDynamicModule];

@Module({
  imports: [],
  providers: topicProviders,
  exports: topicProviders,
})
export class TopicMongooseModule {}
