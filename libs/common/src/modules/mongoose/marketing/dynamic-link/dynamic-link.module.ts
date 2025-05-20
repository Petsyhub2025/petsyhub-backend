import { ModelNames } from '@common/constants';
import { DeepLinkService, FirebaseDynamicLinkService } from '@common/helpers/services';
import { AppConfig } from '@common/modules/env-config/services/app-config';
import { dynamicLinkSchemaFactory } from '@common/schemas/mongoose/marketing/dynamic-link/dynamic-link.schema';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongooseCommonModule } from '@common/modules/mongoose/common';

const dynamicLinkMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.DYNAMIC_LINK,
  inject: [getConnectionToken(), AppConfig, DeepLinkService, FirebaseDynamicLinkService],
  useFactory: dynamicLinkSchemaFactory,
};

const providers = [dynamicLinkMongooseDynamicModule];

@Module({
  imports: [MongooseCommonModule.forRoot()],
  providers: providers,
  exports: providers,
})
export class DynamicLinkMongooseModule {}
