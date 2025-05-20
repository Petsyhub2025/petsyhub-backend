import { ModelNames } from '@common/constants';
import { androidVersionSchemaFactory } from '@common/schemas/mongoose/app-versions/android-version';
import { baseVersionSchemaFactory } from '@common/schemas/mongoose/app-versions/base-version/base-version.schema';
import { iosVersionSchemaFactory } from '@common/schemas/mongoose/app-versions/ios-version';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const BaseVersionsMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.BASE_APP_VERSION,
  inject: [getConnectionToken()],
  useFactory: baseVersionSchemaFactory,
};

const AndroidVersionsMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.ANDROID_APP_VERSION,
  inject: [ModelNames.BASE_APP_VERSION],
  useFactory: androidVersionSchemaFactory,
};

const IosVersionsMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.IOS_APP_VERSION,
  inject: [ModelNames.BASE_APP_VERSION],
  useFactory: iosVersionSchemaFactory,
};

const baseVersionsProviders = [
  BaseVersionsMongooseDynamicModule,
  AndroidVersionsMongooseDynamicModule,
  IosVersionsMongooseDynamicModule,
];

@Module({
  imports: [],
  providers: baseVersionsProviders,
  exports: baseVersionsProviders,
})
export class AppVersionsMongooseModule {}
