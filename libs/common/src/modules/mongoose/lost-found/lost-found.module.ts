import { ModelNames } from '@common/constants';
import { FactoryProvider, Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongooseCommonModule } from '../common';
import { DeepLinkService, FirebaseDynamicLinkService } from '@common/helpers/services';
import { baseLostFoundPostSchemaFactory } from '@common/schemas/mongoose/lost-found/base-lost-found-post.schema';
import { foundPostSchemaFactory } from '@common/schemas/mongoose/lost-found/found-post/found-post.schema';
import { lostPostSchemaFactory } from '@common/schemas/mongoose/lost-found/lost-post/lost-post.schema';

const baseLostPostFoundMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.BASE_LOST_FOUND_POST,
  inject: [getConnectionToken()],
  useFactory: baseLostFoundPostSchemaFactory,
};

const lostPostMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.LOST_POST,
  inject: [
    ModelNames.BASE_LOST_FOUND_POST,
    EventEmitter2,
    getConnectionToken(),
    DeepLinkService,
    FirebaseDynamicLinkService,
  ],
  useFactory: lostPostSchemaFactory,
};

const foundMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.FOUND_POST,
  inject: [
    ModelNames.BASE_LOST_FOUND_POST,
    EventEmitter2,
    getConnectionToken(),
    DeepLinkService,
    FirebaseDynamicLinkService,
  ],
  useFactory: foundPostSchemaFactory,
};

const providers = [baseLostPostFoundMongooseDynamicModule, lostPostMongooseDynamicModule, foundMongooseDynamicModule];

@Module({
  imports: [MongooseCommonModule.forRoot()],
  providers: providers,
  exports: providers,
})
export class LostFoundMongooseModule {}
