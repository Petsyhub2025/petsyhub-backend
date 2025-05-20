import { ModelNames } from '@common/constants';
import { areaSchemaFactory } from '@common/schemas/mongoose/area';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const AreaMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.AREA,
  inject: [getConnectionToken()],
  useFactory: areaSchemaFactory,
};

const areaProviders = [AreaMongooseDynamicModule];

@Module({
  imports: [],
  providers: areaProviders,
  exports: areaProviders,
})
export class AreaMongooseModule {}
